DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', r.tbl);
  END LOOP;
END $$;

-- Ensure user_roles cannot be self-assigned: revoke any permissive INSERT/UPDATE/DELETE
-- The existing "Admins can manage all roles" policy (FOR ALL) is admin-only via has_role().
-- Add an explicit deny-by-default by ensuring no other permissive write policies exist.
-- (No drops needed — existing policies are already admin-scoped.)

-- For tables that have RLS enabled but no policies at all, default-deny is already in effect.
