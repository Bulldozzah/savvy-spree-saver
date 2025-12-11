-- Create products table for admin to import GTIN and product descriptions
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gtin TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products are viewable by everyone
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- Only authenticated users can insert/update/delete products (admin functionality)
CREATE POLICY "Authenticated users can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete products" 
ON public.products 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create shopping lists table
CREATE TABLE public.shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for shopping lists
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- Users can view their own shopping lists
CREATE POLICY "Users can view their own shopping lists" 
ON public.shopping_lists 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own shopping lists
CREATE POLICY "Users can create their own shopping lists" 
ON public.shopping_lists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own shopping lists
CREATE POLICY "Users can update their own shopping lists" 
ON public.shopping_lists 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own shopping lists
CREATE POLICY "Users can delete their own shopping lists" 
ON public.shopping_lists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create shopping list items table
CREATE TABLE public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for shopping list items
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Users can view items from their own shopping lists
CREATE POLICY "Users can view their own shopping list items" 
ON public.shopping_list_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE id = shopping_list_items.shopping_list_id 
    AND user_id = auth.uid()
  )
);

-- Users can add items to their own shopping lists
CREATE POLICY "Users can add items to their own shopping lists" 
ON public.shopping_list_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE id = shopping_list_items.shopping_list_id 
    AND user_id = auth.uid()
  )
);

-- Users can update items in their own shopping lists
CREATE POLICY "Users can update their own shopping list items" 
ON public.shopping_list_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE id = shopping_list_items.shopping_list_id 
    AND user_id = auth.uid()
  )
);

-- Users can delete items from their own shopping lists
CREATE POLICY "Users can delete their own shopping list items" 
ON public.shopping_list_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE id = shopping_list_items.shopping_list_id 
    AND user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
BEFORE UPDATE ON public.shopping_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster product lookups
CREATE INDEX idx_products_gtin ON public.products(gtin);
CREATE INDEX idx_shopping_lists_user_id ON public.shopping_lists(user_id);
CREATE INDEX idx_shopping_list_items_list_id ON public.shopping_list_items(shopping_list_id);