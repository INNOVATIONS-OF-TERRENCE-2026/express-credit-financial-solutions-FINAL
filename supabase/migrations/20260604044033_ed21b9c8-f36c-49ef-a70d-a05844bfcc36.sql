ALTER TABLE public.document_archive
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doc_type TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_file_url TEXT,
  ADD COLUMN IF NOT EXISTS bureau TEXT,
  ADD COLUMN IF NOT EXISTS ai_analysis TEXT;

CREATE INDEX IF NOT EXISTS idx_document_archive_client_id ON public.document_archive(client_id);

-- Keep doc_type in sync with document_type (legacy alias).
CREATE OR REPLACE FUNCTION public.tg_document_archive_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.doc_type IS NULL AND NEW.document_type IS NOT NULL THEN
    NEW.doc_type := NEW.document_type;
  ELSIF NEW.document_type IS NULL AND NEW.doc_type IS NOT NULL THEN
    NEW.document_type := NEW.doc_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_document_archive_alias_ins ON public.document_archive;
CREATE TRIGGER tg_document_archive_alias_ins
  BEFORE INSERT OR UPDATE ON public.document_archive
  FOR EACH ROW EXECUTE FUNCTION public.tg_document_archive_alias();