-- Add assigned_store_id column to shopping_lists table
ALTER TABLE public.shopping_lists 
ADD COLUMN assigned_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;