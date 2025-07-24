import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GPT-ASSISTANT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
    
    logStep("User authenticated", { userId: user.id });

    const { message, conversationHistory } = await req.json();
    
    if (!message) {
      throw new Error("Message is required");
    }

    logStep("Processing message", { messageLength: message.length });

    // Credit repair context and system prompt
    const systemPrompt = `You are a professional credit repair assistant for Express Credit & Financial Solutions. Your role is to:

1. Help users understand credit repair processes and strategies
2. Explain dispute outcomes and next steps
3. Guide users through the dashboard features
4. Provide FCRA-compliant advice
5. Answer questions about credit scores, reports, and improvement strategies

Guidelines:
- Always provide accurate, FCRA-compliant information
- Be professional but approachable
- Focus on educational content and actionable advice
- If asked about specific legal advice, recommend consulting with a qualified attorney
- Keep responses concise but helpful
- Reference Express Credit & Financial Solutions' services when relevant

Available platform features to reference:
- AI-powered dispute letter generation
- Credit score tracking
- Document upload and management
- Educational resources
- Multiple membership tiers (Basic, Pro, Elite, All Exclusive)

Never provide:
- Specific legal advice
- Guarantees about credit score improvements
- Advice that violates FCRA or other regulations
- Personal financial advice beyond general credit improvement strategies`;

    // Prepare conversation for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message }
    ];

    logStep("Making OpenAI API call");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      logStep("OpenAI API error", { status: openaiResponse.status, error: errorData });
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("No response from OpenAI");
    }

    logStep("Successfully generated response", { responseLength: assistantMessage.length });

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        usage: openaiData.usage 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in gpt-assistant", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});