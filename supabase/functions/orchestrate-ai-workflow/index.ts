import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiKey = Deno.env.get("OPENAI_API_KEY");

interface AgentResult {
  agent_name: string;
  output: any;
  confidence: number;
  status: string;
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<any> {
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI error: ${resp.status}`);
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}

// ── AGENT: Audit ──
async function runAuditAgent(client: any, reportData: any): Promise<AgentResult> {
  const system = `You are a credit audit engine. Analyze credit report data and identify all negative tradelines, FCRA violations, Metro 2 compliance issues, and inaccuracies. Return JSON:
{
  "accounts": [{"creditor": string, "account_number_masked": string, "balance": number|null, "status": string, "account_type": string, "bureau_presence": string[], "violations": [string], "recommended_action": string}],
  "inquiries": [{"creditor": string, "date": string, "bureau": string, "type": string}],
  "outdated_personal_info": [{"field": string, "reported_value": string, "issue": string}],
  "summary_strategy": string,
  "total_negative_accounts": number,
  "total_violations": number,
  "confidence": number
}`;
  const user = `CLIENT: ${client.full_name}, DOB: ${client.dob}, SSN last4: ${client.ssn_last4}, Address: ${client.address}
CREDIT REPORT DATA: ${JSON.stringify(reportData).substring(0, 8000)}`;
  try {
    const output = await callOpenAI(system, user);
    return { agent_name: "audit_agent", output, confidence: output.confidence || 75, status: "completed" };
  } catch (e) {
    return { agent_name: "audit_agent", output: { error: (e as Error).message }, confidence: 0, status: "failed" };
  }
}

// ── AGENT: 605B Identity Theft Block ──
async function run605BAgent(client: any, auditOutput: any): Promise<AgentResult> {
  const system = `You are a 605B fraud identity theft block specialist. Analyze audit results for fraud indicators and identity mismatches. Determine if 605B (FCRA Section 605B) identity theft block is appropriate. Return JSON:
{
  "fraud_indicators": [string],
  "matched_identity_fields": [string],
  "mismatched_identity_fields": [string],
  "eligible_accounts": [{"creditor": string, "account_number_masked": string, "reason": string}],
  "required_supporting_documents": [string],
  "recommended_605b_reasoning": string,
  "is_605b_recommended": boolean,
  "confidence": number
}`;
  const user = `CLIENT: ${client.full_name}, DOB: ${client.dob}, Address: ${client.address}
AUDIT FINDINGS: ${JSON.stringify(auditOutput).substring(0, 6000)}`;
  try {
    const output = await callOpenAI(system, user);
    return { agent_name: "identity_605b_agent", output, confidence: output.confidence || 60, status: "completed" };
  } catch (e) {
    return { agent_name: "identity_605b_agent", output: { error: (e as Error).message }, confidence: 0, status: "failed" };
  }
}

// ── AGENT: Deletion Cascade ──
async function runDeletionCascadeAgent(auditOutput: any): Promise<AgentResult> {
  const system = `You are a deletion cascade specialist. Identify linked/related tradelines where removing one account triggers downstream deletions. Return JSON:
{
  "primary_targets": [{"creditor": string, "reason": string}],
  "downstream_targets": [{"creditor": string, "linked_to": string, "cascade_reason": string}],
  "predicted_cascade_links": [string],
  "priority_order": [string],
  "estimated_score_impact": string,
  "confidence": number
}`;
  const user = `AUDIT FINDINGS: ${JSON.stringify(auditOutput).substring(0, 6000)}`;
  try {
    const output = await callOpenAI(system, user);
    return { agent_name: "deletion_cascade_agent", output, confidence: output.confidence || 65, status: "completed" };
  } catch (e) {
    return { agent_name: "deletion_cascade_agent", output: { error: (e as Error).message }, confidence: 0, status: "failed" };
  }
}

// ── AGENT: Experian Upload Readiness ──
async function runExperianUploadAgent(client: any, docs: any[]): Promise<AgentResult> {
  const system = `You are an Experian upload readiness specialist. Determine if a client's document package is complete for bureau submission. Return JSON:
{
  "upload_ready": boolean,
  "missing_requirements": [string],
  "upload_sequence": [string],
  "recommended_packet_structure": string,
  "hold_reasons": [string],
  "confidence": number
}`;
  const user = `CLIENT: ${client.full_name}
DOCUMENTS ON FILE: ${JSON.stringify(docs.map((d: any) => ({ type: d.document_type || d.category, name: d.file_name, status: d.status }))).substring(0, 3000)}`;
  try {
    const output = await callOpenAI(system, user);
    return { agent_name: "experian_upload_agent", output, confidence: output.confidence || 70, status: "completed" };
  } catch (e) {
    return { agent_name: "experian_upload_agent", output: { error: (e as Error).message }, confidence: 0, status: "failed" };
  }
}

// ── AGENT: Qualification ──
async function runQualificationAgent(client: any, auditOutput: any): Promise<AgentResult> {
  const system = `You are a credit services qualification agent. Score client readiness for credit repair services, funding readiness, and approval likelihood. Return JSON:
{
  "qualification_status": string,
  "risk_signals": [string],
  "recommendation": string,
  "next_best_service": string,
  "approval_likelihood": string,
  "funding_readiness": string,
  "confidence": number
}`;
  const user = `CLIENT: ${client.full_name}, Plan: ${client.membership_plan || "standard"}
AUDIT SUMMARY: ${JSON.stringify(auditOutput).substring(0, 4000)}`;
  try {
    const output = await callOpenAI(system, user);
    return { agent_name: "qualification_agent", output, confidence: output.confidence || 70, status: "completed" };
  } catch (e) {
    return { agent_name: "qualification_agent", output: { error: (e as Error).message }, confidence: 0, status: "failed" };
  }
}

// ── STRATEGY DECISION ──
function decideStrategy(auditResult: AgentResult, identity605bResult: AgentResult): { type: string; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  const is605b = identity605bResult.output?.is_605b_recommended === true;
  const fraudIndicators = identity605bResult.output?.fraud_indicators?.length || 0;
  const violations = auditResult.output?.total_violations || 0;
  const negativeAccounts = auditResult.output?.total_negative_accounts || 0;

  if (is605b && violations > 0) {
    reasons.push("Fraud indicators detected", "FCRA violations present");
    return { type: "hybrid_605b_plus_dispute", confidence: Math.min((auditResult.confidence + identity605bResult.confidence) / 2, 95), reasons };
  }
  if (is605b || fraudIndicators > 2) {
    reasons.push("Identity theft indicators detected");
    return { type: "605b_identity_theft_block", confidence: identity605bResult.confidence, reasons };
  }
  if (violations > 0 || negativeAccounts > 0) {
    reasons.push(`${violations} violations found`, `${negativeAccounts} negative accounts`);
    return { type: "standard_dispute", confidence: auditResult.confidence, reasons };
  }

  reasons.push("No actionable items detected");
  return { type: "manual_review_required", confidence: 30, reasons };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await anonClient.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
      if (!roleData) return new Response(JSON.stringify({ error: "Admin required" }), { status: 403, headers: corsHeaders });
    }

    const { client_id, report_id, mode } = await req.json();
    if (!client_id) return new Response(JSON.stringify({ error: "client_id required" }), { status: 400, headers: corsHeaders });

    // Fetch client
    const { data: client, error: clientErr } = await supabase.from("clients").select("*").eq("id", client_id).single();
    if (clientErr || !client) return new Response(JSON.stringify({ error: "Client not found" }), { status: 404, headers: corsHeaders });

    // Create processing cycle
    const { data: cycle } = await supabase.from("client_processing_cycles").insert({
      client_id,
      cycle_type: "full_analysis",
      source_credit_report_id: report_id || null,
      status: "processing",
    }).select().single();

    // Create AI workflow
    const { data: workflow } = await supabase.from("ai_workflows").insert({
      client_id,
      cycle_id: cycle?.id,
      workflow_type: "full_analysis",
      current_step: "audit_agent",
      status: "processing",
    }).select().single();

    if (!workflow) throw new Error("Failed to create workflow");

    // Fetch report data
    let reportData: any = {};
    if (report_id) {
      const { data: report } = await supabase.from("credit_report_uploads").select("*").eq("id", report_id).single();
      if (report) reportData = { file_name: report.file_name, analysis_summary: report.ai_analysis_summary, flagged_count: report.flagged_accounts_count };
    }
    // Also fetch flagged disputes
    const { data: flagged } = await supabase.from("flagged_disputes").select("*").eq("client_id", client_id);
    reportData.flagged_disputes = flagged || [];

    // Fetch client documents
    const { data: docs } = await supabase.from("client_documents").select("*").eq("user_id", client.user_id);

    // ── Run agents sequentially (audit first, others depend on it) ──

    // 1. Audit Agent
    await supabase.from("ai_workflows").update({ current_step: "audit_agent" }).eq("id", workflow.id);
    const auditResult = await runAuditAgent(client, reportData);
    const { data: auditRun } = await supabase.from("ai_agent_runs").insert({
      workflow_id: workflow.id,
      agent_name: auditResult.agent_name,
      input_payload: { client_id, report_id },
      output_payload: auditResult.output,
      confidence_score: auditResult.confidence,
      status: auditResult.status,
    }).select().single();

    // 2. 605B Agent (depends on audit)
    await supabase.from("ai_workflows").update({ current_step: "identity_605b_agent" }).eq("id", workflow.id);
    const identity605bResult = await run605BAgent(client, auditResult.output);
    await supabase.from("ai_agent_runs").insert({
      workflow_id: workflow.id,
      agent_name: identity605bResult.agent_name,
      input_payload: { audit_output: "ref:audit" },
      output_payload: identity605bResult.output,
      confidence_score: identity605bResult.confidence,
      status: identity605bResult.status,
    });

    // 3. Deletion Cascade (depends on audit)
    await supabase.from("ai_workflows").update({ current_step: "deletion_cascade_agent" }).eq("id", workflow.id);
    const cascadeResult = await runDeletionCascadeAgent(auditResult.output);
    await supabase.from("ai_agent_runs").insert({
      workflow_id: workflow.id,
      agent_name: cascadeResult.agent_name,
      input_payload: { audit_output: "ref:audit" },
      output_payload: cascadeResult.output,
      confidence_score: cascadeResult.confidence,
      status: cascadeResult.status,
    });

    // 4. Experian Upload Agent (independent)
    await supabase.from("ai_workflows").update({ current_step: "experian_upload_agent" }).eq("id", workflow.id);
    const uploadResult = await runExperianUploadAgent(client, docs || []);
    await supabase.from("ai_agent_runs").insert({
      workflow_id: workflow.id,
      agent_name: uploadResult.agent_name,
      input_payload: { client_id },
      output_payload: uploadResult.output,
      confidence_score: uploadResult.confidence,
      status: uploadResult.status,
    });

    // 5. Qualification Agent (depends on audit)
    await supabase.from("ai_workflows").update({ current_step: "qualification_agent" }).eq("id", workflow.id);
    const qualResult = await runQualificationAgent(client, auditResult.output);
    await supabase.from("ai_agent_runs").insert({
      workflow_id: workflow.id,
      agent_name: qualResult.agent_name,
      input_payload: { audit_output: "ref:audit" },
      output_payload: qualResult.output,
      confidence_score: qualResult.confidence,
      status: qualResult.status,
    });

    // ── Strategy Decision ──
    const strategy = decideStrategy(auditResult, identity605bResult);

    // ── Create CIP ──
    const { data: cip } = await supabase.from("client_intelligence_packets").insert({
      client_id,
      cycle_id: cycle?.id,
      source_report_id: report_id || null,
      full_name: client.full_name,
      dob: client.dob,
      ssn_last4: client.ssn_last4,
      full_address: client.address,
      identity_summary: { matched_fields: identity605bResult.output?.matched_identity_fields || [] },
      bureau_summary: { total_negative: auditResult.output?.total_negative_accounts || 0, total_violations: auditResult.output?.total_violations || 0 },
      negative_accounts: auditResult.output?.accounts || [],
      inquiries: auditResult.output?.inquiries || [],
      outdated_personal_info: auditResult.output?.outdated_personal_info || [],
      violations_identified: auditResult.output?.accounts?.filter((a: any) => a.violations?.length > 0) || [],
      strategy_type: strategy.type,
      strategy_confidence: strategy.confidence,
      status: "completed",
    }).select().single();

    // Update workflow
    const allResults = {
      audit: auditResult.output,
      identity_605b: identity605bResult.output,
      deletion_cascade: cascadeResult.output,
      experian_upload: uploadResult.output,
      qualification: qualResult.output,
      strategy,
    };

    await supabase.from("ai_workflows").update({
      current_step: "completed",
      status: "completed",
      confidence_score: strategy.confidence,
      results: allResults,
    }).eq("id", workflow.id);

    // Update cycle
    await supabase.from("client_processing_cycles").update({ status: "completed" }).eq("id", cycle?.id);

    // ── Auto-generate disputes if autonomous mode is on ──
    const { data: settings } = await supabase.from("autonomous_settings").select("*").limit(1).single();
    const autoGenerate = settings?.auto_generate_disputes && mode === "auto" && strategy.confidence >= (settings?.auto_attach_threshold || 85);

    if (autoGenerate && auditResult.output?.accounts?.length > 0) {
      // Queue dispute generation
      const flaggedAccounts = auditResult.output.accounts
        .filter((a: any) => a.recommended_action && a.recommended_action !== "none")
        .map((a: any) => ({
          account_name: a.creditor,
          account_number_last4: a.account_number_masked,
          bureau: a.bureau_presence?.[0] || "All Bureaus",
          violation_type: a.violations?.[0] || "inaccurate_reporting",
          dispute_reason: a.recommended_action,
        }));

      if (flaggedAccounts.length > 0) {
        // Add to execution queue
        for (const acct of flaggedAccounts) {
          await supabase.from("execution_queue").insert({
            client_id,
            cycle_id: cycle?.id,
            item_type: "auto_dispute",
            item_id: cip?.id || workflow.id,
            queue_status: "queued",
            priority: 1,
          });
        }
      }
    }

    // ── Fire automation event ──
    try {
      await fetch(`${supabaseUrl}/functions/v1/process-automation-event`, {
        method: "POST",
        headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "credit_report_analyzed",
          client_id,
          payload: {
            cip_id: cip?.id,
            workflow_id: workflow.id,
            strategy: strategy.type,
            confidence: strategy.confidence,
          },
          source: "ai_workflow",
        }),
      });
    } catch (e) { console.error("Automation event error:", e); }

    return new Response(JSON.stringify({
      success: true,
      cip_id: cip?.id,
      workflow_id: workflow.id,
      cycle_id: cycle?.id,
      strategy,
      agent_results: {
        audit: { confidence: auditResult.confidence, status: auditResult.status },
        identity_605b: { confidence: identity605bResult.confidence, status: identity605bResult.status },
        deletion_cascade: { confidence: cascadeResult.confidence, status: cascadeResult.status },
        experian_upload: { confidence: uploadResult.confidence, status: uploadResult.status },
        qualification: { confidence: qualResult.confidence, status: qualResult.status },
      },
      auto_disputes_queued: autoGenerate,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Orchestration error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
