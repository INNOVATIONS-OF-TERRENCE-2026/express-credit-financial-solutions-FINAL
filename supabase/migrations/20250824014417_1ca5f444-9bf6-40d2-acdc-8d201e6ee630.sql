-- Add signature_url column to dispute_letters table
ALTER TABLE public.dispute_letters 
ADD COLUMN signature_url text;