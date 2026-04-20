-- Add latitude and longitude columns to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;