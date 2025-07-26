-- Create table for AI-flagged disputes
CREATE TABLE public.flagged_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_report_id UUID,
  creditor_name TEXT NOT NULL,
  account_number TEXT,
  account_type TEXT,
  balance DECIMAL(10,2),
  status TEXT NOT NULL,
  flag_reason TEXT NOT NULL,
  flag_confidence DECIMAL(3,2), -- 0.00 to 1.00
  additional_details JSONB,
  admin_reviewed BOOLEAN DEFAULT false,
  admin_approved BOOLEAN,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  dispute_letter_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flagged_disputes ENABLE ROW LEVEL SECURITY;

-- Create policies for flagged disputes
CREATE POLICY "Users can view their own flagged disputes" 
ON public.flagged_disputes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all flagged disputes" 
ON public.flagged_disputes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update flagged disputes" 
ON public.flagged_disputes 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert flagged disputes" 
ON public.flagged_disputes 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_flagged_disputes_updated_at
BEFORE UPDATE ON public.flagged_disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_flagged_disputes_user_id ON public.flagged_disputes(user_id);
CREATE INDEX idx_flagged_disputes_admin_reviewed ON public.flagged_disputes(admin_reviewed);
CREATE INDEX idx_flagged_disputes_created_at ON public.flagged_disputes(created_at DESC);