-- Create credit_scores table for tracking credit scores over time
CREATE TABLE public.credit_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bureau TEXT NOT NULL CHECK (bureau IN ('Experian', 'Equifax', 'TransUnion')),
  score INTEGER NOT NULL CHECK (score >= 300 AND score <= 850),
  score_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for users to manage their own scores
CREATE POLICY "Users can view their own credit scores" 
ON public.credit_scores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit scores" 
ON public.credit_scores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit scores" 
ON public.credit_scores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit scores" 
ON public.credit_scores 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can manage all credit scores" 
ON public.credit_scores 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_credit_scores_updated_at
BEFORE UPDATE ON public.credit_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX idx_credit_scores_user_date ON public.credit_scores(user_id, score_date DESC);
CREATE INDEX idx_credit_scores_bureau ON public.credit_scores(bureau, user_id);