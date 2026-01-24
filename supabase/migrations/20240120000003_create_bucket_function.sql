-- ============================================================================
-- Create Function to Ensure Badges Bucket Exists
-- This function can be called programmatically to create the bucket if needed
-- ============================================================================

-- Function to create badges bucket if it doesn't exist
CREATE OR REPLACE FUNCTION ensure_badges_bucket()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bucket_exists boolean;
  result jsonb;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'badges'
  ) INTO bucket_exists;

  IF bucket_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Bucket already exists',
      'bucket_id', 'badges'
    );
  END IF;

  -- Create the bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'badges',
    'badges',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  )
  ON CONFLICT (id) DO NOTHING;

  -- Verify creation
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'badges'
  ) INTO bucket_exists;

  IF bucket_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Bucket created successfully',
      'bucket_id', 'badges'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Failed to create bucket'
    );
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_badges_bucket() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_badges_bucket() TO anon;
