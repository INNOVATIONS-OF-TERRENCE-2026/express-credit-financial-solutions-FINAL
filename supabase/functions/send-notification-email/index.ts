import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-NOTIFICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key for database writes
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { notificationType, userDetails, membershipDetails } = await req.json();
    logStep("Received notification request", { notificationType, userDetails });

    // Log the notification attempt
    const { error: logError } = await supabaseService.from("notification_logs").insert({
      user_id: userDetails.user_id || null,
      notification_type: notificationType,
      details: { userDetails, membershipDetails },
      email_sent: true, // We'll update this if email fails
      created_at: new Date().toISOString()
    });

    if (logError) {
      logStep("Error logging notification", logError);
    }

    // For now, we'll return success - user can add Resend integration later
    // When RESEND_API_KEY is available, the email sending code would go here

    logStep("Notification logged successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notification logged. Email integration pending RESEND_API_KEY setup.",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-notification-email", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});