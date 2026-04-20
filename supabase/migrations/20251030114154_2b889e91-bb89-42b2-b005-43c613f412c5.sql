-- Drop existing products table and recreate with GTIN as primary key
DROP TABLE IF EXISTS shopping_list_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create products table with GTIN as varchar primary key
CREATE TABLE public.products (
  gtin VARCHAR(20) PRIMARY KEY,
  description TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'store_owner', 'shopper');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create store HQ table
CREATE TABLE public.store_hq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.store_hq ENABLE ROW LEVEL SECURITY;

-- Create stores table
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hq_id UUID NOT NULL REFERENCES public.store_hq(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  store_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create store_prices table
CREATE TABLE public.store_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_gtin VARCHAR(20) NOT NULL REFERENCES public.products(gtin) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, product_gtin)
);

ALTER TABLE public.store_prices ENABLE ROW LEVEL SECURITY;

-- Recreate shopping_list_items with new foreign key
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  product_gtin VARCHAR(20) NOT NULL REFERENCES public.products(gtin) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for store_hq
CREATE POLICY "Anyone can view store HQs" ON public.store_hq FOR SELECT USING (true);
CREATE POLICY "Admins can manage store HQs" ON public.store_hq FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for stores
CREATE POLICY "Anyone can view stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Admins can manage stores" ON public.stores FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Store owners can update their store" ON public.stores FOR UPDATE USING (auth.uid() = store_owner_id);

-- RLS Policies for store_prices
CREATE POLICY "Anyone can view store prices" ON public.store_prices FOR SELECT USING (true);
CREATE POLICY "Store owners can manage their store prices" ON public.store_prices FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = store_prices.store_id 
    AND stores.store_owner_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all store prices" ON public.store_prices FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for shopping_list_items
CREATE POLICY "Users can view their shopping list items" ON public.shopping_list_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
    AND shopping_lists.user_id = auth.uid()
  )
);
CREATE POLICY "Users can manage their shopping list items" ON public.shopping_list_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
    AND shopping_lists.user_id = auth.uid()
  )
);

-- Trigger for updating store updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating store_prices updated_at
CREATE TRIGGER update_store_prices_updated_at
BEFORE UPDATE ON public.store_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();