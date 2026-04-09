-- C4: Participant contacts table
CREATE TABLE participant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ethos_id UUID NOT NULL REFERENCES ethos(id) ON DELETE CASCADE,
  phone TEXT,
  email TEXT,
  consented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ethos_id)
);

ALTER TABLE participant_contacts ENABLE ROW LEVEL SECURITY;

-- User can read/write their own row
CREATE POLICY pc_own ON participant_contacts
  FOR ALL USING (user_id = auth.uid());

-- Users with ethos_user_access for same ethos_id can read others' rows
CREATE POLICY pc_peer_read ON participant_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ethos_user_access
      WHERE user_id = auth.uid()
      AND ethos_id = participant_contacts.ethos_id
    )
  );
