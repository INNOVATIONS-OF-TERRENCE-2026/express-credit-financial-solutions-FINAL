import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AU-REQUEST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { fullName, tradelineId, creditBureau, phone } = await req.json();
    logStep("Request data received", { fullName, tradelineId, creditBureau });

    // Insert AU request into database
    const { data: auRequest, error: insertError } = await supabaseClient
      .from("au_requests")
      .insert({
        user_id: user.id,
        full_name: fullName,
        email: user.email,
        tradeline_id: tradelineId,
        credit_bureau: creditBureau,
        phone: phone || null,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      logStep("Error inserting AU request", insertError);
      throw new Error(`Failed to submit AU request: ${insertError.message}`);
    }

    logStep("AU request inserted successfully", { requestId: auRequest.id });

    // Send notification email to admin (placeholder - would use RESEND_API_KEY when available)
    const adminEmail = "expresscreditfinancialsolution@gmail.com";
    logStep("AU request notification would be sent to", { adminEmail });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "AU request submitted successfully",
      requestId: auRequest.id,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in submit-au-request", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});