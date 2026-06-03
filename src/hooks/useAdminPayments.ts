import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PaymentRecord } from "@/hooks/usePayments";

export interface AdminPaymentRow extends PaymentRecord {
  profile_email?: string | null;
  profile_first_name?: string | null;
  profile_last_name?: string | null;
}

export interface AdminPaymentMetrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needs_review: number;
  total_revenue_approved: number;
  total_pending_amount: number;
  approved_this_month: number;
}

export function useAdminPayments() {
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: payments, error } = await supabase
      .from("payment_records")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) {
      console.error("admin payments fetch error", error);
      setRows([]);
      setLoading(false);
      return;
    }
    const userIds = Array.from(new Set((payments ?? []).map((p) => p.user_id)));
    let profileMap = new Map<
      string,
      { email: string | null; first_name: string | null; last_name: string | null }
    >();
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id,email,first_name,last_name")
        .in("user_id", userIds);
      profileMap = new Map(
        (profiles ?? []).map((p: any) => [
          p.user_id,
          { email: p.email, first_name: p.first_name, last_name: p.last_name },
        ]),
      );
    }
    setRows(
      (payments ?? []).map((p: any) => {
        const prof = profileMap.get(p.user_id);
        return {
          ...p,
          profile_email: prof?.email ?? null,
          profile_first_name: prof?.first_name ?? null,
          profile_last_name: prof?.last_name ?? null,
        } as AdminPaymentRow;
      }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const metrics: AdminPaymentMetrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const base: AdminPaymentMetrics = {
      total: rows.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      needs_review: 0,
      total_revenue_approved: 0,
      total_pending_amount: 0,
      approved_this_month: 0,
    };
    for (const r of rows) {
      const amt = Number(r.payment_amount) || 0;
      if (r.payment_status === "pending") {
        base.pending++;
        base.total_pending_amount += amt;
      } else if (r.payment_status === "approved") {
        base.approved++;
        base.total_revenue_approved += amt;
        if (r.reviewed_at && new Date(r.reviewed_at) >= monthStart) {
          base.approved_this_month += amt;
        }
      } else if (r.payment_status === "rejected") {
        base.rejected++;
      } else if (r.payment_status === "needs_review") {
        base.needs_review++;
      }
    }
    return base;
  }, [rows]);

  const approve = useCallback(async (id: string, adminId: string) => {
    const { error } = await supabase
      .from("payment_records")
      .update({
        payment_status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const reject = useCallback(
    async (id: string, adminId: string, reason: string) => {
      if (!reason.trim()) throw new Error("Rejection reason is required.");
      const { error } = await supabase
        .from("payment_records")
        .update({
          payment_status: "rejected",
          rejection_reason: reason.trim(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const markNeedsReview = useCallback(
    async (id: string, adminId: string, message: string) => {
      if (!message.trim()) throw new Error("A message to the client is required.");
      const { error } = await supabase
        .from("payment_records")
        .update({
          payment_status: "needs_review",
          client_visible_message: message.trim(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const addAdminNote = useCallback(async (id: string, note: string) => {
    if (!note.trim()) throw new Error("Note cannot be empty.");
    const { data: existing } = await supabase
      .from("payment_records")
      .select("admin_notes")
      .eq("id", id)
      .single();
    const stamped = `[${new Date().toLocaleString()}] ${note.trim()}`;
    const next = existing?.admin_notes
      ? `${existing.admin_notes}\n${stamped}`
      : stamped;
    const { error } = await supabase
      .from("payment_records")
      .update({ admin_notes: next })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  return { rows, metrics, loading, refresh, approve, reject, markNeedsReview, addAdminNote };
}