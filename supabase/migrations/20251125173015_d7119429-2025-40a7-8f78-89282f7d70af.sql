-- Add address field to stores table
ALTER TABLE stores ADD COLUMN address TEXT;

COMMENT ON COLUMN stores.address IS 'Full physical address of the store';
COMMENT ON COLUMN stores.location IS 'Store location identifier or branch name';