-- Add in_stock column to store_prices table
ALTER TABLE public.store_prices
ADD COLUMN in_stock boolean NOT NULL DEFAULT true;

-- Add index for better query performance
CREATE INDEX idx_store_prices_in_stock ON public.store_prices(in_stock);