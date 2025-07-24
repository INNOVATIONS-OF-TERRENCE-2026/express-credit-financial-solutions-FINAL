import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating checkout session...");
    const { plan, amount, isOneTime } = await req.json();
    console.log("Request data:", { plan, amount, isOneTime });

    // Create Supabase client with anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) throw new Error(`Auth error: ${authError.message}`);
    
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email missing");
    console.log("User authenticated:", user.email);

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });
    console.log("Stripe initialized");

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found");
    }

    const origin = req.headers.get("origin") || "https://856f1e4e-3cd3-4ba8-bc81-51cf0128071c.lovableproject.com";
    console.log("Origin:", origin);

    // Create checkout session
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: plan },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: isOneTime ? "payment" : "subscription",
      success_url: `${origin}/membership-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/membership`,
      metadata: {
        plan: plan,
        user_id: user.id,
        payment_frequency: isOneTime ? "one-time" : "monthly"
      }
    };

    // Add recurring interval for subscription plans
    if (!isOneTime) {
      sessionConfig.line_items[0].price_data.recurring = { interval: "month" };
    }

    console.log("Creating Stripe session with config:", JSON.stringify(sessionConfig, null, 2));
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log("Stripe session created:", session.id);

    // Store subscription record using service role for write access
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { error: insertError } = await supabaseService.from("subscriptions").insert({
      user_id: user.id,
      email: user.email,
      plan: plan,
      amount: amount,
      payment_frequency: isOneTime ? "one-time" : "monthly",
      stripe_customer_id: customerId,
      payment_status: "pending"
    });

    if (insertError) {
      console.error("Error inserting subscription:", insertError);
      // Don't fail the request if subscription insert fails
    } else {
      console.log("Subscription record created");
    }

    console.log("Returning session URL:", session.url);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-subscription-checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});