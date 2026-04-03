import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const exchangeTokenSchema = z.object({
  public_token: z.string()
    .trim()
    .min(1, "Public token is required")
    .max(500, "Public token too long"),
  institution: z.object({
    name: z.string()
      .trim()
      .min(1, "Institution name is required")
      .max(100, "Institution name too long")
  }),
  accounts: z.array(z.object({
    id: z.string()
      .trim()
      .min(1, "Account ID is required")
      .max(100, "Account ID too long"),
    type: z.string()
      .trim()
      .min(1, "Account type is required")
      .max(50, "Account type too long"),
    subtype: z.string()
      .trim()
      .max(50, "Account subtype too long")
      .optional()
      .nullable()
  })).min(1, "At least one account is required")
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const requestBody = await req.json();
    const validationResult = exchangeTokenSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Validation failed:', errors);
      return new Response(JSON.stringify({ 
        error: "Invalid input",
        details: errors 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { public_token, institution, accounts } = validationResult.data;
    
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
    const plaidSecret = Deno.env.get('PLAID_SECRET');
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';
    
    if (!plaidClientId || !plaidSecret) {
      throw new Error('PLAID_CLIENT_ID and PLAID_SECRET must be set');
    }

    // Get user from Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Exchange public token for access token
    const exchangeResponse = await fetch(`https://${plaidEnv}.api.plaid.com/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': plaidClientId,
        'PLAID-SECRET': plaidSecret,
      },
      body: JSON.stringify({
        public_token,
      }),
    });

    const exchangeData = await exchangeResponse.json();

    if (!exchangeResponse.ok) {
      throw new Error(`Plaid exchange error: ${exchangeData.error_message}`);
    }

    // Encrypt the access token before storage
    const { access_token, item_id } = exchangeData;
    const { data: encryptedToken, error: encryptError } = await supabaseClient
      .rpc('encrypt_plaid_token', { token_text: access_token });

    if (encryptError) {
      console.error('Error encrypting Plaid token:', encryptError);
      throw new Error('Failed to encrypt access token');
    }
    
    // Store each account with encrypted token
    for (const account of accounts) {
      await supabaseClient
        .from('bank_links')
        .insert({
          user_id: user.id,
          access_token: encryptedToken,
          account_id: account.id,
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        item_id,
        accounts_linked: accounts.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error exchanging Plaid token:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});