-- Add missing foreign key constraints for CRM table relationships
-- Skip existing tables and policies

-- Add foreign keys for proper referential integrity (skip if already exists)
DO $$ 
BEGIN
    -- admin_notes foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_admin_notes_client_id'
    ) THEN
        ALTER TABLE public.admin_notes 
        ADD CONSTRAINT fk_admin_notes_client_id 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;

    -- agreements foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_agreements_client_id'
    ) THEN
        ALTER TABLE public.agreements 
        ADD CONSTRAINT fk_agreements_client_id 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;

    -- credit_analysis foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_credit_analysis_client_id'
    ) THEN
        ALTER TABLE public.credit_analysis 
        ADD CONSTRAINT fk_credit_analysis_client_id 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;

    -- credit_reports foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_credit_reports_client_id'
    ) THEN
        ALTER TABLE public.credit_reports 
        ADD CONSTRAINT fk_credit_reports_client_id 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;

    -- ai_letter_previews foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_ai_letter_previews_client_id'
    ) THEN
        ALTER TABLE public.ai_letter_previews 
        ADD CONSTRAINT fk_ai_letter_previews_client_id 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_ai_letter_previews_letter_id'
    ) THEN
        ALTER TABLE public.ai_letter_previews 
        ADD CONSTRAINT fk_ai_letter_previews_letter_id 
        FOREIGN KEY (letter_id) REFERENCES public.dispute_letters(id) ON DELETE CASCADE;
    END IF;

    -- payments foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payments_client_id'
    ) THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT fk_payments_client_id 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add client_id to documents table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE public.documents 
        ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance (skip if exists)
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_client_id ON public.admin_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_reports_client_id ON public.credit_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_analysis_client_id ON public.credit_analysis(client_id);
CREATE INDEX IF NOT EXISTS idx_dispute_letters_client_id ON public.dispute_letters(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_agreements_client_id ON public.agreements(client_id);

-- Add admin policy for documents table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' AND policyname = 'Admins can manage all documents'
    ) THEN
        CREATE POLICY "Admins can manage all documents" 
        ON public.documents 
        FOR ALL 
        USING (has_role(auth.uid(), 'admin'::app_role));
    END IF;
END $$;