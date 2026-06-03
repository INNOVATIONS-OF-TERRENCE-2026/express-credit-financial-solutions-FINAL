import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const PAYMENT_METHODS = ["cash_app", "apple_pay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "needs_review",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROOF_BUCKET = "cashapp-proofs";
export const ACCEPTED_PROOF_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
];
export const MAX_PROOF_BYTES = 8 * 1024 * 1024; // 8MB

export const CASH_APP_CASHTAG = "$Kingyt";
export const CASH_APP_URL = "https://cash.app/$Kingyt";
export const APPLE_PAY_PHONE = "531-348-9321";

export const paymentSubmissionSchema = z.object({
  payment_method: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: "Please choose a payment method." }),
  }),
  payment_amount: z
    .number({ invalid_type_error: "Enter a valid amount." })
    .min(1, "Amount must be at least $1.00")
    .max(1_000_000, "Amount too large"),
  payment_note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PaymentSubmissionInput = z.infer<typeof paymentSubmissionSchema>;

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? Number(value) : value ?? 0;
  if (Number.isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatDateTime(input: string | null | undefined): string {
  if (!input) return "—";
  try {
    return new Date(input).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function methodLabel(method: PaymentMethod | string | null | undefined): string {
  if (method === "cash_app") return "Cash App";
  if (method === "apple_pay") return "Apple Pay / Apple Cash";
  return "—";
}

export function statusLabel(status: PaymentStatus | string): string {
  switch (status) {
    case "pending":
      return "Pending Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "needs_review":
      return "Needs Review";
    default:
      return status;
  }
}

export function fileExtension(file: File): string {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : "";
  if (fromName) return fromName;
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg" || file.type === "image/jpg") return "jpg";
  return "bin";
}

export async function createProofSignedUrl(
  path: string | null | undefined,
  expiresInSeconds = 300,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.error("createSignedUrl error", error);
    return null;
  }
  return data?.signedUrl ?? null;
}