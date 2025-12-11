-- Add RLS policy to allow admins and super_admins to view all profiles for user search
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);