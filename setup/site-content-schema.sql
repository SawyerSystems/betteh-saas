-- Site Content Management Schema
-- Run this SQL in Supabase SQL Editor

-- 1. Create site_content table (single row configuration)
CREATE TABLE IF NOT EXISTS site_content (
  id SERIAL PRIMARY KEY,
  banner_video TEXT DEFAULT '',
  hero_images JSONB DEFAULT '[]',
  about JSONB DEFAULT '{
    "bio": "Coach Will brings nearly 10 years of passionate gymnastics instruction to every lesson.",
    "experience": "Nearly 10 years of coaching experience with athletes of all levels",
    "certifications": ["USA Gymnastics Certified", "CPR/First Aid Certified", "Background Checked"]
  }',
  contact JSONB DEFAULT '{
    "phone": "(585) 755-8122",
    "email": "Admin@coachwilltumbles.com",
    "address": {
      "name": "Oceanside Gymnastics",
      "street": "1935 Ave. del Oro #A",
      "city": "Oceanside",
      "state": "CA",
      "zip": "92056"
    }
  }',
  hours JSONB DEFAULT '{
    "monday": {"available": true, "start": "9:00 AM", "end": "4:00 PM"},
    "tuesday": {"available": true, "start": "9:00 AM", "end": "3:30 PM"},
    "wednesday": {"available": true, "start": "9:00 AM", "end": "4:00 PM"},
    "thursday": {"available": true, "start": "9:00 AM", "end": "3:30 PM"},
    "friday": {"available": true, "start": "9:00 AM", "end": "4:00 PM"},
    "saturday": {"available": true, "start": "10:00 AM", "end": "2:00 PM"},
    "sunday": {"available": false, "start": "", "end": ""}
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create faqs table  
CREATE TABLE IF NOT EXISTS site_faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert initial site content row (only if none exists)
INSERT INTO site_content (id) 
SELECT 1 
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE id = 1);

-- 5. Insert default testimonials
INSERT INTO testimonials (name, text, rating, featured) VALUES
('Sarah M.', 'Coach Will is absolutely amazing with kids! My daughter has gained so much confidence and skill in just a few months. The individual attention really makes a difference.', 5, true),
('Mike Johnson', 'Professional, patient, and passionate about gymnastics. Our son loves his lessons and we''ve seen incredible progress in his strength and coordination.', 5, false),
('Lisa Chen', 'Coach Will creates such a positive and encouraging environment. My twins look forward to every session and have developed real gymnastics skills.', 5, false);

-- 6. Insert default FAQs
INSERT INTO site_faqs (question, answer, category, display_order) VALUES
('What age should my child start gymnastics?', 'Most kids are ready by age 4 or 5 — especially if they''re constantly moving, flipping off the couch, or can''t sit still. We adapt to each child''s pace.', 'General', 1),
('What should they wear?', 'Leotards or fitted activewear works best. No skirts, baggy clothes, or zippers. Hair up, no jewelry — just comfort and focus.', 'Preparation', 2),
('Do I need to bring anything?', 'Nope — we provide all the mats, equipment, and safety gear. Just bring a water bottle and good energy.', 'Equipment', 3),
('Can I stay and watch?', 'Absolutely. We have a designated viewing area in the lobby where parents can comfortably watch and cheer from a distance.', 'General', 4);

-- 7. Add updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON site_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_faqs_updated_at BEFORE UPDATE ON site_faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Ensure only one featured testimonial at a time
CREATE OR REPLACE FUNCTION ensure_single_featured_testimonial()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.featured = TRUE THEN
        -- Unset featured for all other testimonials
        UPDATE testimonials SET featured = FALSE WHERE id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_featured_testimonial_trigger 
    BEFORE INSERT OR UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION ensure_single_featured_testimonial();

-- 9. Add RLS policies (if needed)
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_faqs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site content
CREATE POLICY "Allow public read access to site_content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Allow public read access to testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Allow public read access to site_faqs" ON site_faqs FOR SELECT USING (true);

-- Allow authenticated users (service role) to modify content
CREATE POLICY "Allow service role full access to site_content" ON site_content FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access to testimonials" ON testimonials FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access to site_faqs" ON site_faqs FOR ALL USING (auth.role() = 'service_role');
