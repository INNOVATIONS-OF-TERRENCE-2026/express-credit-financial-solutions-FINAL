import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LETTER_PROMPTS: Record<string, string> = {
  '605B_time_barred': `Generate a dispute letter under FCRA Section 605(b). This account has exceeded the 7-year reporting period. Cite 15 U.S.C. § 1681c and demand immediate removal.`,
  '611_verification': `Generate a dispute letter under FCRA Section 611. Request verification within 30 days per 15 U.S.C. § 1681i. Failure to verify must result in deletion.`,
  '623_furnisher_dispute': `Generate a dispute letter under FCRA Section 623 directed at the furnisher. Cite 15 U.S.C. § 1681s-2(b) requiring investigation.`,
  'standard_dispute': `Generate a standard FCRA-compliant dispute letter. Reference Section 611 (15 U.S.C. § 1681i) requiring investigation within 30 days.`,
};

function pickLetterType(violationType: string): string {
  const v = (violationType || '').toLowerCase();
  if (v.includes('time') || v.includes('expired') || v.includes('old')) return '605B_time_barred';
  if (v.includes('furnisher') || v.includes('creditor')) return '623_furnisher_dispute';
  if (v.includes('verification') || v.includes('inaccurate')) return '611_verification';
  return 'standard_dispute';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated caller (PII access)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = userData.user.id;
    // Admin-only: this function accesses arbitrary client PII via service role.
    const { data: roleRow } = await supabase
      .from('user_roles').select('role').eq('user_id', callerId).eq('role', 'admin').maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { client_id, flagged_accounts, mode } = await req.json();

    if (!client_id) throw new Error('client_id is required');

    // Fetch client
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single();

    if (clientErr || !client) throw new Error('Client not found');

    // Fetch autonomous settings for thresholds
    const { data: settings } = await supabase
      .from('autonomous_settings')
      .select('*')
      .limit(1)
      .single();

    // Get flagged accounts - either provided or fetch from flagged_disputes
    let accounts = flagged_accounts;
    if (!accounts || accounts.length === 0) {
      const { data: flagged } = await supabase
        .from('flagged_disputes')
        .select('*')
        .eq('client_id', client_id)
        .eq('status', 'pending');
      accounts = (flagged || []).map((f: any) => ({
        account_name: f.account_name || f.creditor_name || 'Unknown Account',
        account_number_last4: f.account_number?.slice(-4) || '****',
        bureau: f.bureau || 'All Bureaus',
        violation_type: f.violation_type || f.reason || 'inaccurate_reporting',
        dispute_reason: f.dispute_reason || f.reason || 'Information is inaccurate',
        flagged_dispute_id: f.id,
      }));
    }

    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ success: true, cases_created: 0, message: 'No flagged accounts found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];
    const bureaus = ['Experian', 'Equifax', 'TransUnion'];

    for (const account of accounts) {
      const targetBureaus = account.bureau === 'All Bureaus' ? bureaus : [account.bureau];

      for (const bureau of targetBureaus) {
        const letterType = pickLetterType(account.violation_type);
        const prompt = LETTER_PROMPTS[letterType] || LETTER_PROMPTS['standard_dispute'];

        // Generate letter via OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a professional credit dispute letter writer specializing in FCRA and FDCPA compliance. Generate formal, legally compliant dispute letters.' },
              { role: 'user', content: `${prompt}

CONSUMER INFORMATION:
- Full Name: ${client.full_name}
- Address: ${client.address}
- Date of Birth: ${client.dob}
- SSN Last 4: ${client.ssn_last4}

ACCOUNT IN DISPUTE:
- Account Name: ${account.account_name}
- Account Number (last 4): ${account.account_number_last4}
- Bureau: ${bureau}
- Violation Type: ${account.violation_type}
- Dispute Reason: ${account.dispute_reason}

Generate a complete, ready-to-send dispute letter addressed to ${bureau}. Include today's date, consumer info, account details, legal citations, and a clear demand for resolution within 30 days.` }
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          console.error('OpenAI error:', await response.text());
          continue;
        }

        const aiData = await response.json();
        const letterContent = aiData.choices[0].message.content;
        const confidence = 85; // Base confidence for AI-generated letters

        // Insert generated letter into the live dispute_letters table
        const { data: disputeCase, error: caseErr } = await supabase
          .from('dispute_letters')
          .insert({
            client_id: client.id,
            user_id: client.user_id || null,
            bureau,
            full_name: client.full_name,
            client_name: client.full_name,
            account_name: account.account_name,
            creditor_name: account.account_name,
            account_number: account.account_number_last4,
            issue_type: account.violation_type,
            violation_notes: account.violation_type,
            dispute_reason: account.dispute_reason,
            generated_letter: letterContent,
            letter_body: letterContent,
            letter_title: `${bureau} ${letterType.replace(/_/g, ' ')}`,
            letter_type: letterType,
            case_status: (mode === 'auto' && confidence >= (settings?.auto_attach_threshold || 85)) ? 'approved' : 'needs_admin_review',
            additional_notes: account.flagged_dispute_id ? `Generated from flagged dispute ${account.flagged_dispute_id}` : null,
          })
          .select('id, case_status')
          .single();

        if (caseErr) { console.error('Case insert error:', caseErr); continue; }

        results.push({
          case_id: disputeCase.id,
          bureau,
          account: account.account_name,
          letter_type: letterType,
          confidence,
          status: disputeCase.case_status,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      cases_created: results.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-dispute-ai:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
