-- Create profile_layouts table for multiple profile views per user
-- Each user can have multiple layouts with different visibility/ordering of tiles

CREATE TABLE IF NOT EXISTS profile_layouts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL DEFAULT 'Public',
  slug VARCHAR NOT NULL DEFAULT 'public',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, slug)
);

-- Create tile_layout_settings table for per-layout tile visibility and ordering
-- This allows the same tile to appear differently in different layouts

CREATE TABLE IF NOT EXISTS tile_layout_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  layout_id VARCHAR NOT NULL REFERENCES profile_layouts(id) ON DELETE CASCADE,
  tile_id VARCHAR NOT NULL REFERENCES profile_tiles(id) ON DELETE CASCADE,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(layout_id, tile_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profile_layouts_user ON profile_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_layouts_slug ON profile_layouts(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_tile_layout_settings_layout ON tile_layout_settings(layout_id);
CREATE INDEX IF NOT EXISTS idx_tile_layout_settings_tile ON tile_layout_settings(tile_id);

-- Enable RLS
ALTER TABLE profile_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tile_layout_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_layouts
DROP POLICY IF EXISTS "profile_layouts_select_own" ON profile_layouts;
DROP POLICY IF EXISTS "profile_layouts_select_public" ON profile_layouts;
DROP POLICY IF EXISTS "profile_layouts_insert_own" ON profile_layouts;
DROP POLICY IF EXISTS "profile_layouts_update_own" ON profile_layouts;
DROP POLICY IF EXISTS "profile_layouts_delete_own" ON profile_layouts;

-- Users can view their own layouts
CREATE POLICY "profile_layouts_select_own" ON profile_layouts
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Anyone can view default public layouts (for public profile viewing)
CREATE POLICY "profile_layouts_select_public" ON profile_layouts
  FOR SELECT
  USING (is_default = true);

CREATE POLICY "profile_layouts_insert_own" ON profile_layouts
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "profile_layouts_update_own" ON profile_layouts
  FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "profile_layouts_delete_own" ON profile_layouts
  FOR DELETE
  USING (user_id = auth.uid()::text AND is_default = false);

-- RLS Policies for tile_layout_settings
DROP POLICY IF EXISTS "tile_layout_settings_select_via_layout" ON tile_layout_settings;
DROP POLICY IF EXISTS "tile_layout_settings_insert_via_layout" ON tile_layout_settings;
DROP POLICY IF EXISTS "tile_layout_settings_update_via_layout" ON tile_layout_settings;
DROP POLICY IF EXISTS "tile_layout_settings_delete_via_layout" ON tile_layout_settings;

-- Users can view settings for layouts they own
CREATE POLICY "tile_layout_settings_select_via_layout" ON tile_layout_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_layouts pl 
      WHERE pl.id = tile_layout_settings.layout_id 
      AND (pl.user_id = auth.uid()::text OR pl.is_default = true)
    )
  );

CREATE POLICY "tile_layout_settings_insert_via_layout" ON tile_layout_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_layouts pl 
      WHERE pl.id = tile_layout_settings.layout_id 
      AND pl.user_id = auth.uid()::text
    )
  );

CREATE POLICY "tile_layout_settings_update_via_layout" ON tile_layout_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profile_layouts pl 
      WHERE pl.id = tile_layout_settings.layout_id 
      AND pl.user_id = auth.uid()::text
    )
  );

CREATE POLICY "tile_layout_settings_delete_via_layout" ON tile_layout_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profile_layouts pl 
      WHERE pl.id = tile_layout_settings.layout_id 
      AND pl.user_id = auth.uid()::text
    )
  );

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_profile_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profile_layouts_updated_at ON profile_layouts;
CREATE TRIGGER trigger_profile_layouts_updated_at
  BEFORE UPDATE ON profile_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_layouts_updated_at();

CREATE OR REPLACE FUNCTION update_tile_layout_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tile_layout_settings_updated_at ON tile_layout_settings;
CREATE TRIGGER trigger_tile_layout_settings_updated_at
  BEFORE UPDATE ON tile_layout_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tile_layout_settings_updated_at();
