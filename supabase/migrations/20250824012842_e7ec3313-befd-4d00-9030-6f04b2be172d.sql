-- Add missing SELECT policy for users to view their own banking data
CREATE POLICY "Users can view their own bank links" 
ON public.bank_links 
FOR SELECT 
USING (auth.uid() = user_id);

-- Verify all RLS policies are in place
-- This should now have complete CRUD operations for users on their own data:
-- INSERT ✓ (existing)
-- SELECT ✓ (new policy added)
-- UPDATE ✓ (existing) 
-- DELETE ✓ (existing)

-- Additional security: Add a constraint to ensure user_id is never null
-- This prevents any records without proper ownership
ALTER TABLE public.bank_links 
ALTER COLUMN user_id SET NOT NULL;