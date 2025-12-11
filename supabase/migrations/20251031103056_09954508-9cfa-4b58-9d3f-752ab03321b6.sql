-- Create enum for feedback types
CREATE TYPE public.feedback_type AS ENUM ('Store Service & Experience', 'Product Quality & Experience');

-- Create store_feedback table
CREATE TABLE public.store_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_type public.feedback_type NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_feedback ENABLE ROW LEVEL SECURITY;

-- Users can create feedback
CREATE POLICY "Users can create feedback"
ON public.store_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.store_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Store owners can view feedback for their stores
CREATE POLICY "Store owners can view their store feedback"
ON public.store_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.stores
    WHERE stores.id = store_feedback.store_id
    AND stores.store_owner_id = auth.uid()
  )
);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.store_feedback
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Super admins can manage all feedback
CREATE POLICY "Super admins can manage all feedback"
ON public.store_feedback
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));