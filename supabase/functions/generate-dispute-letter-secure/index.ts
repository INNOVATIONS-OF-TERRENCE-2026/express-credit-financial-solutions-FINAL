import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { disputeId } = await req.json();

    if (!disputeId) {
      throw new Error('Dispute ID is required');
    }

    // Fetch dispute details with enhanced security logging
    const { data: dispute, error: disputeError } = await supabase
      .from('dispute_letters')
      .select('*')
      .eq('id', disputeId)
      .eq('user_id', user.id) // Ensure user can only access their own disputes
      .single();

    if (disputeError) {
      console.error('Error fetching dispute:', disputeError);
      throw new Error('Failed to fetch dispute details');
    }

    // Log security event
    await supabase.rpc('log_security_event', {
      p_action: 'DISPUTE_LETTER_GENERATION_STARTED',
      p_table_name: 'dispute_letters',
      p_record_id: disputeId,
      p_details: { creditor_name: dispute.creditor_name },
      p_security_level: 'info',
      p_risk_score: 0
    });

    // Fetch user information
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user.id);
    if (userError) {
      console.error('Error fetching user:', userError);
      throw new Error('Failed to fetch user information');
    }

    // Fetch client data if available
    let clientData = null;
    if (dispute.client_id) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', dispute.client_id)
        .eq('user_id', user.id) // Security: ensure client belongs to user
        .single();
      
      if (!error) {
        clientData = data;
      }
    }

    // Enhanced prompt with security context
    const prompt = `Generate a professional credit dispute letter with the following details:

DISPUTE INFORMATION:
- Creditor Name: ${dispute.creditor_name}
- Account Number: ${dispute.account_number}
- Issue Type: ${dispute.issue_type}
- Additional Notes: ${dispute.additional_notes || 'None'}

USER INFORMATION:
- Email: ${userData.user?.email || 'Not provided'}

${clientData ? `
CLIENT INFORMATION:
- Full Name: ${clientData.full_name}
- Date of Birth: ${clientData.date_of_birth}
- Phone Number: ${clientData.phone_number}
- Email Address: ${clientData.email_address}
` : ''}

REQUIREMENTS:
- Use formal business letter format
- Include proper legal language for credit disputes
- Reference Fair Credit Reporting Act (FCRA) rights
- Request investigation and removal of inaccurate information
- Include standard 30-day investigation timeline
- Maintain professional tone throughout
- Include placeholder for signature and date

The letter should be comprehensive, legally sound, and ready for mailing to the creditor.`;

    // Call OpenAI API with updated model
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Updated to supported model
        messages: [
          {
            role: 'system',
            content: 'You are a professional legal document writer specializing in credit dispute letters. Generate formal, legally compliant dispute letters that follow FCRA guidelines.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openAIData = await response.json();
    const generatedLetter = openAIData.choices[0].message.content;

    // Update the dispute letter with enhanced audit trail
    const { error: updateError } = await supabase
      .from('dispute_letters')
      .update({ 
        generated_letter: generatedLetter,
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId)
      .eq('user_id', user.id); // Security: ensure user can only update their own disputes

    if (updateError) {
      console.error('Error updating dispute letter:', updateError);
      throw new Error('Failed to save generated letter');
    }

    // Log successful generation
    await supabase.rpc('log_security_event', {
      p_action: 'DISPUTE_LETTER_GENERATED',
      p_table_name: 'dispute_letters',
      p_record_id: disputeId,
      p_details: { 
        creditor_name: dispute.creditor_name,
        letter_length: generatedLetter.length 
      },
      p_security_level: 'info',
      p_risk_score: 0
    });

    return new Response(JSON.stringify({ 
      success: true,
      generatedLetter,
      disputeId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-dispute-letter-secure function:', error);
    
    // Log security event for errors
    try {
      await supabase.rpc('log_security_event', {
        p_action: 'DISPUTE_LETTER_GENERATION_ERROR',
        p_table_name: 'dispute_letters',
        p_details: { error: error.message },
        p_security_level: 'error',
        p_risk_score: 5
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});