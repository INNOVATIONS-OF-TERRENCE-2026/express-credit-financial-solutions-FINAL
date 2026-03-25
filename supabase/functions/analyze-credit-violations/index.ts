import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { creditReportText, clientName } = await req.json();

    // Input validation
    if (!creditReportText || typeof creditReportText !== 'string' || creditReportText.length > 50000) {
      return new Response(JSON.stringify({ error: 'Invalid creditReportText (max 50000 chars)' }), { status: 400, headers: corsHeaders });
    }
    if (!clientName || typeof clientName !== 'string' || clientName.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid clientName (max 200 chars)' }), { status: 400, headers: corsHeaders });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Analyze the following credit report for ${clientName} and identify potential violations or disputable items:

${creditReportText.substring(0, 30000)}

Please provide:
1. A summary of potential credit violations (incorrect information, outdated items, etc.)
2. List of accounts that may be disputable
3. Recommended dispute strategies
4. Priority level for each identified issue (High, Medium, Low)
5. Estimated impact on credit score if resolved

Format the response as a professional analysis report.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an expert credit analyst who specializes in identifying credit report errors and violations. Provide detailed, actionable analysis for credit repair purposes.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
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
      error: 'Failed to analyze credit report' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
