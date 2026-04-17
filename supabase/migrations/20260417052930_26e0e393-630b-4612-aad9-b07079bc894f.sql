
UPDATE storage.buckets SET public = false WHERE id = 'avatars';
DROP POLICY IF EXISTS "Public can view avatars by direct path" ON storage.objects;
