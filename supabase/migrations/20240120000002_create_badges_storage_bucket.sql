-- ============================================================================
-- Create Badges Storage Bucket
-- This migration creates the badges storage bucket for badge icon uploads
-- ============================================================================

-- Create the badges bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'badges',
  'badges',
  true, -- Public bucket for badge icons
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy: Allow authenticated users to upload
CREATE POLICY "badges_upload_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'badges' AND
  (storage.foldername(name))[1] = 'badge-icons'
);

-- Create storage policy: Allow authenticated users to update their uploads
CREATE POLICY "badges_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'badges' AND
  (storage.foldername(name))[1] = 'badge-icons'
)
WITH CHECK (
  bucket_id = 'badges' AND
  (storage.foldername(name))[1] = 'badge-icons'
);

-- Create storage policy: Allow authenticated users to delete their uploads
CREATE POLICY "badges_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'badges' AND
  (storage.foldername(name))[1] = 'badge-icons'
);

-- Create storage policy: Allow public read access
CREATE POLICY "badges_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'badges');
