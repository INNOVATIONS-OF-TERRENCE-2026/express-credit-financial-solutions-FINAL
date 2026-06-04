-- Drop legacy/orphan tables. Each table has zero application references in the repo.
-- Triggers/policies are dropped automatically with CASCADE.

DROP TABLE IF EXISTS public."Credit Reports" CASCADE;
DROP TABLE IF EXISTS public.document_uploads CASCADE;
DROP TABLE IF EXISTS public.client_documents CASCADE;
DROP TABLE IF EXISTS public.dispute_docs CASCADE;
DROP TABLE IF EXISTS public.identity_docs CASCADE;
DROP TABLE IF EXISTS public.ai_dispute_letters CASCADE;
DROP TABLE IF EXISTS public.dispute_timeline CASCADE;
DROP TABLE IF EXISTS public.dispute_cases CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.admin_notifications CASCADE;
DROP TABLE IF EXISTS public.client_action_tracker CASCADE;
DROP TABLE IF EXISTS public.client_payment_summary CASCADE;
DROP TABLE IF EXISTS public.cashapp_orders CASCADE;

-- Drop the trigger function tied to client_payment_summary if it still exists
DROP FUNCTION IF EXISTS public.tg_payment_summary_sync() CASCADE;