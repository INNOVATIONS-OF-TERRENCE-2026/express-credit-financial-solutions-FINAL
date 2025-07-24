import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Map Stripe amounts to plan types
const getPlanTypeFromAmount = (amount: number): string => {
  switch (amount) {
    case 9999: // $99.99
      return "Basic Package";
    case 17999: // $179.99
      return "Pro Package";
    case 24999: // $249.99
      return "Elite Package";
    case 59999: // $599.99
      return "All Exclusive Package";
    default:
      return "Unknown";
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature if secret is provided
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err.message });
        return new Response("Webhook signature verification failed", { status: 400 });
      }
    } else {
      // Parse event without verification (for testing)
      event = JSON.parse(body);
      logStep("Processing webhook without signature verification");
    }

    logStep("Processing event", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id, customerEmail: session.customer_email });

        if (session.customer_email && session.amount_total) {
          const planType = getPlanTypeFromAmount(session.amount_total);
          const isOneTime = session.mode === "payment";
          
          logStep("Updating user profile", { 
            email: session.customer_email, 
            planType, 
            isOneTime,
            amount: session.amount_total 
          });

          // Update profiles table
          const { error: profileError } = await supabaseClient
            .from("profiles")
            .upsert({
              email: session.customer_email,
              plan_type: planType,
              payment_status: "active",
              subscribed_at: new Date().toISOString(),
              stripe_customer_id: session.customer,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'email'
            });

          if (profileError) {
            logStep("Error updating profile", { error: profileError });
          } else {
            logStep("Profile updated successfully");
          }

          // Update subscriptions table
          const { error: subError } = await supabaseClient
            .from("subscriptions")
            .update({
              payment_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", session.customer);

          if (subError) {
            logStep("Error updating subscription", { error: subError });
          } else {
            logStep("Subscription updated successfully");
          }
        }
        break;

      case "invoice.paid":
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id, customerEmail: invoice.customer_email });

        if (invoice.customer_email && invoice.amount_paid) {
          const planType = getPlanTypeFromAmount(invoice.amount_paid);
          
          // Update profiles table for recurring payment
          const { error: profileError } = await supabaseClient
            .from("profiles")
            .upsert({
              email: invoice.customer_email,
              plan_type: planType,
              payment_status: "active",
              subscribed_at: new Date().toISOString(),
              stripe_customer_id: invoice.customer,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'email'
            });

          if (profileError) {
            logStep("Error updating profile for invoice", { error: profileError });
          } else {
            logStep("Profile updated for invoice payment");
          }
        }
        break;

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { 
          subscriptionId: updatedSubscription.id, 
          status: updatedSubscription.status 
        });

        // Get customer email
        const customer = await stripe.customers.retrieve(updatedSubscription.customer as string);
        if (customer && !customer.deleted && customer.email) {
          const paymentStatus = updatedSubscription.status === "active" ? "active" : "inactive";
          
          const { error } = await supabaseClient
            .from("profiles")
            .update({
              payment_status: paymentStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", updatedSubscription.customer);

          if (error) {
            logStep("Error updating subscription status", { error });
          } else {
            logStep("Subscription status updated", { status: paymentStatus });
          }
        }
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: deletedSubscription.id });

        // Update profile to inactive
        const { error } = await supabaseClient
          .from("profiles")
          .update({
            payment_status: "inactive",
            plan_type: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", deletedSubscription.customer);

        if (error) {
          logStep("Error deactivating subscription", { error });
        } else {
          logStep("Subscription deactivated successfully");
        }
        break;

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Webhook error", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});