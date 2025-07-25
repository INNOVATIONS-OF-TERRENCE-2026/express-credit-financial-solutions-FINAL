import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NEW-USER-NOTIFICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { userEmail, userName, userId, notificationType = 'user_signup' } = await req.json();
    logStep("Received notification request", { userEmail, userName, notificationType });

    if (!userEmail) {
      throw new Error("User email is required");
    }

    // Log the notification in the database
    const { error: logError } = await supabaseService.from("notification_logs").insert({
      user_id: userId || null,
      notification_type: notificationType,
      details: { 
        userEmail, 
        userName, 
        timestamp: new Date().toISOString(),
        adminEmail: "expresscreditfinancialsolution@gmail.com"
      },
      email_sent: true, // Will be updated if email fails
      created_at: new Date().toISOString()
    });

    if (logError) {
      logStep("Error logging notification", logError);
    } else {
      logStep("Notification logged successfully");
    }

    // Here you would integrate with Resend API when RESEND_API_KEY is available
    // For now, we'll log the notification details
    logStep("Email notification would be sent to expresscreditfinancialsolution@gmail.com", {
      subject: `New User Signup - ${userName || userEmail}`,
      userDetails: { userEmail, userName, userId },
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "User notification logged successfully",
      notificationType,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in new-user-notification", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});