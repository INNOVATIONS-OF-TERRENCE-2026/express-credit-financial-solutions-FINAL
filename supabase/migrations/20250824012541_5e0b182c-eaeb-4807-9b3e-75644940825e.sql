-- Enable Row Level Security on bank_links_safe table
ALTER TABLE public.bank_links_safe ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bank_links_safe table to match security of bank_links table

-- Policy: Users can only view their own banking data
CREATE POLICY "Users can view their own bank links safe" 
ON public.bank_links_safe 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own banking data
CREATE POLICY "Users can insert their own bank links safe" 
ON public.bank_links_safe 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own banking data
CREATE POLICY "Users can update their own bank links safe" 
ON public.bank_links_safe 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can only delete their own banking data
CREATE POLICY "Users can delete their own bank links safe" 
ON public.bank_links_safe 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy: Admins can view all banking data (for administrative purposes)
CREATE POLICY "Admins can view all bank links safe" 
ON public.bank_links_safe 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Service role can manage all banking data (for backend operations)
CREATE POLICY "Service role can manage bank links safe" 
ON public.bank_links_safe 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);