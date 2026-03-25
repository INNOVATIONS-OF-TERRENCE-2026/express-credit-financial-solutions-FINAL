import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  console.log('Credit report analysis request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { creditReportPath, fileName, reportId } = await req.json();
    console.log('Analyzing credit report:', fileName, 'for user:', user.id);

    // Validate file ownership - path must start with userId
    if (creditReportPath && !creditReportPath.startsWith(`${user.id}/`)) {
      throw new Error('Unauthorized file access');
    }

    // Download the PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('credit-reports')
      .download(creditReportPath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error('Failed to download credit report');
    }

    // Convert PDF to base64 for OpenAI analysis
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const analysisPrompt = `
You are a credit repair expert analyzing a credit report PDF. Identify accounts that should be disputed based on:

1. COLLECTIONS ACCOUNTS
2. CHARGE-OFFS
3. LATE PAYMENTS (30, 60, 90+ days in last 2 years)
4. DUPLICATE ACCOUNTS
5. INACCURATE INFORMATION
6. EXPIRED DEBTS (7+ years old)
7. FCRA VIOLATIONS: Section 605(b) time-barred items, Section 611 verification failures, Section 623 furnisher inaccuracies, re-aging, mixed files

For each flagged account, provide:
- creditorName, accountNumber, accountType, balance, status
- flagReason, confidence (0.0-1.0)
- violationType (one of: 605b, 611, 623, re_aging, mixed_file, or null)
- recommendedDisputeType (one of: 605B_time_barred, 611_verification, 623_furnisher_dispute, validation_letter, standard_dispute, goodwill_letter)
- additionalDetails: { originalCreditor, collectionAgency, reportedBalance, dateOpened, lastActivity }

Also provide:
- overallUtilization (credit utilization percentage)
- fcraViolationCount (total FCRA violations found)

Return as JSON:
{
  "flaggedAccounts": [...],
  "overallUtilization": number,
  "fcraViolationCount": number
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a credit repair expert that analyzes credit reports to identify disputable items and FCRA violations. Always respond with valid JSON only.' },
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64Data}` } }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiResult = await openaiResponse.json();
    const analysisContent = openaiResult.choices[0].message.content;

    let analysisData;
    try {
      analysisData = JSON.parse(analysisContent);
    } catch {
      const jsonMatch = analysisContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    // Store flagged disputes - fixed: proper per-row error handling
    const flaggedAccounts = analysisData.flaggedAccounts || [];
    const insertErrors: string[] = [];

    for (const account of flaggedAccounts) {
      const { error: insertError } = await supabase
        .from('flagged_disputes')
        .insert({
          user_id: user.id,
          credit_report_id: reportId,
          creditor_name: account.creditorName,
          account_number: account.accountNumber,
          account_type: account.accountType,
          balance: account.balance,
          status: account.status || 'flagged',
          flag_reason: account.flagReason,
          flag_confidence: account.confidence,
          violation_type: account.violationType || null,
          recommended_dispute_type: account.recommendedDisputeType || 'standard_dispute',
          additional_details: account.additionalDetails || {}
        });

      if (insertError) {
        console.error('Error inserting flagged dispute:', insertError);
        insertErrors.push(`${account.creditorName}: ${insertError.message}`);
      }
    }

    // Update credit report upload record
    const { error: updateError } = await supabase
      .from('credit_report_uploads')
      .update({
        analysis_status: 'completed',
        flagged_accounts_count: flaggedAccounts.length,
        ai_analysis_summary: `Found ${flaggedAccounts.length} potential dispute opportunities (${analysisData.fcraViolationCount || 0} FCRA violations)`
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('Error updating upload record:', updateError);
    }

    // Insert AI analysis results
    await supabase.from('ai_analysis_results').insert({
      user_id: user.id,
      credit_report_id: reportId,
      analysis_type: 'full',
      flagged_count: flaggedAccounts.length,
      fcra_violation_count: analysisData.fcraViolationCount || 0,
      overall_utilization: analysisData.overallUtilization || null,
      summary: { flaggedAccounts: flaggedAccounts.length, fcraViolations: analysisData.fcraViolationCount || 0 },
      raw_result: analysisData,
      model_used: 'gpt-4.1-2025-04-14',
    });

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'CREDIT_REPORT_ANALYZED',
      table_name: 'documents',
      record_id: reportId,
      details: { fileName, flaggedAccountsCount: flaggedAccounts.length, insertErrors: insertErrors.length },
      security_level: 'info'
    });

    console.log(`Analysis completed: ${flaggedAccounts.length} accounts flagged for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        flaggedAccountsCount: flaggedAccounts.length,
        message: `Analysis complete. Found ${flaggedAccounts.length} accounts that may need to be disputed.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-credit-report function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze credit report', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
