-- Migration: create_ethos_user_access
-- A3: Per-user ETHOS access control

CREATE TABLE ethos_user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ethos_id UUID NOT NULL REFERENCES ethos(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ethos_id)
);

ALTER TABLE ethos_user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY ethos_access_select ON ethos_user_access
  FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY ethos_access_admin ON ethos_user_access
  FOR ALL USING (is_admin(auth.uid()));
