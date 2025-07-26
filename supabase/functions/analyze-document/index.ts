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

    const { documentId, fileName } = await req.json();
    logStep("Request data received", { documentId, fileName });

    // Create AI prompt for document analysis
    const prompt = `Analyze this document image and identify what type of document it is. 

    Look for these specific document types:
    - Driver's License or State ID
    - Social Security Card
    - Utility Bill (electricity, gas, water, internet, cable)
    - Lease Agreement or Rental Agreement
    - Pay Stub or Income Statement
    - Bank Statement
    - Other identification or financial document

    For each document, provide:
    1. Document type identification
    2. Brief description (e.g., "Utility bill from TXU Energy dated May 2024")
    3. Suggested tag category: "id_verification", "proof_of_address", "income_verification", or "other"

    Respond in JSON format:
    {
      "documentType": "drivers_license|social_security_card|utility_bill|lease_agreement|pay_stub|bank_statement|other",
      "description": "Brief description of what you see",
      "suggestedTag": "id_verification|proof_of_address|income_verification|other",
      "confidence": "high|medium|low"
    }

    File being analyzed: ${fileName}`;

    logStep("Sending request to OpenAI for document analysis");

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
            content: "You are a document analysis specialist. Analyze documents to identify their type and purpose for credit repair verification."
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
        description: openaiData.choices[0].message.content,
        suggestedTag: "other",
        confidence: "low"
      };
    }

    logStep("Analysis completed", analysisResult);

    // Update document record with AI analysis
    const { error: updateError } = await supabaseClient
      .from('document_uploads')
      .update({
        ai_analysis_result: analysisResult.description,
        document_type: analysisResult.documentType,
        tag: analysisResult.suggestedTag
      })
      .eq('id', documentId);

    if (updateError) {
      logStep("Database update error", updateError);
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    // Send realtime notification to admins about new document upload
    try {
      await supabaseClient
        .channel('admin-notifications')
        .send({
          type: 'broadcast',
          event: 'new_document_upload',
          payload: {
            documentId,
            fileName,
            documentType: analysisResult.documentType,
            userId: user.id,
            timestamp: new Date().toISOString()
          }
        });
    } catch (notificationError) {
      logStep("Notification error (non-critical)", notificationError);
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