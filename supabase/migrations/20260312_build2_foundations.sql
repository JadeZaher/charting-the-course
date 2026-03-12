-- Build 2: app_settings generic key/value store + profiles personal map fields

-- app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings" ON app_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can write app settings" ON app_settings
  FOR ALL TO authenticated USING (is_admin_or_facilitator());

-- Seed default CTC map settings row
INSERT INTO app_settings (key, value) VALUES
  ('ctc_map', '{"prezi_url": "", "description": ""}')
ON CONFLICT (key) DO NOTHING;

-- Extend profiles with personal map fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_map_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_map_notes TEXT;
