import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error('Unauthorized');

    const { reportId, clientId } = await req.json();
    if (!reportId) throw new Error('reportId required');

    // Load report record
    const { data: report, error: reportErr } = await supabase
      .from('credit_report_uploads')
      .select('*')
      .eq('id', reportId)
      .single();
    if (reportErr || !report) throw new Error('Report not found');

    const targetClientId = clientId || report.client_id;

    // Download PDF
    const { data: fileData, error: dlErr } = await supabase.storage
      .from('credit-reports')
      .download(report.file_path);
    if (dlErr) throw new Error(`Download failed: ${dlErr.message}`);

    const arrayBuffer = await fileData.arrayBuffer();
    // Chunked base64 to avoid stack overflow
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as any);
    }
    const base64Data = btoa(binary);

    const prompt = `You are a credit-report extraction expert. Analyze this credit report PDF and return STRICT JSON only.

Extract:
1. FICO 8 scores per bureau (Experian, Equifax, TransUnion). Numbers 300-850 only. Null if not present.
2. Client identity: full_name, dob, address, email if visible.
3. Negative/derogatory accounts (collections, charge-offs, late payments).
4. New accounts and inquiries.
5. FCRA violations (605b time-barred, 611 verification, 623 furnisher, re-aging, mixed file).

Return ONLY this JSON shape:
{
  "scores": { "experian": number|null, "equifax": number|null, "transunion": number|null },
  "identity": { "full_name": string|null, "email": string|null, "dob": string|null, "address": string|null },
  "flaggedAccounts": [{ "creditorName": string, "accountNumber": string, "accountType": string, "balance": number, "status": string, "flagReason": string, "confidence": number, "violationType": string|null, "recommendedDisputeType": string }],
  "fcraViolationCount": number,
  "overallUtilization": number|null,
  "summary": string
}`;

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a credit-report parser. Always respond with valid JSON only.' },
          { role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64Data}` } },
          ] },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('OpenAI error:', errText);
      throw new Error(`OpenAI error ${aiResp.status}`);
    }

    const aiResult = await aiResp.json();
    const content = aiResult.choices[0].message.content;
    let analysis: any;
    try { analysis = JSON.parse(content); } catch { throw new Error('Invalid JSON from AI'); }

    const scores = analysis.scores || {};
    const flagged = analysis.flaggedAccounts || [];

    // Smart client matching if no clientId
    let resolvedClientId = targetClientId;
    let matchConfidence = 1.0;
    if (!resolvedClientId && analysis.identity) {
      const { data: candidates } = await supabase.from('clients').select('id, full_name, email');
      if (candidates) {
        if (analysis.identity.email) {
          const m = candidates.find((c: any) => c.email?.toLowerCase() === analysis.identity.email.toLowerCase());
          if (m) { resolvedClientId = m.id; matchConfidence = 0.98; }
        }
        if (!resolvedClientId && analysis.identity.full_name) {
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
          const target = norm(analysis.identity.full_name);
          const m = candidates.find((c: any) => norm(c.full_name) === target);
          if (m) { resolvedClientId = m.id; matchConfidence = 0.96; }
        }
      }
    }

    // Compute deltas vs prior scores
    let deltas: any = { experian: null, equifax: null, transunion: null };
    if (resolvedClientId) {
      const { data: prior } = await supabase
        .from('client_credit_scores')
        .select('experian_score, equifax_score, transunion_score')
        .eq('client_id', resolvedClientId)
        .maybeSingle();
      if (prior) {
        deltas = {
          experian: scores.experian && prior.experian_score ? scores.experian - prior.experian_score : null,
          equifax: scores.equifax && prior.equifax_score ? scores.equifax - prior.equifax_score : null,
          transunion: scores.transunion && prior.transunion_score ? scores.transunion - prior.transunion_score : null,
        };
      }

      // Upsert current scores (only if confidence high enough)
      if (matchConfidence >= 0.95 && (scores.experian || scores.equifax || scores.transunion)) {
        const upd: any = { client_id: resolvedClientId, source: 'ai_extraction', updated_at: new Date().toISOString(), updated_by: user.id };
        if (scores.experian) upd.experian_score = scores.experian;
        if (scores.equifax) upd.equifax_score = scores.equifax;
        if (scores.transunion) upd.transunion_score = scores.transunion;
        await supabase.from('client_credit_scores').upsert(upd, { onConflict: 'client_id' });

        // History
        for (const bureau of ['experian','equifax','transunion'] as const) {
          if (scores[bureau]) {
            await supabase.from('credit_scores').insert({
              client_id: resolvedClientId,
              bureau: bureau.charAt(0).toUpperCase() + bureau.slice(1),
              score: scores[bureau],
              score_date: new Date().toISOString().split('T')[0],
            } as any);
          }
        }

        // Action tracker
        await supabase.from('client_action_tracker')
          .update({ report_parsed: true, scores_updated: true, credit_report_uploaded: true, updated_at: new Date().toISOString() })
          .eq('client_id', resolvedClientId);

        // Timeline event
        await supabase.from('client_timeline').insert({
          client_id: resolvedClientId,
          event_type: 'score_extracted',
          event_label: `AI extracted scores: EX ${scores.experian ?? '—'} / EQ ${scores.equifax ?? '—'} / TU ${scores.transunion ?? '—'}`,
          event_meta: { scores, deltas, report_id: reportId },
        } as any);
      }
    }

    // Insert flagged disputes
    for (const acc of flagged) {
      await supabase.from('flagged_disputes').insert({
        user_id: user.id,
        credit_report_id: reportId,
        creditor_name: acc.creditorName,
        account_number: acc.accountNumber,
        account_type: acc.accountType,
        balance: acc.balance,
        status: 'flagged',
        flag_reason: acc.flagReason,
        flag_confidence: acc.confidence,
        violation_type: acc.violationType || null,
        recommended_dispute_type: acc.recommendedDisputeType || 'standard_dispute',
        additional_details: {},
      });
    }

    // Update upload record
    await supabase.from('credit_report_uploads').update({
      analysis_status: 'completed',
      flagged_accounts_count: flagged.length,
      ai_analysis_summary: analysis.summary || `Found ${flagged.length} disputable items`,
      client_id: resolvedClientId,
    }).eq('id', reportId);

    // Store full analysis
    await supabase.from('ai_analysis_results').insert({
      user_id: user.id,
      credit_report_id: reportId,
      analysis_type: 'full_extraction',
      flagged_count: flagged.length,
      fcra_violation_count: analysis.fcraViolationCount || 0,
      overall_utilization: analysis.overallUtilization || null,
      summary: { scores, deltas, flaggedCount: flagged.length },
      raw_result: analysis,
      model_used: 'gpt-4o',
    });

    // Notify admins of significant changes
    if (resolvedClientId && (deltas.experian || deltas.equifax || deltas.transunion)) {
      const maxDelta = Math.max(Math.abs(deltas.experian || 0), Math.abs(deltas.equifax || 0), Math.abs(deltas.transunion || 0));
      if (maxDelta >= 10) {
        await supabase.from('admin_notifications').insert({
          notification_type: 'score_change',
          title: `Score change detected (${maxDelta > 0 ? '+' : ''}${maxDelta} pts)`,
          message: `EX: ${deltas.experian ?? '—'}, EQ: ${deltas.equifax ?? '—'}, TU: ${deltas.transunion ?? '—'}`,
          severity: maxDelta >= 30 ? 'warning' : 'info',
          related_client_id: resolvedClientId,
          metadata: { scores, deltas },
          action_url: '?section=war-board',
        } as any);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      scores,
      deltas,
      flaggedAccountsCount: flagged.length,
      matchConfidence,
      resolvedClientId,
      summary: analysis.summary,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('analyze-credit-report error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
