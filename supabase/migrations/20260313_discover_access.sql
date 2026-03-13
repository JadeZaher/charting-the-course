-- Add per-user Discover page access flag.
-- Admins always have access regardless of this column.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS can_access_discover BOOLEAN NOT NULL DEFAULT false;
