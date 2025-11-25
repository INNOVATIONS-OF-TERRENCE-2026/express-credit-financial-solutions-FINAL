// MASTER PRICE MAP - Single source of truth for all Stripe price IDs
// LIVE MODE ONLY - These are production Stripe price IDs

export const PRICE_MAP = {
  // 1️⃣ Unlimited Clean-Slate – $550
  unlimited: "price_1SWMNmAyM7nkjbCbsRqFfZ13",

  // 2️⃣ Fast-5 Deletion – $350
  fast5: "price_1SWMLEAyM7nkjbCbybhfkQYs",

  // 3️⃣ All Exclusive Package – $599.99
  allExclusive: "price_1Rp61BAyM7nkjbCb5PsvzMPY",

  // 4️⃣ Elite Package – $249.99/mo
  elite: "price_1Rp5yXAyM7nkjbCboTWkDKQo",

  // 6️⃣ Pro Package – $179.99/mo
  pro: "price_1Rp5kYAyM7nkjbCbq3f23mYC",

  // 7️⃣ Basic Package – $99/mo
  basic: "price_1Rp5ZgAyM7nkjbCbR8xz28QQ",
} as const;

export type PlanKey = keyof typeof PRICE_MAP;

// Plan details for reference
export const PLAN_DETAILS = {
  unlimited: {
    name: "Unlimited Clean-Slate",
    price: 550,
    isOneTime: true,
  },
  fast5: {
    name: "Fast-5 Deletion",
    price: 350,
    isOneTime: true,
  },
  allExclusive: {
    name: "All Exclusive Package",
    price: 599.99,
    isOneTime: true,
  },
  elite: {
    name: "Elite Package",
    price: 249.99,
    isOneTime: false,
  },
  pro: {
    name: "Pro Package",
    price: 179.99,
    isOneTime: false,
  },
  basic: {
    name: "Basic Package",
    price: 99,
    isOneTime: false,
  },
} as const;
