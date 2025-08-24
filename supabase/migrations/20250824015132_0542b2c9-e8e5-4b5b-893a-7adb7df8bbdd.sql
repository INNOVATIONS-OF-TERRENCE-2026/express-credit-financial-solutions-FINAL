-- ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text,
  achieved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- REFERRALS TABLE  
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  referred_email text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR ACHIEVEMENTS
CREATE POLICY "Admins can manage all achievements"
ON public.achievements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view achievements for their clients"  
ON public.achievements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = achievements.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- RLS POLICIES FOR REFERRALS
CREATE POLICY "Admins can manage all referrals"
ON public.referrals  
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage referrals for their clients"
ON public.referrals
FOR ALL  
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = referrals.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Add updated_at trigger for referrals
CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();