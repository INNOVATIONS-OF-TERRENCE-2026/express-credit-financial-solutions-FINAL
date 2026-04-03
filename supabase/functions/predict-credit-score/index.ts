import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { client_id, user_id, report_id } = await req.json();
    if (!client_id) {
      return new Response(JSON.stringify({ error: 'client_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch current scores
    const { data: scores } = await supabase
      .from('client_credit_scores')
      .select('*')
      .eq('client_id', client_id)
      .single();

    // Fetch dispute data
    const { data: disputeCases } = await supabase
      .from('dispute_cases')
      .select('*')
      .eq('client_id', client_id);

    const { data: flaggedDisputes } = await supabase
      .from('flagged_disputes')
      .select('*')
      .eq('client_id', client_id);

    const currentExperian = scores?.experian_score || null;
    const currentEquifax = scores?.equifax_score || null;
    const currentTransunion = scores?.transunion_score || null;

    const totalDisputes = (disputeCases?.length || 0);
    const pendingDisputes = disputeCases?.filter((d: any) => d.status === 'pending' || d.status === 'generated').length || 0;
    const completedDisputes = disputeCases?.filter((d: any) => d.status === 'completed').length || 0;
    const flaggedCount = flaggedDisputes?.length || 0;

    // Call OpenAI for prediction
    const prompt = `You are a credit score prediction analyst. Based on the following data, estimate the likely score range after dispute removals.

Current scores: Experian: ${currentExperian || 'Unknown'}, Equifax: ${currentEquifax || 'Unknown'}, TransUnion: ${currentTransunion || 'Unknown'}
Total flagged negative items: ${flaggedCount}
Active dispute cases: ${totalDisputes}
Pending disputes: ${pendingDisputes}
Completed/removed disputes: ${completedDisputes}

Provide your response as JSON with this exact structure:
{
  "predicted_experian_min": number or null,
  "predicted_experian_max": number or null,
  "predicted_equifax_min": number or null,
  "predicted_equifax_max": number or null,
  "predicted_transunion_min": number or null,
  "predicted_transunion_max": number or null,
  "confidence_level": number between 0 and 1,
  "factors": ["factor1", "factor2", ...]
}

Rules:
- If a current score is unknown, set predicted min/max to null
- Each predicted range should be 20-80 points wide
- Factor in typical score improvements from dispute removals (10-40 points per removed negative item)
- Be conservative in estimates
- confidence_level should reflect data quality (lower if scores unknown)`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    const aiData = await aiResponse.json();
    const prediction = JSON.parse(aiData.choices[0].message.content);

    // Save prediction
    const { data: saved, error: saveErr } = await supabase
      .from('score_predictions')
      .insert({
        client_id,
        user_id: user_id || scores?.user_id || null,
        current_experian: currentExperian,
        current_equifax: currentEquifax,
        current_transunion: currentTransunion,
        predicted_experian_min: prediction.predicted_experian_min,
        predicted_experian_max: prediction.predicted_experian_max,
        predicted_equifax_min: prediction.predicted_equifax_min,
        predicted_equifax_max: prediction.predicted_equifax_max,
        predicted_transunion_min: prediction.predicted_transunion_min,
        predicted_transunion_max: prediction.predicted_transunion_max,
        factors: { factors: prediction.factors },
        confidence_level: prediction.confidence_level,
        based_on_report_id: report_id || null,
      })
      .select('id')
      .single();

    if (saveErr) throw saveErr;

    // Trigger automation event
    await supabase.functions.invoke('process-automation-event', {
      body: {
        event_type: 'score_predicted',
        client_id,
        user_id: user_id || scores?.user_id,
        payload: { prediction_id: saved.id },
        source: 'ai_prediction',
      },
    });

    return new Response(JSON.stringify({
      success: true,
      prediction_id: saved.id,
      prediction,
      disclaimer: 'These are AI-assisted estimates based on available data. Actual score changes may vary. This is not a guarantee of future credit scores.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Score prediction error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
