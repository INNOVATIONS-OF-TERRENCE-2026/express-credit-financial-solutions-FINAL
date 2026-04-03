import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ClassificationResult {
  detected_document_type: string;
  extracted_fields: Record<string, any>;
  matched_client_id: string | null;
  confidence_score: number;
  match_reason: string;
  requires_review: boolean;
}

const DOC_TYPES = [
  "social_security_card",
  "drivers_license",
  "utility_bill",
  "credit_report",
  "identity_document",
  "proof_of_address",
  "bank_statement",
  "other",
];

function normalise(s: string | null | undefined): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function fuzzyMatch(a: string, b: string): number {
  const na = normalise(a);
  const nb = normalise(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  // token overlap
  const ta = new Set(na.split(" "));
  const tb = new Set(nb.split(" "));
  let overlap = 0;
  ta.forEach((t) => { if (tb.has(t)) overlap++; });
  const score = (2 * overlap) / (ta.size + tb.size);
  return score;
}

function matchClients(
  extracted: Record<string, any>,
  clients: any[],
  fileName: string
): { clientId: string | null; score: number; reason: string; review: boolean } {
  if (!clients.length) return { clientId: null, score: 0, reason: "No clients in database", review: false };

  let bestId: string | null = null;
  let bestScore = 0;
  let bestReason = "";
  const candidates: { id: string; score: number; reason: string }[] = [];

  for (const c of clients) {
    let score = 0;
    const reasons: string[] = [];

    // Name match (high weight)
    const nameScore = Math.max(
      fuzzyMatch(extracted.name || "", c.full_name || ""),
      fuzzyMatch(extracted.name || "", c.email?.split("@")[0] || "")
    );
    if (nameScore >= 0.8) { score += 40; reasons.push("Strong name match"); }
    else if (nameScore >= 0.5) { score += 20; reasons.push("Partial name match"); }

    // DOB match
    if (extracted.dob && c.dob) {
      const eDob = normalise(extracted.dob);
      const cDob = normalise(c.dob);
      if (eDob === cDob || eDob.includes(cDob) || cDob.includes(eDob)) {
        score += 25;
        reasons.push("DOB match");
      }
    }

    // Address match
    const addrScore = fuzzyMatch(extracted.address || "", c.address || "");
    if (addrScore >= 0.6) { score += 20; reasons.push("Address match"); }

    // SSN last4 match (critical)
    if (extracted.ssn_last4 && c.ssn_last4) {
      if (extracted.ssn_last4 === c.ssn_last4) {
        score += 35;
        reasons.push("SSN last4 match");
      }
    }

    // File name hint (low weight)
    const fnScore = fuzzyMatch(fileName, c.full_name || "");
    if (fnScore >= 0.5) { score += 10; reasons.push("Filename hint"); }

    if (score > 0) candidates.push({ id: c.id, score, reason: reasons.join(", ") });
    if (score > bestScore) { bestScore = score; bestId = c.id; bestReason = reasons.join(", "); }
  }

  // Ambiguity check
  const closeMatches = candidates.filter((c) => c.score >= bestScore * 0.8 && c.id !== bestId);

  if (bestScore >= 60) {
    return {
      clientId: bestId,
      score: Math.min(bestScore, 100),
      reason: bestReason,
      review: closeMatches.length > 0,
    };
  }
  if (bestScore >= 30) {
    return { clientId: bestId, score: bestScore, reason: bestReason, review: true };
  }
  return { clientId: null, score: bestScore, reason: bestReason || "No strong signals", review: bestScore > 0 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claims.claims.sub as string;

    // Check admin
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: corsHeaders });
    }

    const { file_id, file_name, file_content_base64, batch_id } = await req.json();

    if (!file_id || !file_name) {
      return new Response(JSON.stringify({ error: "file_id and file_name required" }), { status: 400, headers: corsHeaders });
    }

    // Fetch all clients for matching
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: clients } = await serviceClient.from("clients").select("id, full_name, email, address, dob, ssn_last4, phone");

    // Use OpenAI for classification + extraction
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    let extracted: Record<string, any> = {};
    let detectedType = "other";
    let classificationConfidence = 0.5;

    if (openaiKey && file_content_base64) {
      try {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file_name);
        const isPdf = /\.pdf$/i.test(file_name);

        const messages: any[] = [
          {
            role: "system",
            content: `You are a document intelligence system. Classify documents and extract identity data.
Respond ONLY with valid JSON:
{
  "document_type": one of: ${DOC_TYPES.join(", ")},
  "confidence": 0-1,
  "extracted": {
    "name": string or null,
    "address": string or null,
    "dob": string or null,
    "ssn_last4": string or null,
    "id_number": string or null,
    "phone": string or null,
    "email": string or null
  }
}`,
          },
        ];

        if (isImage) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: `Classify this document and extract any personal identifying information. Filename: ${file_name}` },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${file_content_base64}` } },
            ],
          });
        } else {
          // For PDFs, use filename + any text content
          messages.push({
            role: "user",
            content: `Classify this document based on its filename and any available context. Extract any identifying information you can infer.\nFilename: ${file_name}\nContent preview (if available): ${file_content_base64 ? atob(file_content_base64).substring(0, 2000) : "No text content available"}`,
          });
        }

        const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: isImage ? "gpt-4o-mini" : "gpt-4o-mini",
            messages,
            max_tokens: 500,
            temperature: 0.1,
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            detectedType = parsed.document_type || "other";
            classificationConfidence = parsed.confidence || 0.5;
            extracted = parsed.extracted || {};
          }
        }
      } catch (aiErr) {
        console.error("AI classification error:", aiErr);
        // Fallback: use filename heuristics
      }
    }

    // Filename-based fallback classification
    if (detectedType === "other") {
      const fnLower = file_name.toLowerCase();
      if (fnLower.includes("ssn") || fnLower.includes("social")) detectedType = "social_security_card";
      else if (fnLower.includes("license") || fnLower.includes("dl") || fnLower.includes("id")) detectedType = "drivers_license";
      else if (fnLower.includes("utility") || fnLower.includes("bill") || fnLower.includes("electric") || fnLower.includes("water")) detectedType = "utility_bill";
      else if (fnLower.includes("credit") || fnLower.includes("report") || fnLower.includes("equifax") || fnLower.includes("experian") || fnLower.includes("transunion")) detectedType = "credit_report";
      else if (fnLower.includes("address") || fnLower.includes("proof")) detectedType = "proof_of_address";
      else if (fnLower.includes("bank") || fnLower.includes("statement")) detectedType = "bank_statement";
    }

    // Match against clients
    const matchResult = matchClients(extracted, clients || [], file_name);

    const matchStatus = matchResult.score >= 60 && !matchResult.review
      ? "matched"
      : matchResult.score > 0
        ? "review"
        : "failed";

    // Update the file record
    const { error: updateErr } = await serviceClient
      .from("bulk_upload_files")
      .update({
        detected_document_type: detectedType,
        extracted_fields: extracted,
        matched_client_id: matchResult.clientId,
        confidence_score: matchResult.score,
        match_status: matchStatus,
        ai_reason: matchResult.reason,
      })
      .eq("id", file_id);

    if (updateErr) console.error("Error updating file:", updateErr);

    // Save classification result
    await serviceClient.from("document_classification_results").insert({
      file_id,
      document_type: detectedType,
      extracted_text: "",
      structured_data: extracted,
      confidence_score: classificationConfidence,
    });

    // Create review record if needed
    if (matchStatus === "review") {
      await serviceClient.from("document_match_reviews").insert({
        file_id,
        suggested_client_id: matchResult.clientId,
        review_status: "pending",
      });
    }

    // Update batch counters
    const { data: batchFiles } = await serviceClient
      .from("bulk_upload_files")
      .select("match_status")
      .eq("batch_id", batch_id);

    if (batchFiles) {
      const processed = batchFiles.filter((f) => f.match_status !== "pending").length;
      const matched = batchFiles.filter((f) => f.match_status === "matched").length;
      const review = batchFiles.filter((f) => f.match_status === "review").length;
      const failed = batchFiles.filter((f) => f.match_status === "failed").length;
      const allDone = processed === batchFiles.length;

      await serviceClient.from("bulk_upload_batches").update({
        processed_files: processed,
        matched_files: matched,
        needs_review_count: review,
        failed_files: failed,
        status: allDone ? "completed" : "processing",
      }).eq("id", batch_id);
    }

    const result: ClassificationResult = {
      detected_document_type: detectedType,
      extracted_fields: extracted,
      matched_client_id: matchResult.clientId,
      confidence_score: matchResult.score,
      match_reason: matchResult.reason,
      requires_review: matchStatus === "review",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Processing error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
