-- Migration: create_journey_maps

CREATE TABLE journey_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ethos_id UUID REFERENCES ethos(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sector_alignment TEXT[],
  role_types TEXT[],
  min_alignment_score INTEGER DEFAULT 0,
  content_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
  exit_package JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE user_journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ethos_id UUID NOT NULL REFERENCES ethos(id) ON DELETE CASCADE,
  journey_map_id UUID NOT NULL REFERENCES journey_maps(id) ON DELETE CASCADE,
  orientation_path TEXT NOT NULL DEFAULT 'explorer',
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}',
  step_responses JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  was_recommended BOOLEAN DEFAULT true,
  misalignment_flags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, ethos_id)
);

CREATE INDEX idx_user_journey_user ON user_journey_progress(user_id);
CREATE INDEX idx_user_journey_ethos ON user_journey_progress(ethos_id);
CREATE INDEX idx_user_journey_status ON user_journey_progress(status);
CREATE INDEX idx_journey_maps_ethos ON journey_maps(ethos_id);

ALTER TABLE journey_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active journey maps" ON journey_maps
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admin can manage journey maps" ON journey_maps
  FOR ALL TO authenticated USING (is_admin_or_facilitator(auth.uid()));

CREATE POLICY "Users can view own journey progress" ON user_journey_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin_or_facilitator(auth.uid()));

CREATE POLICY "Users can upsert own journey progress" ON user_journey_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own journey progress" ON user_journey_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admin can view all journey progress" ON user_journey_progress
  FOR SELECT TO authenticated USING (is_admin_or_facilitator(auth.uid()));
