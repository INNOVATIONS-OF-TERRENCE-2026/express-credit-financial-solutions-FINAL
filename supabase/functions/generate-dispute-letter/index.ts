import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { disputeId } = await req.json();

    // Get dispute data from Supabase
    const { data: dispute, error: disputeError } = await supabase
      .from('dispute_letters')
      .select('*')
      .eq('id', disputeId)
      .single();

    if (disputeError || !dispute) {
      throw new Error('Dispute not found');
    }

    // Get user data
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(dispute.user_id);
    
    if (userError || !userData.user) {
      throw new Error('User not found');
    }

    const userName = userData.user.email; // Use email as name fallback

    const prompt = `You are an expert credit dispute assistant working for a company called Express Credit & Financial Solutions. Your job is to generate personalized and professional credit dispute letters.

Use the following values pulled from Supabase:

- User Name: ${userName}
- Creditor Name: ${dispute.creditor_name}
- Account Number: ${dispute.account_number}
- Issue Type: ${dispute.issue_type}
- Additional Notes: ${dispute.additional_notes || 'None provided'}

Generate a FCRA-compliant dispute letter that addresses the issue type. If the user provided additional notes, incorporate those into the dispute. Ensure the letter is clear, respectful, and legally sound under the Fair Credit Reporting Act (FCRA).

Output the result as a professional dispute letter formatted in plain text.

Sign the letter as:

${userName}  
Express Credit & Financial Solutions`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional credit dispute letter generator.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const generatedLetter = data.choices[0].message.content;

    // Update the dispute letter in Supabase
    const { error: updateError } = await supabase
      .from('dispute_letters')
      .update({ generated_letter: generatedLetter })
      .eq('id', disputeId);

    if (updateError) {
      throw new Error('Failed to save generated letter');
    }

    return new Response(JSON.stringify({ generatedLetter }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-dispute-letter function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});