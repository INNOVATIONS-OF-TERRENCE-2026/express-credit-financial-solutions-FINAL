import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-CREDIT-SCAN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    // Create Supabase client with service role for writing
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { fileName, creditReportData } = await req.json();
    logStep("Request data received", { fileName });

    // Create AI prompt for credit report analysis
    const prompt = `Read this credit report data and write a 3-sentence summary of major problems, violations, or dispute opportunities. Use FCRA-compliant language.

    Credit Report Data:
    ${creditReportData}
    
    Please analyze for:
    - Inaccurate or outdated information
    - Potential FCRA violations
    - Accounts that could be disputed
    - Credit score impact factors
    
    Provide:
    1. A 3-sentence summary
    2. A JSON array of flagged accounts for potential disputes
    3. Total number of dispute opportunities found
    
    Format your response as JSON:
    {
      "summary": "3-sentence summary here",
      "flaggedAccounts": [
        {
          "creditorName": "Name",
          "accountNumber": "Number", 
          "issueType": "Issue",
          "reason": "Why it should be disputed"
        }
      ],
      "disputeOpportunities": number
    }`;

    logStep("Sending request to OpenAI");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional credit analyst who identifies FCRA violations and dispute opportunities. Always respond with valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    let analysisResult;
    
    try {
      analysisResult = JSON.parse(openaiData.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysisResult = {
        summary: openaiData.choices[0].message.content,
        flaggedAccounts: [],
        disputeOpportunities: 0
      };
    }

    logStep("Analysis completed", { disputeOpportunities: analysisResult.disputeOpportunities });

    // Save analysis to database
    const { error: insertError } = await supabaseClient
      .from('credit_scan_summaries')
      .insert({
        user_id: user.id,
        file_name: fileName,
        ai_summary: analysisResult.summary,
        flagged_accounts: analysisResult.flaggedAccounts,
        dispute_opportunities: analysisResult.disputeOpportunities
      });

    if (insertError) {
      logStep("Database insert error", insertError);
      throw new Error(`Failed to save analysis: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysisResult 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Internal server error" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});