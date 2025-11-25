import { supabase } from "@/integrations/supabase/client";
import { PRICE_MAP, PLAN_DETAILS, type PlanKey } from "@/config/priceMap";

/**
 * Creates a Stripe checkout session using Supabase edge function
 * @param plan - The plan key from PRICE_MAP
 */
export async function createCheckoutSession(plan: PlanKey) {
  try {
    // Validate plan exists
    if (!PRICE_MAP[plan]) {
      throw new Error(`Invalid plan: ${plan}. Plan does not exist in PRICE_MAP.`);
    }

    const priceId = PRICE_MAP[plan];
    const planDetails = PLAN_DETAILS[plan];

    console.log("Creating checkout session:", {
      plan,
      priceId,
      planDetails,
    });

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("You must be logged in to purchase a membership");
    }

    // Call Supabase edge function to create Stripe checkout session
    const { data, error } = await supabase.functions.invoke(
      "create-subscription-checkout",
      {
        body: {
          plan: planDetails.name,
          amount: planDetails.price,
          isOneTime: planDetails.isOneTime,
          stripePriceId: priceId, // Pass the price ID directly
        },
      }
    );

    if (error) {
      console.error("Checkout session error:", error);
      throw new Error(error.message || "Failed to create checkout session");
    }

    if (!data?.url) {
      throw new Error("No checkout URL returned from Stripe");
    }

    console.log("Checkout session created successfully:", data.url);

    // Redirect to Stripe checkout
    window.location.href = data.url;
  } catch (err) {
    console.error("CHECKOUT_ERROR:", err);
    throw err;
  }
}
