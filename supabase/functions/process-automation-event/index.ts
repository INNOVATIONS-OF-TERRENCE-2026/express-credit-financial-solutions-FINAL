import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Event type → timeline mapping
const EVENT_TITLES: Record<string, { title: string; activity_type: string; visible_to_client: boolean }> = {
  document_uploaded: { title: 'Document Uploaded', activity_type: 'document', visible_to_client: true },
  document_classified: { title: 'Document Classified', activity_type: 'document', visible_to_client: false },
  document_matched: { title: 'Document Matched to Profile', activity_type: 'document', visible_to_client: false },
  credit_report_uploaded: { title: 'Credit Report Uploaded', activity_type: 'credit_report', visible_to_client: true },
  credit_report_analyzed: { title: 'Credit Report Analyzed', activity_type: 'analysis', visible_to_client: true },
  violations_detected: { title: 'Violations Detected', activity_type: 'analysis', visible_to_client: true },
  dispute_case_created: { title: 'Dispute Case Created', activity_type: 'dispute', visible_to_client: true },
  dispute_letter_generated: { title: 'Dispute Letter Generated', activity_type: 'dispute', visible_to_client: true },
  dispute_sent_to_review: { title: 'Dispute Under Review', activity_type: 'dispute', visible_to_client: true },
  dispute_approved: { title: 'Dispute Approved', activity_type: 'dispute', visible_to_client: true },
  dispute_rejected: { title: 'Dispute Needs Attention', activity_type: 'dispute', visible_to_client: true },
  dispute_marked_sent: { title: 'Dispute Submitted to Bureau', activity_type: 'dispute', visible_to_client: true },
  score_updated: { title: 'Credit Score Updated', activity_type: 'score', visible_to_client: true },
  score_predicted: { title: 'Score Projection Generated', activity_type: 'score', visible_to_client: true },
  admin_note_added: { title: 'Team Update Posted', activity_type: 'admin', visible_to_client: true },
  followup_due: { title: 'Follow-Up Action Needed', activity_type: 'followup', visible_to_client: true },
  client_profile_updated: { title: 'Profile Updated', activity_type: 'profile', visible_to_client: true },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { event_type, client_id, user_id, payload, source } = await req.json();

    if (!event_type) {
      return new Response(JSON.stringify({ error: 'event_type is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Insert automation event
    const { data: event, error: eventErr } = await supabase
      .from('automation_events')
      .insert({
        event_type,
        client_id: client_id || null,
        user_id: user_id || null,
        event_source: source || 'system',
        payload: payload || {},
        status: 'processing',
      })
      .select('id')
      .single();

    if (eventErr) throw eventErr;

    // 2. Insert timeline entry
    const mapping = EVENT_TITLES[event_type] || { title: event_type, activity_type: 'system', visible_to_client: false };
    
    await supabase.from('client_activity_timeline').insert({
      client_id: client_id || null,
      user_id: user_id || null,
      activity_type: mapping.activity_type,
      title: mapping.title,
      description: payload?.description || mapping.title,
      metadata: payload || {},
      visible_to_client: mapping.visible_to_client,
      visible_to_admin: true,
      created_by_source: source || 'system',
    });

    // 3. Look up notification template
    const { data: template } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('event_type', event_type)
      .eq('is_active', true)
      .single();

    let notificationsSent = 0;

    if (template && (user_id || client_id)) {
      // Check notification preferences
      const targetUserId = user_id || null;
      let prefs = null;
      if (targetUserId) {
        const { data } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', targetUserId)
          .single();
        prefs = data;
      }

      // Default: all enabled if no preferences row
      const emailEnabled = prefs?.email_enabled ?? true;
      const smsEnabled = prefs?.sms_enabled ?? true;
      const inAppEnabled = prefs?.in_app_enabled ?? true;

      // In-app notification
      if (inAppEnabled) {
        await supabase.from('client_notifications').insert({
          client_id: client_id || null,
          user_id: targetUserId,
          channel: 'in_app',
          notification_type: event_type,
          subject: template.subject_template,
          message: template.message_template,
          payload: payload || {},
          status: 'sent',
          provider: 'internal',
        });
        notificationsSent++;
      }

      // Email notification
      if (emailEnabled) {
        try {
          const { error: emailErr } = await supabase.functions.invoke('send-notification-email', {
            body: {
              user_id: targetUserId,
              subject: template.subject_template,
              message: template.message_template,
              event_type,
            },
          });

          await supabase.from('client_notifications').insert({
            client_id: client_id || null,
            user_id: targetUserId,
            channel: 'email',
            notification_type: event_type,
            subject: template.subject_template,
            message: template.message_template,
            status: emailErr ? 'failed' : 'sent',
            provider: 'email',
            sent_at: emailErr ? null : new Date().toISOString(),
            error_message: emailErr?.message || null,
          });
          if (!emailErr) notificationsSent++;
        } catch (emailError) {
          await supabase.from('client_notifications').insert({
            client_id: client_id || null,
            user_id: targetUserId,
            channel: 'email',
            notification_type: event_type,
            subject: template.subject_template,
            message: template.message_template,
            status: 'failed',
            provider: 'email',
            error_message: String(emailError),
          });
        }
      }

      // SMS notification (Twilio-ready, gracefully skips)
      if (smsEnabled) {
        const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER');

        if (twilioSid && twilioToken && twilioFrom) {
          // Future Twilio implementation
          // For now, mark as queued for when Twilio is connected
          await supabase.from('client_notifications').insert({
            client_id: client_id || null,
            user_id: targetUserId,
            channel: 'sms',
            notification_type: event_type,
            subject: template.subject_template,
            message: template.message_template,
            status: 'queued',
            provider: 'twilio',
          });
        } else {
          await supabase.from('client_notifications').insert({
            client_id: client_id || null,
            user_id: targetUserId,
            channel: 'sms',
            notification_type: event_type,
            subject: template.subject_template,
            message: template.message_template,
            status: 'skipped',
            provider: 'twilio',
            error_message: 'SMS provider not configured',
          });
        }
      }
    }

    // 4. Mark event as processed
    await supabase
      .from('automation_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', event.id);

    return new Response(JSON.stringify({
      success: true,
      event_id: event.id,
      notifications_sent: notificationsSent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Automation event error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
