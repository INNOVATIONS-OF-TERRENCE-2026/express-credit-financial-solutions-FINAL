// Direct Stripe Payment Links - LIVE MODE ONLY
// These are direct payment links that bypass edge functions completely

export const STRIPE_LINKS = {
  // One-Time Services
  fast5: "https://buy.stripe.com/fZu4gybcK03t3al81agbm05",
  unlimited: "https://buy.stripe.com/6oU00ibcKdUj12A0ylgbm04",
  
  // Memberships
  elite: "https://buy.stripe.com/6oUfZg6Wu5nNeTq5T2gbm03",
  basic: "https://buy.stripe.com/9B614m2GebMbdPm5T2gbm02",
  
  // Admin Test
  testMembership: "https://buy.stripe.com/00owcN41Cag2r9z61CMgbm00",
} as const;

export type StripeLinkKey = keyof typeof STRIPE_LINKS;

// Helper to redirect to Stripe checkout directly
export function redirectToStripeCheckout(planKey: StripeLinkKey) {
  const url = STRIPE_LINKS[planKey];
  if (url) {
    window.location.href = url;
  } else {
    console.error(`Invalid plan key: ${planKey}`);
    throw new Error("Invalid plan selected");
  }
}
