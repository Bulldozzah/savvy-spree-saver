-- Create storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('advertisements', 'advertisements', true);

-- Create ad_banners table
CREATE TABLE public.ad_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ad_promotions table (store items on sale)
CREATE TABLE public.ad_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  product_gtin VARCHAR REFERENCES public.products(gtin) ON DELETE CASCADE,
  promotional_price NUMERIC NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_banners
CREATE POLICY "Anyone can view active banners"
ON public.ad_banners FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage banners"
ON public.ad_banners FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for ad_promotions
CREATE POLICY "Anyone can view active promotions"
ON public.ad_promotions FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage promotions"
ON public.ad_promotions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Storage policies for advertisements bucket
CREATE POLICY "Anyone can view ad images"
ON storage.objects FOR SELECT
USING (bucket_id = 'advertisements');

CREATE POLICY "Admins can upload ad images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'advertisements' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can update ad images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'advertisements' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can delete ad images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'advertisements' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

-- Triggers for updated_at
CREATE TRIGGER update_ad_banners_updated_at
BEFORE UPDATE ON public.ad_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_promotions_updated_at
BEFORE UPDATE ON public.ad_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();