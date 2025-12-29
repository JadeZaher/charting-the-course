-- ============================================================================
-- CLEAN MIGRATION HISTORY - Remove Old Migrations
-- Run this in Supabase SQL Editor to clean up migration history
-- ============================================================================

-- Remove all old migration entries
DELETE FROM supabase_migrations.schema_migrations
WHERE version IN (
  '20240090000001',
  '20240101000001',
  '20240101000002',
  '20240102000001',
  '20240102000002',
  '20240102000003',
  '20240103000001',
  '20240103000002',
  '20240104000001',
  '20240104000002',
  '20240105000001',
  '20240106000001',
  '20240107000004',
  '20240107000005',
  '20240107000006',
  '20240107000007',
  '20240107000008',
  '99999'
);

-- Mark the final RLS migration as applied (if it exists)
INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
VALUES (
  '20240120000001',
  ARRAY[]::text[],
  'final_rls_complete'
)
ON CONFLICT (version) DO UPDATE SET name = 'final_rls_complete';

-- Show remaining migrations
SELECT 
  version,
  name
FROM supabase_migrations.schema_migrations
ORDER BY version;

SELECT 'Migration history cleaned! Only final RLS migration remains.' as status;
