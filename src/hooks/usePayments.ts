import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ACCEPTED_PROOF_TYPES,
  MAX_PROOF_BYTES,
  PAYMENT_PROOF_BUCKET,
  PaymentMethod,
  fileExtension,
} from "@/lib/payments";

export interface PaymentRecord {
  id: string;
  user_id: string;
  client_id: string | null;
  payment_method: PaymentMethod;
  payment_amount: number;
  payment_note: string | null;
  payment_proof_file_path: string | null;
  payment_status: "pending" | "approved" | "rejected" | "needs_review";
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  client_visible_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentSummary {
  user_id: string;
  total_paid: number;
  total_pending: number;
  last_payment_amount: number | null;
  last_payment_method: string | null;
  last_payment_status: string | null;
  last_payment_date: string | null;
}

function validateProof(file: File): string | null {
  if (!ACCEPTED_PROOF_TYPES.includes(file.type)) {
    return "Proof must be a PNG, JPG, or PDF file.";
  }
  if (file.size > MAX_PROOF_BYTES) {
    return "Proof must be 8 MB or smaller.";
  }
  return null;
}

export function usePayments() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: recs } = await supabase
      .from("payment_records")
      .select("*")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });
    const list = (recs ?? []) as PaymentRecord[];
    setRecords(list);
    const total_paid = list.filter((r) => r.payment_status === "approved").reduce((s, r) => s + Number(r.payment_amount || 0), 0);
    const total_pending = list.filter((r) => r.payment_status === "pending").reduce((s, r) => s + Number(r.payment_amount || 0), 0);
    const last = list[0];
    setSummary(last ? {
      user_id: user.id,
      total_paid,
      total_pending,
      last_payment_amount: Number(last.payment_amount || 0),
      last_payment_method: last.payment_method,
      last_payment_status: last.payment_status,
      last_payment_date: last.submitted_at,
    } as PaymentSummary : null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitPayment = useCallback(
    async (input: {
      payment_method: PaymentMethod;
      payment_amount: number;
      payment_note?: string;
      proofFile: File;
    }) => {
      if (!user) throw new Error("You must be signed in.");
      const err = validateProof(input.proofFile);
      if (err) throw new Error(err);

      // Insert record first so we can use its id as the storage filename.
      const { data: inserted, error: insertError } = await supabase
        .from("payment_records")
        .insert({
          user_id: user.id,
          payment_method: input.payment_method,
          payment_amount: input.payment_amount,
          payment_note: input.payment_note?.trim() || null,
          payment_status: "pending",
        })
        .select("*")
        .single();
      if (insertError || !inserted) {
        throw new Error(insertError?.message ?? "Failed to create payment record.");
      }

      const path = `${user.id}/${inserted.id}.${fileExtension(input.proofFile)}`;
      const { error: upErr } = await supabase.storage
        .from(PAYMENT_PROOF_BUCKET)
        .upload(path, input.proofFile, {
          contentType: input.proofFile.type,
          upsert: true,
        });
      if (upErr) {
        await supabase.from("payment_records").delete().eq("id", inserted.id);
        throw new Error(upErr.message);
      }

      const { error: updErr } = await supabase
        .from("payment_records")
        .update({ payment_proof_file_path: path })
        .eq("id", inserted.id);
      if (updErr) throw new Error(updErr.message);

      await refresh();
      return inserted.id as string;
    },
    [user, refresh],
  );

  const replaceProof = useCallback(
    async (recordId: string, file: File) => {
      if (!user) throw new Error("You must be signed in.");
      const err = validateProof(file);
      if (err) throw new Error(err);
      const path = `${user.id}/${recordId}.${fileExtension(file)}`;
      const { error: upErr } = await supabase.storage
        .from(PAYMENT_PROOF_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw new Error(upErr.message);

      const { error: updErr } = await supabase
        .from("payment_records")
        .update({
          payment_proof_file_path: path,
          payment_status: "pending",
          submitted_at: new Date().toISOString(),
          rejection_reason: null,
          client_visible_message: null,
        })
        .eq("id", recordId);
      if (updErr) throw new Error(updErr.message);
      await refresh();
    },
    [user, refresh],
  );

  return { records, summary, loading, refresh, submitPayment, replaceProof };
}