import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
    const plaidSecret = Deno.env.get('PLAID_SECRET');
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';
    
    if (!plaidClientId || !plaidSecret) {
      throw new Error('PLAID_CLIENT_ID and PLAID_SECRET must be set');
    }

    // Get user from Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create Plaid link token
    const plaidResponse = await fetch(`https://${plaidEnv}.api.plaid.com/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': plaidClientId,
        'PLAID-SECRET': plaidSecret,
      },
      body: JSON.stringify({
        client_name: 'Express Credit & Financial Solutions',
        country_codes: ['US'],
        language: 'en',
        user: {
          client_user_id: user.id,
        },
        products: ['auth', 'transactions'],
        required_if_supported_products: ['identity'],
        optional_products: ['assets'],
      }),
    });

    const plaidData = await plaidResponse.json();

    if (!plaidResponse.ok) {
      throw new Error(`Plaid API error: ${plaidData.error_message}`);
    }

    return new Response(
      JSON.stringify({ link_token: plaidData.link_token }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating Plaid link token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});