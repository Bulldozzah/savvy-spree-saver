-- Add description to ad_banners
ALTER TABLE ad_banners ADD COLUMN description text;

-- Create general ads table
CREATE TABLE ad_general (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for ad_general
ALTER TABLE ad_general ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_general
CREATE POLICY "Anyone can view active general ads"
  ON ad_general FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage general ads"
  ON ad_general FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_ad_general_updated_at
  BEFORE UPDATE ON ad_general
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();