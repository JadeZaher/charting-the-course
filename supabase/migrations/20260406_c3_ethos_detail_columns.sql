-- C3: Add ETHOS detail columns
ALTER TABLE ethos
  ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'forming'
    CHECK (phase IN ('forming', 'startup', 'established', 'full throttle')),
  ADD COLUMN IF NOT EXISTS map_url TEXT,
  ADD COLUMN IF NOT EXISTS map_type TEXT DEFAULT 'image'
    CHECK (map_type IN ('miro', 'image')),
  ADD COLUMN IF NOT EXISTS map_title TEXT,
  ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]';

-- external_links structure: [{"label": "Notion", "url": "https://..."}, ...]
