-- Migration: create_omnibot_sessions

CREATE TABLE omnibot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'orientation',
  context_id TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  orientation_status TEXT DEFAULT 'not_started';

CREATE INDEX idx_omnibot_sessions_user ON omnibot_sessions(user_id);
CREATE INDEX idx_omnibot_sessions_type ON omnibot_sessions(session_type);

ALTER TABLE omnibot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own omnibot sessions" ON omnibot_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admin can view all omnibot sessions" ON omnibot_sessions
  FOR SELECT TO authenticated USING (is_admin_or_facilitator(auth.uid()));
