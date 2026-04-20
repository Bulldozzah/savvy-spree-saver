
-- Full CRUD policies for authenticated users on all tables

-- ad_banners: authenticated full access
CREATE POLICY "Authenticated full access on ad_banners"
ON public.ad_banners FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ad_general: authenticated full access
CREATE POLICY "Authenticated full access on ad_general"
ON public.ad_general FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ad_promotions: authenticated full access
CREATE POLICY "Authenticated full access on ad_promotions"
ON public.ad_promotions FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- products: authenticated full access
CREATE POLICY "Authenticated full access on products"
ON public.products FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- profiles: authenticated full access (includes delete)
CREATE POLICY "Authenticated full access on profiles"
ON public.profiles FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- shopping_list_items: authenticated full access
CREATE POLICY "Authenticated full access on shopping_list_items"
ON public.shopping_list_items FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- shopping_lists: authenticated full access
CREATE POLICY "Authenticated full access on shopping_lists"
ON public.shopping_lists FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- store_feedback: authenticated full access
CREATE POLICY "Authenticated full access on store_feedback"
ON public.store_feedback FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- store_hq: authenticated full access
CREATE POLICY "Authenticated full access on store_hq"
ON public.store_hq FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- store_prices: authenticated full access
CREATE POLICY "Authenticated full access on store_prices"
ON public.store_prices FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- stores: authenticated full access
CREATE POLICY "Authenticated full access on stores"
ON public.stores FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- user_roles: authenticated full access
CREATE POLICY "Authenticated full access on user_roles"
ON public.user_roles FOR ALL TO authenticated
USING (true) WITH CHECK (true);
