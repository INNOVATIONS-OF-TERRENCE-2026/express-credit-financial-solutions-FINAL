import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-CREDIT-ASSISTANT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    if (!openAIApiKey) {
      logStep("Error: OpenAI API key not found");
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, conversationHistory } = await req.json();
    logStep("Received request", { messageLength: message?.length, historyLength: conversationHistory?.length });

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are an expert AI Credit Assistant for Express Credit & Financial Solutions. You help clients understand and improve their credit scores through friendly, professional advice.

AREAS OF EXPERTISE:
- Credit score factors and improvement strategies
- Credit disputes and removal of inaccurate items
- Debt utilization optimization (aim for under 30%, ideally under 10%)
- Credit inquiries (hard vs soft) and their impact
- Collections accounts and settlement strategies
- Credit building with secured cards, authorized user accounts, and credit builder loans
- Credit report analysis and understanding
- FCRA (Fair Credit Reporting Act) rights and protections
- Timeline expectations for credit improvement

COMMUNICATION STYLE:
- Be warm, friendly, and encouraging
- Use simple language, avoid jargon
- Provide actionable, specific advice
- Stay positive and motivating
- Ask clarifying questions when needed
- Acknowledge that credit repair takes time and patience

IMPORTANT GUIDELINES:
- Focus only on credit-related topics
- If asked about non-credit topics, politely redirect to credit questions
- Don't provide legal advice, but mention FCRA rights when relevant
- Encourage users to work with Express Credit & Financial Solutions for personalized strategies
- Always be encouraging about their credit improvement journey
- Mention that results vary and credit repair takes time (typically 3-6 months for significant changes)

RESPONSE FORMAT:
- Keep responses conversational and friendly
- Use bullet points for lists when helpful
- Include specific tips and actionable steps
- End with an encouraging note or question to continue the conversation`
      }
    ];

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory.slice(-10)); // Keep last 10 messages for context
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    logStep("Calling OpenAI API", { messageCount: messages.length });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logStep("OpenAI API error", { status: response.status, error: errorData });
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    logStep("Generated response", { responseLength: assistantMessage?.length });

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in ai-credit-assistant", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: 'Failed to generate response. Please try again.',
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});