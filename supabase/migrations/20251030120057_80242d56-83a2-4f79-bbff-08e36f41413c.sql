-- Update user_roles policies to allow super_admin to manage all roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

CREATE POLICY "Super admins can manage all roles"
ON user_roles
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Allow super_admins to do everything admins can do
CREATE POLICY "Super admins can manage products"
ON products
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage store HQs"
ON store_hq
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage stores"
ON stores
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all store prices"
ON store_prices
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));