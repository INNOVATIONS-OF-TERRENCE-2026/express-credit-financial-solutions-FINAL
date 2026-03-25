import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalise(s: string | null | undefined): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function fuzzyMatch(a: string, b: string): number {
  const na = normalise(a);
  const nb = normalise(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const ta = new Set(na.split(" "));
  const tb = new Set(nb.split(" "));
  let overlap = 0;
  ta.forEach((t) => { if (tb.has(t)) overlap++; });
  return (2 * overlap) / (ta.size + tb.size);
}

function matchClients(
  extracted: Record<string, any>,
  clients: any[],
  fileName: string
): { clientId: string | null; score: number; reason: string } {
  if (!clients.length) return { clientId: null, score: 0, reason: "No clients" };

  let bestId: string | null = null;
  let bestScore = 0;
  let bestReason = "";

  for (const c of clients) {
    let score = 0;
    const reasons: string[] = [];

    const nameScore = Math.max(
      fuzzyMatch(extracted.name || "", c.full_name || ""),
      fuzzyMatch(extracted.name || "", c.email?.split("@")[0] || "")
    );
    if (nameScore >= 0.8) { score += 40; reasons.push("Strong name match"); }
    else if (nameScore >= 0.5) { score += 20; reasons.push("Partial name match"); }

    if (extracted.dob && c.dob) {
      const eDob = normalise(extracted.dob);
      const cDob = normalise(c.dob);
      if (eDob === cDob || eDob.includes(cDob) || cDob.includes(eDob)) {
        score += 25; reasons.push("DOB match");
      }
    }

    const addrScore = fuzzyMatch(extracted.address || "", c.address || "");
    if (addrScore >= 0.6) { score += 20; reasons.push("Address match"); }

    if (extracted.ssn_last4 && c.ssn_last4 && extracted.ssn_last4 === c.ssn_last4) {
      score += 35; reasons.push("SSN last4 match");
    }

    const fnScore = fuzzyMatch(fileName, c.full_name || "");
    if (fnScore >= 0.5) { score += 10; reasons.push("Filename hint"); }

    if (score > bestScore) { bestScore = score; bestId = c.id; bestReason = reasons.join(", "); }
  }

  return { clientId: bestId, score: Math.min(bestScore, 100), reason: bestReason || "No signals" };
}

const DOC_TYPES = [
  "social_security_card", "drivers_license", "utility_bill", "credit_report",
  "identity_document", "proof_of_address", "bank_statement", "other",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await anonClient.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

      const { data: roleData } = await serviceClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
      if (!roleData) return new Response(JSON.stringify({ error: "Admin required" }), { status: 403, headers: corsHeaders });
    }

    const { document_id, file_url, file_name, file_type } = await req.json();
    if (!document_id || !file_name) {
      return new Response(JSON.stringify({ error: "document_id and file_name required" }), { status: 400, headers: corsHeaders });
    }

    // Check if autonomous mode is enabled
    const { data: settings } = await serviceClient.from("autonomous_settings").select("*").limit(1).single();
    if (!settings?.autonomous_enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: "Autonomous mode disabled" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const autoThreshold = settings.auto_attach_threshold || 85;
    const reviewThreshold = settings.review_threshold || 60;

    // Create job
    const { data: job, error: jobErr } = await serviceClient.from("autonomous_jobs").insert({
      document_upload_id: document_id,
      status: "processing",
      job_type: "document_parse",
    }).select().single();

    if (jobErr) throw jobErr;

    // AI classification
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    let extracted: Record<string, any> = {};
    let detectedType = "other";

    if (openaiKey) {
      try {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file_name);
        const messages: any[] = [{
          role: "system",
          content: `You are a document intelligence system. Classify and extract identity data.
Respond ONLY with valid JSON:
{
  "document_type": one of: ${DOC_TYPES.join(", ")},
  "confidence": 0-1,
  "extracted": { "name": string|null, "address": string|null, "dob": string|null, "ssn_last4": string|null }
}`,
        }];

        const userContent = isImage && file_url
          ? [
              { type: "text", text: `Classify this document and extract PII. Filename: ${file_name}` },
              { type: "image_url", image_url: { url: file_url } },
            ]
          : `Classify this document based on filename and context. Extract any identifying info.\nFilename: ${file_name}`;

        messages.push({ role: "user", content: userContent });

        const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 500, temperature: 0.1 }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            detectedType = parsed.document_type || "other";
            extracted = parsed.extracted || {};
          }
        }
      } catch (aiErr) {
        console.error("AI error:", aiErr);
      }
    }

    // Filename fallback
    if (detectedType === "other") {
      const fn = file_name.toLowerCase();
      if (fn.includes("ssn") || fn.includes("social")) detectedType = "social_security_card";
      else if (fn.includes("license") || fn.includes("dl") || fn.includes("id")) detectedType = "drivers_license";
      else if (fn.includes("utility") || fn.includes("bill")) detectedType = "utility_bill";
      else if (fn.includes("credit") || fn.includes("report")) detectedType = "credit_report";
      else if (fn.includes("bank") || fn.includes("statement")) detectedType = "bank_statement";
    }

    // Match clients
    const { data: clients } = await serviceClient.from("clients").select("id, full_name, email, address, dob, ssn_last4, phone");
    const match = matchClients(extracted, clients || [], file_name);

    // Insert AI result
    await serviceClient.from("document_ai_results").insert({
      document_id,
      extracted_name: extracted.name || null,
      extracted_address: extracted.address || null,
      extracted_ssn_last4: extracted.ssn_last4 || null,
      extracted_dob: extracted.dob || null,
      detected_doc_type: detectedType,
      confidence_score: match.score,
      matched_client_id: match.clientId,
      match_reason: match.reason,
    });

    // Apply threshold logic
    let finalStatus = "completed";
    if (match.score >= autoThreshold && match.clientId) {
      // Auto-attach
      await serviceClient.from("document_ai_results")
        .update({ is_verified: true })
        .eq("document_id", document_id);
    } else if (match.score >= reviewThreshold && match.clientId) {
      finalStatus = "review";
      await serviceClient.from("document_match_reviews").insert({
        file_id: document_id,
        suggested_client_id: match.clientId,
        review_status: "pending",
      });
    } else {
      finalStatus = "needs_manual";
    }

    // Update job
    await serviceClient.from("autonomous_jobs").update({
      status: finalStatus,
      client_id: match.clientId,
      confidence_score: match.score,
      result_data: { extracted, detected_type: detectedType, match_reason: match.reason },
      completed_at: new Date().toISOString(),
    }).eq("id", job.id);

    return new Response(JSON.stringify({
      job_id: job.id,
      status: finalStatus,
      detected_type: detectedType,
      matched_client_id: match.clientId,
      confidence_score: match.score,
      match_reason: match.reason,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Processing error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
