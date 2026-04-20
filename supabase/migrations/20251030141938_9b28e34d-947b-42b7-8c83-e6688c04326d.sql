-- Fix store owner identity exposure by creating a public view
-- This view excludes store_owner_id to prevent public enumeration of store ownership

CREATE VIEW public.stores_public AS
SELECT id, hq_id, location, created_at, updated_at
FROM public.stores;

-- Grant SELECT permission on the view to authenticated and anon users
GRANT SELECT ON public.stores_public TO authenticated, anon;