-- Add optional budget column to shopping_lists table
ALTER TABLE shopping_lists 
ADD COLUMN budget DECIMAL(10, 2) NULL;