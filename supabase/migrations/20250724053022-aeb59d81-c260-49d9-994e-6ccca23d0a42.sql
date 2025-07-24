-- Create RLS policies for Credit Reports table
CREATE POLICY "Users can view their own credit reports" 
ON public."Credit Reports" 
FOR SELECT 
USING ((auth.uid())::text = "User_id");

CREATE POLICY "Users can insert their own credit reports" 
ON public."Credit Reports" 
FOR INSERT 
WITH CHECK ((auth.uid())::text = "User_id");

CREATE POLICY "Users can update their own credit reports" 
ON public."Credit Reports" 
FOR UPDATE 
USING ((auth.uid())::text = "User_id");

CREATE POLICY "Users can delete their own credit reports" 
ON public."Credit Reports" 
FOR DELETE 
USING ((auth.uid())::text = "User_id");