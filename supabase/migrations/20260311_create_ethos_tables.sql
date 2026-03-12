-- Migration: create_ethos_tables
-- ETHOS table: each ETHOS is an Emergent Thriving Holonic Organizational Structure

CREATE TABLE ethos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  mission TEXT,
  sector TEXT,
  ethos_type TEXT DEFAULT 'team',
  parent_ethos_id UUID REFERENCES ethos(id) ON DELETE SET NULL,
  external_url TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE ethos_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ethos_id UUID NOT NULL REFERENCES ethos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_in_ethos TEXT,
  member_type TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(ethos_id, user_id)
);

CREATE TABLE ethos_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ethos_id UUID NOT NULL REFERENCES ethos(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(ethos_id, team_id)
);

CREATE INDEX idx_ethos_sector ON ethos(sector);
CREATE INDEX idx_ethos_active ON ethos(is_active);
CREATE INDEX idx_ethos_members_ethos ON ethos_members(ethos_id);
CREATE INDEX idx_ethos_members_user ON ethos_members(user_id);

ALTER TABLE ethos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ethos_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ethos_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active ethos" ON ethos
  FOR SELECT USING (is_active = true AND is_public = true);

CREATE POLICY "Authenticated can view all active ethos" ON ethos
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admin can manage ethos" ON ethos
  FOR ALL TO authenticated USING (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "Authenticated can view ethos members" ON ethos_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage ethos members" ON ethos_members
  FOR ALL TO authenticated USING (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "Authenticated can view ethos teams" ON ethos_teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage ethos teams" ON ethos_teams
  FOR ALL TO authenticated USING (is_admin_or_facilitator(auth.uid()));
