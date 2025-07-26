import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-DOCUMENT] ${step}${detailsStr}`);
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

    const { documentId, fileName, fileType } = await req.json();
    logStep("Request data received", { documentId, fileName, fileType });

    // Create AI prompt for document analysis
    const prompt = `Analyze this document and identify what type it is. Based on the filename "${fileName}" and file type "${fileType}", determine:

    1. Document Type: Choose from:
       - drivers_license
       - social_security_card  
       - utility_bill
       - lease_agreement
       - pay_stub
       - other

    2. Tag Category: Choose from:
       - id_verification (for ID cards, licenses, SSN cards)
       - proof_of_address (for utility bills, lease agreements)
       - income_verification (for pay stubs, tax documents)
       - other

    3. Description: Provide a brief description of what this document appears to be.

    Respond in JSON format:
    {
      "documentType": "document_type_here",
      "tag": "tag_category_here", 
      "description": "Brief description of the document"
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
            content: "You are a document classification specialist. Analyze the provided document information and classify it accurately."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
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
        documentType: "other",
        tag: "other",
        description: openaiData.choices[0].message.content
      };
    }

    logStep("Analysis completed", analysisResult);

    // Update document record with AI analysis
    const { error: updateError } = await supabaseClient
      .from('document_uploads')
      .update({
        document_type: analysisResult.documentType,
        tag: analysisResult.tag,
        ai_analysis_result: analysisResult.description
      })
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (updateError) {
      logStep("Database update error", updateError);
      throw new Error(`Failed to update document: ${updateError.message}`);
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
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});