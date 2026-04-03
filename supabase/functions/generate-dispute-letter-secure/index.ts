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

const LETTER_TYPE_PROMPTS: Record<string, string> = {
  '605B_time_barred': `Generate a dispute letter under FCRA Section 605(b). This account has exceeded the 7-year reporting period (10 years for bankruptcies). Cite 15 U.S.C. § 1681c and demand immediate removal of the time-barred item. Reference the date of first delinquency and calculate the reporting expiration.`,
  '611_verification': `Generate a dispute letter under FCRA Section 611. Request that the credit bureau verify the accuracy of this account within 30 days per 15 U.S.C. § 1681i. State that failure to verify must result in deletion. Demand the method of verification be provided.`,
  '623_furnisher_dispute': `Generate a dispute letter under FCRA Section 623 directed at the furnisher/creditor. Cite 15 U.S.C. § 1681s-2(b) requiring the furnisher to investigate disputed information. Reference their obligation to report accurate information and the penalties for willful non-compliance.`,
  'validation_letter': `Generate a debt validation letter under FDCPA Section 809. Cite 15 U.S.C. § 1692g demanding validation of the debt within 30 days. Request: original signed agreement, complete payment history, proof of assignment/ownership, and license to collect in the consumer's state.`,
  'standard_dispute': `Generate a standard FCRA-compliant dispute letter. Reference Section 611 (15 U.S.C. § 1681i) requiring investigation within 30 days. Clearly state the inaccuracy, request correction, and include a demand for the method of verification.`,
  'goodwill_letter': `Generate a goodwill adjustment letter. This is NOT a dispute — it's a polite request to the creditor to remove a negative mark as a gesture of goodwill. Emphasize the consumer's positive payment history, loyalty, and any extenuating circumstances. Do NOT cite legal statutes.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { disputeId, letterType } = await req.json();

    if (!disputeId) {
      throw new Error('Dispute ID is required');
    }

    const { data: dispute, error: disputeError } = await supabase
      .from('dispute_letters')
      .select('*')
      .eq('id', disputeId)
      .eq('user_id', user.id)
      .single();

    if (disputeError) {
      throw new Error('Failed to fetch dispute details');
    }

    await supabase.rpc('log_security_event', {
      p_action: 'DISPUTE_LETTER_GENERATION_STARTED',
      p_table_name: 'dispute_letters',
      p_record_id: disputeId,
      p_details: { creditor_name: dispute.creditor_name, letter_type: letterType },
      p_security_level: 'info',
      p_risk_score: 0
    });

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user.id);
    if (userError) {
      throw new Error('Failed to fetch user information');
    }

    let clientData = null;
    if (dispute.client_id) {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', dispute.client_id)
        .eq('user_id', user.id)
        .single();
      clientData = data;
    }

    // Determine letter-type-specific instructions
    const resolvedType = letterType || dispute.letter_type || 'standard_dispute';
    const typeInstructions = LETTER_TYPE_PROMPTS[resolvedType] || LETTER_TYPE_PROMPTS['standard_dispute'];

    const prompt = `${typeInstructions}

DISPUTE INFORMATION:
- Creditor Name: ${dispute.creditor_name}
- Account Number: ${dispute.account_number}
- Issue Type: ${dispute.issue_type}
- Additional Notes: ${dispute.additional_notes || 'None'}

USER INFORMATION:
- Email: ${userData.user?.email || 'Not provided'}

${clientData ? `
CLIENT INFORMATION:
- Full Name: ${clientData.full_name}
- Date of Birth: ${clientData.date_of_birth || clientData.dob}
- Phone Number: ${clientData.phone_number || clientData.phone}
- Email Address: ${clientData.email_address || clientData.email}
` : ''}

REQUIREMENTS:
- Use formal business letter format
- Include proper legal language
- Include standard 30-day investigation timeline (except for goodwill letters)
- Maintain professional tone throughout
- Include placeholder for signature and date`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional legal document writer specializing in credit dispute letters. Generate formal, legally compliant dispute letters that follow FCRA and FDCPA guidelines.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openAIData = await response.json();
    const generatedLetter = openAIData.choices[0].message.content;

    // Store previous draft
    const previousDrafts = dispute.previous_drafts || [];
    if (dispute.generated_letter) {
      previousDrafts.push({
        version: dispute.draft_version || 1,
        letter: dispute.generated_letter,
        generated_at: dispute.updated_at || dispute.created_at,
      });
    }

    const { error: updateError } = await supabase
      .from('dispute_letters')
      .update({ 
        generated_letter: generatedLetter,
        letter_type: resolvedType,
        draft_version: (dispute.draft_version || 1) + 1,
        previous_drafts: previousDrafts,
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error('Failed to save generated letter');
    }

    await supabase.rpc('log_security_event', {
      p_action: 'DISPUTE_LETTER_GENERATED',
      p_table_name: 'dispute_letters',
      p_record_id: disputeId,
      p_details: { 
        creditor_name: dispute.creditor_name,
        letter_type: resolvedType,
        letter_length: generatedLetter.length 
      },
      p_security_level: 'info',
      p_risk_score: 0
    });

    return new Response(JSON.stringify({ 
      success: true,
      generatedLetter,
      disputeId,
      letterType: resolvedType,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-dispute-letter-secure function:', error);
    
    try {
      await supabase.rpc('log_security_event', {
        p_action: 'DISPUTE_LETTER_GENERATION_ERROR',
        p_table_name: 'dispute_letters',
        p_details: { error: (error as Error).message },
        p_security_level: 'error',
        p_risk_score: 5
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
