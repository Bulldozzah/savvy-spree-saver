
ALTER TABLE public.store_prices 
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'store_owner' CHECK (source IN ('shopper', 'store_owner'));
