import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Analyze the credit report with OpenAI
    const analysisPrompt = `
You are a credit repair expert analyzing a credit report PDF. Identify accounts that should be disputed based on the following criteria:

1. COLLECTIONS ACCOUNTS: Any accounts in collections status
2. CHARGE-OFFS: Any accounts marked as charged off
3. LATE PAYMENTS: Accounts with 30, 60, 90+ day late payments in the last 2 years
4. DUPLICATE ACCOUNTS: The same debt reported by multiple creditors or collection agencies
5. INACCURATE INFORMATION: Accounts with wrong balances, dates, or personal information
6. EXPIRED DEBTS: Accounts past the statute of limitations (7+ years old)

For each flagged account, provide:
- Creditor name
- Account number (if visible)
- Account type (credit card, loan, etc.)
- Current balance
- Account status
- Reason for flagging
- Confidence level (0.0-1.0)

Return the results as a JSON array with this structure:
{
  "flaggedAccounts": [
    {
      "creditorName": "Example Bank",
      "accountNumber": "****1234",
      "accountType": "Credit Card",
      "balance": 2500.00,
      "status": "Collection",
      "flagReason": "Account in collections - verify debt validity and collection procedures",
      "confidence": 0.95,
      "additionalDetails": {
        "originalCreditor": "Example Bank",
        "collectionAgency": "ABC Collections",
        "reportedBalance": 2500.00,
        "dateOpened": "2020-01-15",
        "lastActivity": "2023-06-10"
      }
    }
  ]
}

Analyze the attached credit report PDF and identify all disputable items.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a credit repair expert that analyzes credit reports to identify disputable items. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Data}`
                }
              }
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
    
    console.log('OpenAI analysis result:', analysisContent);

    let analysisData;
    try {
      analysisData = JSON.parse(analysisContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = analysisContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    // Store flagged disputes in the database
    const flaggedAccounts = analysisData.flaggedAccounts || [];
    const insertPromises = flaggedAccounts.map(async (account: any) => {
      const { error: insertError } = await supabase
        .from('flagged_disputes')
        .insert({
          user_id: user.id,
          credit_report_id: reportId,
          creditor_name: account.creditorName,
          account_number: account.accountNumber,
          account_type: account.accountType,
          balance: account.balance,
          status: account.status,
          flag_reason: account.flagReason,
          flag_confidence: account.confidence,
          additional_details: account.additionalDetails || {}
        });

      if (insertError) {
        console.error('Error inserting flagged dispute:', insertError);
        throw insertError;
      }
    });

    await Promise.all(insertPromises);

    // Update the credit report upload record with analysis results
    const { error: updateError } = await supabase
      .from('credit_report_uploads')
      .update({
        analysis_status: 'completed',
        flagged_accounts_count: flaggedAccounts.length,
        ai_analysis_summary: `Found ${flaggedAccounts.length} potential dispute opportunities`
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('Error updating upload record:', updateError);
    }

    // Log the analysis completion
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'CREDIT_REPORT_ANALYZED',
      table_name: 'documents',
      record_id: reportId,
      details: {
        fileName: fileName,
        flaggedAccountsCount: flaggedAccounts.length
      },
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
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});