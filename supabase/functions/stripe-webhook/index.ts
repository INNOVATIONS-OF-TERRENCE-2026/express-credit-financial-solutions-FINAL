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

// Map Stripe price IDs to membership types
const getMembershipFromPriceId = (priceId: string): { membership: string; planType: string; isVip?: boolean } => {
  switch (priceId) {
    case "price_1Rp5ZgAyM7nkjbCbR8xz28QQ":
      return { membership: "basic", planType: "Basic Package" };
    case "price_1Rp5kYAyM7nkjbCbq3f23mYC":
      return { membership: "pro", planType: "Pro Package" };
    case "price_1Rp5rxAyM7nkjbCbaCPXVpxo":
      return { membership: "elite", planType: "Elite Package" };
    case "price_1Rp61BAyM7nkjbCb5Psvz":
      return { membership: "exclusive", planType: "All Exclusive Package" };
    case "price_1Rp61BAyM7nkjbCb5Psv":
      return { membership: "vip", planType: "$1 24-Hour VIP Pass", isVip: true };
    case "price_1Rp15nAyM7nkjbCbgzjS4NNT":
      return { membership: "test", planType: "Test Membership" };
    default:
      return { membership: "unknown", planType: "Unknown" };
  }
};

// Legacy fallback - Map Stripe amounts to plan types (for old sessions)
const getPlanTypeFromAmount = (amount: number): string => {
  switch (amount) {
    case 100: // $1.00
      return "$1 24-Hour VIP Pass";
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
  membership: string,
  planType: string,
  stripeCustomerId: string,
  subscriptionId?: string,
  status: string = 'active',
  isVip: boolean = false
) => {
  logStep("Updating user membership", { 
    email, 
    membership,
    planType, 
    stripeCustomerId, 
    subscriptionId, 
    status,
    isVip
  });

  const updateData: any = {
    email: email,
    membership: membership,
    membership_plan: planType,
    subscription_status: status,
    payment_status: status,
    plan_type: planType,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: subscriptionId,
    subscribed_at: status === 'active' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  // Handle VIP special case - set 24-hour expiration
  if (isVip) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    updateData.access_expires_at = expiresAt.toISOString();
    updateData.membership_type = 'vip_trial';
    logStep('Setting VIP access expiration', { access_expires_at: updateData.access_expires_at });
  }

  // If subscription is canceled or fails, revoke access
  if (status === 'canceled' || status === 'inactive') {
    updateData.membership = null;
    updateData.access_expires_at = null;
    updateData.membership_type = null;
    logStep('Revoking membership access', { status });
  }

  const { error } = await supabaseClient
    .from("profiles")
    .upsert(updateData, {
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

        if (session.customer_email) {
          let membership = "unknown";
          let planType = "Unknown";
          let isVip = false;

          // Try to get membership from line items (preferred method)
          if (session.line_items && session.line_items.data.length > 0) {
            const priceId = session.line_items.data[0].price?.id;
            if (priceId) {
              const mappingResult = getMembershipFromPriceId(priceId);
              membership = mappingResult.membership;
              planType = mappingResult.planType;
              isVip = mappingResult.isVip || false;
              logStep("Membership mapped from price ID", { priceId, membership, planType, isVip });
            }
          }
          
          // Fallback to amount-based mapping if no price ID found
          if (membership === "unknown" && session.amount_total) {
            planType = getPlanTypeFromAmount(session.amount_total);
            isVip = planType === "$1 24-Hour VIP Pass";
            membership = isVip ? "vip" : "unknown";
            logStep("Fallback to amount-based mapping", { amount: session.amount_total, planType, isVip });
          }
          
          await updateUserMembership(
            supabaseClient,
            session.customer_email,
            membership,
            planType,
            session.customer as string,
            session.subscription as string,
            "active",
            isVip
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
          // Determine membership from subscription price ID
          const priceId = createdSubscription.items.data[0].price.id;
          const mappingResult = getMembershipFromPriceId(priceId);
          
          await updateUserMembership(
            supabaseClient,
            createdCustomer.email,
            mappingResult.membership,
            mappingResult.planType,
            createdSubscription.customer as string,
            createdSubscription.id,
            createdSubscription.status === "active" ? "active" : "inactive",
            mappingResult.isVip || false
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

        // Get customer details and membership type
        const updatedCustomer = await stripe.customers.retrieve(updatedSubscription.customer as string);
        if (updatedCustomer && !updatedCustomer.deleted && updatedCustomer.email) {
          // Determine membership from subscription price ID
          const priceId = updatedSubscription.items.data[0].price.id;
          const mappingResult = getMembershipFromPriceId(priceId);
          
          await updateUserMembership(
            supabaseClient,
            updatedCustomer.email,
            mappingResult.membership,
            mappingResult.planType,
            updatedSubscription.customer as string,
            updatedSubscription.id,
            updatedSubscription.status === "active" ? "active" : "inactive",
            mappingResult.isVip || false
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
            "canceled",
            "Canceled",
            deletedSubscription.customer as string,
            deletedSubscription.id,
            "canceled",
            false
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