-- Fix security definer warning by recreating view with SECURITY INVOKER
DROP VIEW IF EXISTS public.stores_public;

CREATE VIEW public.stores_public 
WITH (security_invoker = true) AS
SELECT id, hq_id, location, created_at, updated_at
FROM public.stores;

-- Grant SELECT permission on the view
GRANT SELECT ON public.stores_public TO authenticated, anon;