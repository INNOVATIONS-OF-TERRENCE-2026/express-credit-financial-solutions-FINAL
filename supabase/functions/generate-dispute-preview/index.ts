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
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { creditorName, accountNumber, violationType, additionalNotes } = body;

    // Input validation
    if (!creditorName || typeof creditorName !== 'string' || creditorName.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid creditorName' }), { status: 400, headers: corsHeaders });
    }
    if (!accountNumber || typeof accountNumber !== 'string' || accountNumber.length > 50) {
      return new Response(JSON.stringify({ error: 'Invalid accountNumber' }), { status: 400, headers: corsHeaders });
    }
    if (!violationType || typeof violationType !== 'string' || violationType.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid violationType' }), { status: 400, headers: corsHeaders });
    }
    const notes = (additionalNotes && typeof additionalNotes === 'string') ? additionalNotes.substring(0, 1000) : '';

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Generate a professional credit dispute letter preview for the following:
    
Creditor: ${creditorName}
Account Number: ${accountNumber}
Violation Type: ${violationType}
${notes ? `Additional Notes: ${notes}` : ''}

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
          { role: 'system', content: 'You are a professional credit repair specialist who creates formal dispute letters for clients. Your letters should be professional, legally sound, and effective.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
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
      error: 'Failed to generate dispute letter preview' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
