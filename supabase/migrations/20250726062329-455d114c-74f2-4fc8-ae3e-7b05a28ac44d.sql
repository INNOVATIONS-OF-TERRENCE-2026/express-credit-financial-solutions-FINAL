-- Create bank_links table for Plaid integration
CREATE TABLE IF NOT EXISTS public.bank_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  account_id TEXT NOT NULL,
  institution_name TEXT,
  account_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_links ENABLE ROW LEVEL SECURITY;

-- Users can only see their own bank links
CREATE POLICY "Users can view their own bank links" ON public.bank_links
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own bank links  
CREATE POLICY "Users can insert their own bank links" ON public.bank_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bank links
CREATE POLICY "Users can update their own bank links" ON public.bank_links
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own bank links
CREATE POLICY "Users can delete their own bank links" ON public.bank_links
  FOR DELETE USING (auth.uid() = user_id);