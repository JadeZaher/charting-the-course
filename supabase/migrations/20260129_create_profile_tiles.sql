-- Create profile_tiles table for generic tile architecture
-- This table stores all profile content tiles generated from quiz results

CREATE TABLE IF NOT EXISTS profile_tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES quiz_results(id) ON DELETE CASCADE,
  tile_type VARCHAR NOT NULL CHECK (tile_type IN ('badge', 'text', 'chart', 'list', 'score', 'custom')),
  dimension VARCHAR CHECK (dimension IN ('personality', 'strengths', 'values', 'interests', 'growth')),
  title VARCHAR NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profile_tiles_user ON profile_tiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_tiles_submission ON profile_tiles(submission_id);
CREATE INDEX IF NOT EXISTS idx_profile_tiles_dimension ON profile_tiles(dimension);

-- Enable RLS
ALTER TABLE profile_tiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (also defined in permissions_rls.sql but included here for standalone execution)
DROP POLICY IF EXISTS "profile_tiles_select_own" ON profile_tiles;
DROP POLICY IF EXISTS "profile_tiles_insert_own" ON profile_tiles;
DROP POLICY IF EXISTS "profile_tiles_update_own" ON profile_tiles;
DROP POLICY IF EXISTS "profile_tiles_delete_own" ON profile_tiles;

CREATE POLICY "profile_tiles_select_own" ON profile_tiles
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "profile_tiles_insert_own" ON profile_tiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "profile_tiles_update_own" ON profile_tiles
  FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "profile_tiles_delete_own" ON profile_tiles
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_profile_tiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profile_tiles_updated_at ON profile_tiles;
CREATE TRIGGER trigger_profile_tiles_updated_at
  BEFORE UPDATE ON profile_tiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_tiles_updated_at();
