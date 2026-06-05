CREATE OR REPLACE FUNCTION public.prevent_user_id_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Allow linking NULL -> uuid (production recovery / portal linking) for admins or self.
  IF OLD.user_id IS NULL AND NEW.user_id IS NOT NULL THEN
    IF public.has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;
    IF NEW.user_id = auth.uid() THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Only admins or the matching user may link this record to a portal account';
  END IF;

  -- Block changing user_id from one user to a different user (no overwrites or transfers).
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'user_id cannot be modified after creation';
  END IF;

  -- For non-admin updates, the row must still belong to the caller.
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS NOT NULL AND NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;

  RETURN NEW;
END;
$$;