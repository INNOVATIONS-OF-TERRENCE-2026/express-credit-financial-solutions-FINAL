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

// Helper function to update user membership
const updateUserMembership = async (
  supabaseClient: any,
  email: string,
  planType: string,
  stripeCustomerId: string,
  subscriptionId?: string,
  status: string = 'active'
) => {
  logStep("Updating user membership", { 
    email, 
    planType, 
    stripeCustomerId, 
    subscriptionId, 
    status 
  });

  const { error } = await supabaseClient
    .from("profiles")
    .upsert({
      email: email,
      membership_plan: planType,
      subscription_status: status,
      payment_status: status,
      plan_type: planType,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscriptionId,
      subscribed_at: status === 'active' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'email'
    });

  if (error) {
    logStep("Error updating user membership", { error });
    throw error;
  } else {
    logStep("User membership updated successfully");
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
          
          await updateUserMembership(
            supabaseClient,
            session.customer_email,
            planType,
            session.customer as string,
            session.subscription as string,
            "active"
          );

          // Send payment notification email
          await supabaseClient.functions.invoke('send-notification-email', {
            body: {
              type: 'payment_complete',
              userEmail: session.customer_email,
              userName: session.customer_details?.name || session.customer_email,
              planType: planType,
              amount: session.amount_total / 100
            }
          });

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

      case "customer.subscription.created":
        const createdSubscription = event.data.object as Stripe.Subscription;
        logStep("Subscription created", { 
          subscriptionId: createdSubscription.id, 
          customerId: createdSubscription.customer 
        });

        // Get customer details
        const createdCustomer = await stripe.customers.retrieve(createdSubscription.customer as string);
        if (createdCustomer && !createdCustomer.deleted && createdCustomer.email) {
          // Determine plan type from subscription price
          const priceId = createdSubscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const planType = getPlanTypeFromAmount(price.unit_amount || 0);
          
          await updateUserMembership(
            supabaseClient,
            createdCustomer.email,
            planType,
            createdSubscription.customer as string,
            createdSubscription.id,
            createdSubscription.status === "active" ? "active" : "inactive"
          );
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

        // Get customer details and plan type
        const updatedCustomer = await stripe.customers.retrieve(updatedSubscription.customer as string);
        if (updatedCustomer && !updatedCustomer.deleted && updatedCustomer.email) {
          // Determine plan type from subscription price
          const priceId = updatedSubscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const planType = getPlanTypeFromAmount(price.unit_amount || 0);
          
          await updateUserMembership(
            supabaseClient,
            updatedCustomer.email,
            planType,
            updatedSubscription.customer as string,
            updatedSubscription.id,
            updatedSubscription.status === "active" ? "active" : "inactive"
          );
        }
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: deletedSubscription.id });

        // Get customer details 
        const deletedCustomer = await stripe.customers.retrieve(deletedSubscription.customer as string);
        if (deletedCustomer && !deletedCustomer.deleted && deletedCustomer.email) {
          await updateUserMembership(
            supabaseClient,
            deletedCustomer.email,
            null,
            deletedSubscription.customer as string,
            deletedSubscription.id,
            "canceled"
          );
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