import { supabase } from '@/integrations/supabase/client';

export type CaseStatus =
  | 'intake_received'
  | 'documents_missing'
  | 'extracted'
  | 'validation_failed'
  | 'validation_passed'
  | 'draft_generated'
  | 'needs_admin_review'
  | 'approved'
  | 'exported'
  | 'followup_due';

export interface DisputeLetterRow {
  id: string;
  user_id: string;
  creditor_name: string;
  account_number: string;
  issue_type: string;
  generated_letter: string;
  case_status: CaseStatus;
  status_updated_at: string;
  assigned_admin: string | null;
  admin_review_notes: string | null;
  letter_type: string | null;
  draft_version: number;
  created_at: string;
  user_email?: string;
}

export interface WorkflowLogEntry {
  id: string;
  dispute_letter_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BacklogCounts {
  intake_received: number;
  documents_missing: number;
  extracted: number;
  validation_failed: number;
  validation_passed: number;
  draft_generated: number;
  needs_admin_review: number;
  approved: number;
  exported: number;
  followup_due: number;
}

export interface AutoDisputeResult {
  created: number;
  errors: string[];
}

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  intake_received: 'Intake Received',
  documents_missing: 'Documents Missing',
  extracted: 'Extracted',
  validation_failed: 'Validation Failed',
  validation_passed: 'Validation Passed',
  draft_generated: 'Draft Generated',
  needs_admin_review: 'Needs Review',
  approved: 'Approved',
  exported: 'Exported',
  followup_due: 'Follow-up Due',
};

export const CASE_STATUS_VARIANTS: Record<CaseStatus, string> = {
  intake_received: 'bg-blue-100 text-blue-800',
  documents_missing: 'bg-yellow-100 text-yellow-800',
  extracted: 'bg-purple-100 text-purple-800',
  validation_failed: 'bg-red-100 text-red-800',
  validation_passed: 'bg-green-100 text-green-800',
  draft_generated: 'bg-indigo-100 text-indigo-800',
  needs_admin_review: 'bg-orange-100 text-orange-800',
  approved: 'bg-emerald-100 text-emerald-800',
  exported: 'bg-teal-100 text-teal-800',
  followup_due: 'bg-amber-100 text-amber-800',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  intake_received: ['documents_missing', 'extracted'],
  documents_missing: ['extracted'],
  extracted: ['validation_failed', 'validation_passed'],
  validation_failed: ['extracted'],
  validation_passed: ['draft_generated'],
  draft_generated: ['needs_admin_review'],
  needs_admin_review: ['approved', 'draft_generated'],
  approved: ['exported'],
  exported: ['followup_due'],
  followup_due: ['intake_received'],
};

export async function transitionDisputeStatus(
  disputeId: string,
  newStatus: CaseStatus,
  userId: string,
  metadata: Record<string, unknown> = {}
) {
  // Get current status
  const { data: dispute, error: fetchError } = await supabase
    .from('dispute_letters')
    .select('case_status')
    .eq('id', disputeId)
    .single();

  if (fetchError) throw new Error(`Failed to fetch dispute: ${fetchError.message}`);

  const currentStatus = (dispute?.case_status as string) || 'intake_received';

  // Validate transition
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
  }

  // Update dispute
  const { error: updateError } = await supabase
    .from('dispute_letters')
    .update({
      case_status: newStatus,
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId);

  if (updateError) throw new Error(`Failed to update status: ${updateError.message}`);

  // Log transition
  const { error: logError } = await supabase
    .from('case_workflow_log')
    .insert({
      dispute_letter_id: disputeId,
      from_status: currentStatus,
      to_status: newStatus,
      changed_by: userId,
      metadata,
    });

  if (logError) console.error('Failed to log transition:', logError);
}

export async function adminApproveDispute(disputeId: string, adminId: string, notes?: string) {
  if (notes) {
    await supabase
      .from('dispute_letters')
      .update({ admin_review_notes: notes, assigned_admin: adminId })
      .eq('id', disputeId);
  }
  await transitionDisputeStatus(disputeId, 'approved', adminId, { action: 'admin_approved', notes });
}

export async function adminRejectDispute(disputeId: string, adminId: string, notes?: string) {
  if (notes) {
    await supabase
      .from('dispute_letters')
      .update({ admin_review_notes: notes, assigned_admin: adminId })
      .eq('id', disputeId);
  }
  await transitionDisputeStatus(disputeId, 'draft_generated', adminId, { action: 'admin_rejected', notes });
}

export async function getAdminReviewQueue(): Promise<DisputeLetterRow[]> {
  const { data, error } = await supabase
    .from('dispute_letters')
    .select('*')
    .eq('case_status', 'needs_admin_review')
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Enrich with emails
  const enriched = await Promise.all(
    (data || []).map(async (d: any) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', d.user_id)
        .single();
      return { ...d, user_email: profile?.email || 'Unknown' } as DisputeLetterRow;
    })
  );

  return enriched;
}

export async function getAllDisputesWithEmails(): Promise<DisputeLetterRow[]> {
  const { data, error } = await supabase
    .from('dispute_letters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const enriched = await Promise.all(
    (data || []).map(async (d: any) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', d.user_id)
        .single();
      return { ...d, user_email: profile?.email || 'Unknown' } as DisputeLetterRow;
    })
  );

  return enriched;
}

export async function getWorkflowLog(disputeId: string): Promise<WorkflowLogEntry[]> {
  const { data, error } = await supabase
    .from('case_workflow_log')
    .select('*')
    .eq('dispute_letter_id', disputeId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as WorkflowLogEntry[];
}

export async function getBacklogCounts(): Promise<BacklogCounts> {
  const statuses: CaseStatus[] = [
    'intake_received', 'documents_missing', 'extracted', 'validation_failed',
    'validation_passed', 'draft_generated', 'needs_admin_review', 'approved',
    'exported', 'followup_due',
  ];

  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const { count, error } = await supabase
      .from('dispute_letters')
      .select('*', { count: 'exact', head: true })
      .eq('case_status', status);

    counts[status] = error ? 0 : (count || 0);
  }

  return counts as unknown as BacklogCounts;
}

export async function triggerExtraction(reportId: string) {
  const { data, error } = await supabase.functions.invoke('analyze-credit-report', {
    body: { reportId, creditReportPath: '', fileName: '' },
  });
  if (error) throw error;
  return data;
}

export async function triggerLetterGeneration(disputeId: string, letterType?: string) {
  const { data, error } = await supabase.functions.invoke('generate-dispute-letter-secure', {
    body: { disputeId, letterType },
  });
  if (error) throw error;
  return data;
}

export async function triggerLetterPreview(disputeId: string) {
  const { data: dispute } = await supabase
    .from('dispute_letters')
    .select('creditor_name, account_number, issue_type, additional_notes')
    .eq('id', disputeId)
    .single();

  if (!dispute) throw new Error('Dispute not found');

  const { data, error } = await supabase.functions.invoke('preview-dispute-letter', {
    body: {
      creditorName: dispute.creditor_name,
      accountNumber: dispute.account_number,
      issueType: dispute.issue_type,
      additionalNotes: dispute.additional_notes,
    },
  });

  if (error) throw error;
  return data;
}

export async function autoCreateDisputesFromFlags(
  userId: string,
  reportId: string
): Promise<AutoDisputeResult> {
  const { data: flags, error } = await supabase
    .from('flagged_disputes')
    .select('*')
    .eq('user_id', userId)
    .eq('credit_report_id', reportId)
    .eq('dispute_letter_generated', false);

  if (error) throw error;

  let created = 0;
  const errors: string[] = [];

  for (const flag of flags || []) {
    const { error: insertError } = await supabase.from('dispute_letters').insert({
      user_id: userId,
      creditor_name: flag.creditor_name,
      account_number: flag.account_number || '',
      issue_type: flag.flag_reason,
      dispute_reason: flag.flag_reason,
      letter_title: `Dispute - ${flag.creditor_name}`,
      generated_letter: '',
      case_status: 'intake_received',
      letter_type: flag.recommended_dispute_type || 'standard_dispute',
    });

    if (insertError) {
      errors.push(`${flag.creditor_name}: ${insertError.message}`);
    } else {
      created++;
      await supabase
        .from('flagged_disputes')
        .update({ dispute_letter_generated: true })
        .eq('id', flag.id);
    }
  }

  return { created, errors };
}
