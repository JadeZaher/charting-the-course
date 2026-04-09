CREATE TABLE IF NOT EXISTS ctc_handoff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  did VARCHAR(500),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  badge_summary JSONB DEFAULT '{}',
  team_matches JSONB DEFAULT '[]',
  areas_of_focus JSONB DEFAULT '[]',
  orientation_path TEXT,
  orientation_status TEXT DEFAULT 'in_progress',
  ready_for_neos_den BOOLEAN NOT NULL DEFAULT false,
  genplan_payload JSONB DEFAULT '{}',
  genplan_submitted BOOLEAN NOT NULL DEFAULT false,
  genplan_submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_ctc_handoff_user ON ctc_handoff(user_id);
CREATE INDEX IF NOT EXISTS idx_ctc_handoff_ready ON ctc_handoff(ready_for_neos_den);
