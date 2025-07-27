import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DisputePreviewRequest {
  creditorName: string;
  accountNumber: string;
  violationType: string;
  additionalNotes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { creditorName, accountNumber, violationType, additionalNotes }: DisputePreviewRequest = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Generate a professional credit dispute letter preview for the following:
    
Creditor: ${creditorName}
Account Number: ${accountNumber}
Violation Type: ${violationType}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ''}

Please create a formal dispute letter that:
1. Clearly states the issue with the account
2. References relevant consumer protection laws (FCRA, FDCPA)
3. Requests investigation and correction
4. Maintains a professional tone
5. Is approximately 200-300 words

Format as a complete letter with proper business formatting.`;

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
            content: 'You are a professional credit repair specialist who creates formal dispute letters for clients. Your letters should be professional, legally sound, and effective.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const letter = data.choices?.[0]?.message?.content || 'Error generating letter preview';

    return new Response(JSON.stringify({ 
      letter,
      creditorName,
      accountNumber,
      violationType 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error generating dispute preview:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate dispute letter preview' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});