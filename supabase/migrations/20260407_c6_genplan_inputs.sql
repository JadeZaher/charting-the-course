-- C6: GenPlan inputs table
-- Stores structured section-level answers collected during orientation.
-- This is CTC-side data handed to Chief Den for GenPlan generation.
-- NOTE: The edge function that writes to this table (orientation/save-progress
-- update) is deferred until B4 (shared Railway PostgreSQL bridge) is complete.

CREATE TABLE genplan_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ethos_id UUID NOT NULL REFERENCES ethos(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  choice_key TEXT NOT NULL,
  choice_label TEXT NOT NULL,
  output_text TEXT NOT NULL,
  journey_step_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ethos_id, section_key)
);

ALTER TABLE genplan_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY gpi_own ON genplan_inputs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY gpi_admin ON genplan_inputs
  FOR ALL USING (is_admin(auth.uid()));
