import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreditAnalysisRequest {
  creditReportText: string;
  clientName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { creditReportText, clientName }: CreditAnalysisRequest = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Analyze the following credit report for ${clientName} and identify potential violations or disputable items:

${creditReportText}

Please provide:
1. A summary of potential credit violations (incorrect information, outdated items, etc.)
2. List of accounts that may be disputable
3. Recommended dispute strategies
4. Priority level for each identified issue (High, Medium, Low)
5. Estimated impact on credit score if resolved

Format the response as a professional analysis report that the client can easily understand.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an expert credit analyst who specializes in identifying credit report errors and violations. Provide detailed, actionable analysis for credit repair purposes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Error generating analysis';

    return new Response(JSON.stringify({ 
      analysis,
      clientName,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error analyzing credit report:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to analyze credit report' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});