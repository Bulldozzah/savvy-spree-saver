
ALTER TABLE public.products DROP COLUMN IF EXISTS department_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS merchandise_category_id;
DROP TABLE IF EXISTS public.departments;
DROP TABLE IF EXISTS public.merchandise_categories;
