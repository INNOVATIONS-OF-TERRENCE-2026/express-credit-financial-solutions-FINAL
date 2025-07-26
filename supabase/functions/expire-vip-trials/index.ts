import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EXPIRE-VIP-TRIALS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting VIP trial expiration check");

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find expired VIP trials
    const { data: expiredTrials, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, email, user_id, expires_at')
      .eq('membership_type', 'vip_trial')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      logStep("Error fetching expired trials", { error: fetchError });
      throw fetchError;
    }

    logStep("Found expired trials", { count: expiredTrials?.length || 0 });

    if (expiredTrials && expiredTrials.length > 0) {
      // Update expired trials
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          membership_type: 'expired_trial',
          payment_status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('membership_type', 'vip_trial')
        .lt('expires_at', new Date().toISOString());

      if (updateError) {
        logStep("Error updating expired trials", { error: updateError });
        throw updateError;
      }

      logStep("Successfully expired VIP trials", { count: expiredTrials.length });

      // Log the expiration for each user
      for (const trial of expiredTrials) {
        await supabaseClient.rpc('log_security_event', {
          p_action: 'VIP_TRIAL_EXPIRED',
          p_table_name: 'profiles',
          p_record_id: trial.id,
          p_details: {
            user_id: trial.user_id,
            email: trial.email,
            expired_at: new Date().toISOString()
          },
          p_security_level: 'info',
          p_risk_score: 0
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      expired_count: expiredTrials?.length || 0,
      message: `Processed ${expiredTrials?.length || 0} expired VIP trials`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Error in expire-vip-trials", { error: error.message });
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});