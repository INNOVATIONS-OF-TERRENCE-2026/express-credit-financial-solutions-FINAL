
-- Bulk upload batches
CREATE TABLE public.bulk_upload_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  total_files integer NOT NULL DEFAULT 0,
  processed_files integer NOT NULL DEFAULT 0,
  matched_files integer NOT NULL DEFAULT 0,
  needs_review_count integer NOT NULL DEFAULT 0,
  failed_files integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploading'
);

ALTER TABLE public.bulk_upload_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage batches" ON public.bulk_upload_batches FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Bulk upload files
CREATE TABLE public.bulk_upload_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.bulk_upload_batches(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text,
  file_type text,
  detected_document_type text,
  extracted_fields jsonb DEFAULT '{}'::jsonb,
  matched_client_id uuid REFERENCES public.clients(id),
  confidence_score numeric DEFAULT 0,
  match_status text NOT NULL DEFAULT 'pending',
  ai_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_upload_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage bulk files" ON public.bulk_upload_files FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Document match reviews
CREATE TABLE public.document_match_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.bulk_upload_files(id) ON DELETE CASCADE,
  suggested_client_id uuid REFERENCES public.clients(id),
  admin_selected_client_id uuid REFERENCES public.clients(id),
  review_status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_match_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reviews" ON public.document_match_reviews FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Document classification results
CREATE TABLE public.document_classification_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.bulk_upload_files(id) ON DELETE CASCADE,
  document_type text,
  extracted_text text,
  structured_data jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_classification_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage classification" ON public.document_classification_results FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
