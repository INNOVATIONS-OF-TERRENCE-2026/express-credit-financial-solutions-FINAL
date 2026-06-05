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
    // Service-role only: this is a scheduled/cron-only endpoint.
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!serviceKey || token !== serviceKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Starting VIP trial and VIP pass expiration check");

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find expired VIP trials
    const { data: expiredTrials, error: fetchTrialsError } = await supabaseClient
      .from('profiles')
      .select('id, email, user_id, expires_at')
      .eq('membership_type', 'vip_trial')
      .lt('expires_at', new Date().toISOString());

    if (fetchTrialsError) {
      logStep("Error fetching expired trials", { error: fetchTrialsError });
      throw fetchTrialsError;
    }

    // Find expired VIP 24-hour passes
    const { data: expiredVipPasses, error: fetchVipError } = await supabaseClient
      .from('profiles')
      .select('id, email, user_id, access_expires_at')
      .eq('membership', 'vip')
      .not('access_expires_at', 'is', null)
      .lt('access_expires_at', new Date().toISOString());

    if (fetchVipError) {
      logStep("Error fetching expired VIP passes", { error: fetchVipError });
      throw fetchVipError;
    }

    logStep("Found expired items", { 
      trials: expiredTrials?.length || 0,
      vipPasses: expiredVipPasses?.length || 0
    });

    let totalProcessed = 0;

    // Update expired trials
    if (expiredTrials && expiredTrials.length > 0) {
      const { error: updateTrialsError } = await supabaseClient
        .from('profiles')
        .update({
          membership_type: 'expired_trial',
          payment_status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('membership_type', 'vip_trial')
        .lt('expires_at', new Date().toISOString());

      if (updateTrialsError) {
        logStep("Error updating expired trials", { error: updateTrialsError });
        throw updateTrialsError;
      }

      logStep("Successfully expired VIP trials", { count: expiredTrials.length });

      // Log the expiration for each trial
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
      totalProcessed += expiredTrials.length;
    }

    // Update expired VIP 24-hour passes
    if (expiredVipPasses && expiredVipPasses.length > 0) {
      const { error: updateVipError } = await supabaseClient
        .from('profiles')
        .update({
          membership: null,
          access_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('membership', 'vip')
        .not('access_expires_at', 'is', null)
        .lt('access_expires_at', new Date().toISOString());

      if (updateVipError) {
        logStep("Error updating expired VIP passes", { error: updateVipError });
        throw updateVipError;
      }

      logStep("Successfully expired VIP 24-hour passes", { count: expiredVipPasses.length });

      // Log the expiration for each VIP pass
      for (const vipPass of expiredVipPasses) {
        await supabaseClient.rpc('log_security_event', {
          p_action: 'VIP_PASS_EXPIRED',
          p_table_name: 'profiles',
          p_record_id: vipPass.id,
          p_details: {
            user_id: vipPass.user_id,
            email: vipPass.email,
            expired_at: new Date().toISOString(),
            access_type: '24_hour_vip_pass'
          },
          p_security_level: 'info',
          p_risk_score: 0
        });
      }
      totalProcessed += expiredVipPasses.length;
    }

    return new Response(JSON.stringify({
      success: true,
      expired_trials: expiredTrials?.length || 0,
      expired_vip_passes: expiredVipPasses?.length || 0,
      total_processed: totalProcessed,
      message: `Processed ${totalProcessed} expired access grants`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Error in expire-vip-trials", { error: (error as Error).message });
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});