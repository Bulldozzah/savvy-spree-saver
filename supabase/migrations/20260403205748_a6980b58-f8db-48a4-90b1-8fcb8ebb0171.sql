-- Create departments lookup table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access on departments" ON public.departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT TO public USING (true);

-- Create category_groups lookup table
CREATE TABLE public.category_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access on category_groups" ON public.category_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view category_groups" ON public.category_groups FOR SELECT TO public USING (true);

-- Create merchandise_categories lookup table
CREATE TABLE public.merchandise_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.merchandise_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access on merchandise_categories" ON public.merchandise_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view merchandise_categories" ON public.merchandise_categories FOR SELECT TO public USING (true);

-- Add FK columns to products
ALTER TABLE public.products
  ADD COLUMN department_id uuid REFERENCES public.departments(id),
  ADD COLUMN category_group_id uuid REFERENCES public.category_groups(id),
  ADD COLUMN merchandise_category_id uuid REFERENCES public.merchandise_categories(id);

-- Seed departments
INSERT INTO public.departments (name) VALUES
  ('Groceries'),
  ('Wine & Liquor'),
  ('Frozen Perishables'),
  ('Electronics & Media');

-- Seed category groups
INSERT INTO public.category_groups (name) VALUES
  ('CLEANING CONSUMABLES'),
  ('HOT DRINKS, ADDITIVES,UHT MILK'),
  ('LIQUOR'),
  ('FROZEN MEATS'),
  ('CONDIMENTS, OILS AND SPICES'),
  ('AUDIO AND MEDIA');

-- Seed merchandise categories
INSERT INTO public.merchandise_categories (name) VALUES
  ('SOAP AND SOAP POWDERS'),
  ('SUGAR AND SWEETENERS'),
  ('LIQUEUR'),
  ('FROZEN POULTRY'),
  ('HOUSEHOLD INSECTICIDES'),
  ('BEER'),
  ('HOME ELECTRONICS'),
  ('EDIBLE OIL');

-- Seed sample products
INSERT INTO public.products (gtin, description, department_id, category_group_id, merchandise_category_id)
VALUES
  ('6009711320432', 'WASHING POWDER POUCH BOOM 4.5KG',
    (SELECT id FROM departments WHERE name='Groceries'),
    (SELECT id FROM category_groups WHERE name='CLEANING CONSUMABLES'),
    (SELECT id FROM merchandise_categories WHERE name='SOAP AND SOAP POWDERS')),
  ('710535375350', 'SUGAR BROWN MANSA 10KG',
    (SELECT id FROM departments WHERE name='Groceries'),
    (SELECT id FROM category_groups WHERE name='HOT DRINKS, ADDITIVES,UHT MILK'),
    (SELECT id FROM merchandise_categories WHERE name='SUGAR AND SWEETENERS')),
  ('6001495062508', 'LIQUEUR CREAM AMARULA 750ML',
    (SELECT id FROM departments WHERE name='Wine & Liquor'),
    (SELECT id FROM category_groups WHERE name='LIQUOR'),
    (SELECT id FROM merchandise_categories WHERE name='LIQUEUR')),
  ('6001490000222', 'IQF MIXED PORTIONS SUPREME 5KG PACK',
    (SELECT id FROM departments WHERE name='Frozen Perishables'),
    (SELECT id FROM category_groups WHERE name='FROZEN MEATS'),
    (SELECT id FROM merchandise_categories WHERE name='FROZEN POULTRY')),
  ('6004201004120', 'INSECTICIDE MOSQ PEACEFUL SLEEP 180ML',
    (SELECT id FROM departments WHERE name='Groceries'),
    (SELECT id FROM category_groups WHERE name='CLEANING CONSUMABLES'),
    (SELECT id FROM merchandise_categories WHERE name='HOUSEHOLD INSECTICIDES')),
  ('6009670892032', 'SUGAR WHITE HOUSEHOLD ZAM 2KG PACK',
    (SELECT id FROM departments WHERE name='Groceries'),
    (SELECT id FROM category_groups WHERE name='HOT DRINKS, ADDITIVES,UHT MILK'),
    (SELECT id FROM merchandise_categories WHERE name='SUGAR AND SWEETENERS')),
  ('6003326015721', 'BEER LITE CASTLE 330ML NRB',
    (SELECT id FROM departments WHERE name='Wine & Liquor'),
    (SELECT id FROM category_groups WHERE name='LIQUOR'),
    (SELECT id FROM merchandise_categories WHERE name='BEER')),
  ('6009670892049', 'SUGAR WHITE HOUSEHOLD ZAM 10KG BAG',
    (SELECT id FROM departments WHERE name='Groceries'),
    (SELECT id FROM category_groups WHERE name='HOT DRINKS, ADDITIVES,UHT MILK'),
    (SELECT id FROM merchandise_categories WHERE name='SUGAR AND SWEETENERS')),
  ('4897082665588', 'P/POWER STATION DELTAPRO ECOFLOW 3600WH',
    (SELECT id FROM departments WHERE name='Electronics & Media'),
    (SELECT id FROM category_groups WHERE name='AUDIO AND MEDIA'),
    (SELECT id FROM merchandise_categories WHERE name='HOME ELECTRONICS')),
  ('6004201004816', 'REPELLANT MOSQUITO PEACEFUL SLEEP 150G',
    (SELECT id FROM departments WHERE name='Groceries'),
    (SELECT id FROM category_groups WHERE name='CLEANING CONSUMABLES'),
    (SELECT id FROM merchandise_categories WHERE name='HOUSEHOLD INSECTICIDES')),
  ('6009706160586', 'OIL SOYA ZAMGOLD 5L',
    (SELECT id FROM departments WHERE name='Groceries'),
    (SELECT id FROM category_groups WHERE name='CONDIMENTS, OILS AND SPICES'),
    (SELECT id FROM merchandise_categories WHERE name='EDIBLE OIL'))
ON CONFLICT (gtin) DO UPDATE SET
  department_id = EXCLUDED.department_id,
  category_group_id = EXCLUDED.category_group_id,
  merchandise_category_id = EXCLUDED.merchandise_category_id;