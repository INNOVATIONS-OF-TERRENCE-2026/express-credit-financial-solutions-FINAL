-- Create table for storing AI letter previews
CREATE TABLE public.ai_letter_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  letter_id UUID REFERENCES public.dispute_letters(id),
  preview_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_letter_previews ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_letter_previews
CREATE POLICY "Users can view their own letter previews" 
ON public.ai_letter_previews 
FOR SELECT 
USING (
  client_id IN (
    SELECT clients.id 
    FROM clients 
    WHERE clients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own letter previews" 
ON public.ai_letter_previews 
FOR INSERT 
WITH CHECK (
  client_id IN (
    SELECT clients.id 
    FROM clients 
    WHERE clients.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all letter previews" 
ON public.ai_letter_previews 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage letter previews" 
ON public.ai_letter_previews 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);