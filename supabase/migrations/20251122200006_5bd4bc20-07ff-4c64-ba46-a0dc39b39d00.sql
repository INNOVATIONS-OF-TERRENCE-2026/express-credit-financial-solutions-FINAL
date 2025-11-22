-- Fix search_path security issue for pipeline functions

CREATE OR REPLACE FUNCTION create_pipeline_stages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stage_names TEXT[] := ARRAY[
    'Day 1 – Review & Intake',
    'Day 2 – Identity Audit (FCRA + Metro 2)',
    'Day 3 – Bureau Package Creation',
    'Day 4 – Upload to Experian/TransUnion/Equifax',
    'Day 5 – ChexSystems Investigation',
    'Day 6 – Supervisor Review',
    'Day 7 – Finalization / Results Update'
  ];
  i INTEGER;
BEGIN
  FOR i IN 1..7 LOOP
    INSERT INTO public.pipeline_stages (user_id, purchase_id, day_number, stage_name, status)
    VALUES (NEW.user_id, NEW.id, i, stage_names[i], 
      CASE WHEN i = 1 THEN 'in_progress' ELSE 'pending' END
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION create_client_timer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.client_timers (user_id, purchase_id, start_date, end_date, current_day, status)
  VALUES (
    NEW.user_id,
    NEW.id,
    now(),
    now() + INTERVAL '7 days',
    1,
    'active'
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION create_required_documents()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_types TEXT[] := ARRAY[
    'government_id',
    'ssn',
    'experian_login',
    'credit_report',
    'verification_code'
  ];
  doc_type TEXT;
BEGIN
  FOREACH doc_type IN ARRAY doc_types LOOP
    INSERT INTO public.client_documents (user_id, purchase_id, document_type, status)
    VALUES (NEW.user_id, NEW.id, doc_type, 'pending');
  END LOOP;
  
  RETURN NEW;
END;
$$;