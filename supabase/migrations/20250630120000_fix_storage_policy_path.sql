-- Drop the old, incorrect RLS policies for the credit-reports bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Create new, simplified RLS policies for the credit-reports bucket
CREATE POLICY "Allow authenticated users to upload to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'credit-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to read their own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'credit-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'credit-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'credit-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
