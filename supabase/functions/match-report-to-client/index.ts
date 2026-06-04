import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Client = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  ssn_last4: string | null;
  dob: string | null;
};

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function nameScore(a: string, b: string): number {
  const ta = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const tb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  ta.forEach((t) => tb.has(t) && hit++);
  return hit / Math.max(ta.size, tb.size);
}

function scoreClient(c: Client, hint: {
  name?: string; email?: string; phone?: string; ssn_last4?: string; dob?: string;
}): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  if (hint.ssn_last4 && c.ssn_last4 && hint.ssn_last4 === c.ssn_last4) {
    score += 0.45; reasons.push("ssn_last4");
  }
  if (hint.dob && c.dob && hint.dob === c.dob) {
    score += 0.2; reasons.push("dob");
  }
  if (hint.email && c.email && norm(hint.email) === norm(c.email)) {
    score += 0.25; reasons.push("email");
  }
  if (hint.phone && c.phone) {
    const a = (hint.phone.match(/\d/g) || []).join("").slice(-10);
    const b = (c.phone.match(/\d/g) || []).join("").slice(-10);
    if (a && a === b) { score += 0.2; reasons.push("phone"); }
  }
  if (hint.name && c.full_name) {
    const ns = nameScore(hint.name, c.full_name);
    if (ns >= 0.5) { score += 0.3 * ns; reasons.push(`name:${ns.toFixed(2)}`); }
  }
  return { score: Math.min(score, 1), reasons };
}

function extractHints(text: string) {
  const t = text.slice(0, 200_000);
  const email = t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0];
  const ssn = t.match(/(?:SSN|Social[^0-9]{0,20})?\D(\d{3})[- ]?(\d{2})[- ]?(\d{4})/);
  const ssn_last4 = ssn?.[3];
  const phone = t.match(/\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/)?.[0];
  const dob = t.match(/\b(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/)?.[0]
    || t.match(/\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/)?.[0];
  return { email, phone, ssn_last4, dob };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Require authenticated admin caller (touches all client PII)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = claimsData.claims.sub as string;
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: callerId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      report_id,
      source = "credit_report_uploads",
      name,
      email,
      phone,
      ssn_last4,
      dob,
      raw_text,
      auto_link = true,
      confidence_threshold = 0.7,
    } = body as Record<string, unknown>;

    if (!report_id || typeof report_id !== "string") {
      return new Response(JSON.stringify({ error: "report_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let reportName: string | undefined = typeof name === "string" ? name : undefined;
    const reportTable = source === "credit_reports" ? "credit_reports" : "credit_report_uploads";

    const { data: report, error: rErr } = await supabase
      .from(reportTable).select("*").eq("id", report_id).maybeSingle();
    if (rErr || !report) {
      return new Response(JSON.stringify({ error: "report not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!reportName) reportName = (report as any).file_name ?? "";

    const text = typeof raw_text === "string" ? raw_text : "";
    const extracted = text ? extractHints(text) : {};
    const hint = {
      name: reportName,
      email: (email as string) ?? extracted.email,
      phone: (phone as string) ?? extracted.phone,
      ssn_last4: (ssn_last4 as string) ?? extracted.ssn_last4,
      dob: (dob as string) ?? extracted.dob,
    };

    const { data: clients, error: cErr } = await supabase
      .from("clients").select("id,full_name,email,phone,ssn_last4,dob");
    if (cErr) throw cErr;

    const ranked = (clients as Client[])
      .map((c) => ({ client: c, ...scoreClient(c, hint) }))
      .sort((a, b) => b.score - a.score);

    const top = ranked[0];
    const second = ranked[1];
    const gap = top && second ? top.score - second.score : top?.score ?? 0;
    const confident = !!top && top.score >= Number(confidence_threshold) && gap >= 0.1;

    let linked = false;
    const match_status = !top || top.score === 0
      ? "failed"
      : confident ? "matched" : "needs_review";
    const match_error = match_status === "failed"
      ? "No client candidates scored above zero — provide ssn_last4, dob, email, phone, or name to match."
      : match_status === "needs_review"
        ? `Top score ${top.score.toFixed(2)} below threshold ${confidence_threshold} (gap ${gap.toFixed(2)}).`
        : null;

    if (confident && auto_link && (report as any).client_id !== top!.client.id) {
      const { error: uErr } = await supabase
        .from(reportTable).update({ client_id: top!.client.id }).eq("id", report_id);
      if (uErr) throw uErr;
      linked = true;
    }

    // Persist status on the report row (only credit_report_uploads has these columns)
    if (reportTable === "credit_report_uploads") {
      await supabase.from("credit_report_uploads").update({
        match_status,
        match_score: top?.score ?? 0,
        match_reasons: top?.reasons ?? [],
        match_checked_at: new Date().toISOString(),
        match_error,
      }).eq("id", report_id);
    }

    if (!confident) {
      await supabase.from("document_match_reviews").insert({
        file_id: report_id,
        suggested_client_id: top?.client.id ?? null,
        review_status: "pending",
        notes: JSON.stringify({
          source: reportTable,
          top_score: top?.score ?? 0,
          gap,
          reasons: top?.reasons ?? [],
          hint,
        }),
      });
    }

    return new Response(JSON.stringify({
      report_id,
      source: reportTable,
      match_status,
      match_error,
      linked,
      confident,
      top_match: top ? { client_id: top.client.id, score: top.score, reasons: top.reasons } : null,
      runner_up: second ? { client_id: second.client.id, score: second.score } : null,
      hint,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});