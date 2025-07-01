-- Function to check if a user has access to a specific storage path
CREATE OR REPLACE FUNCTION user_has_access_to_path(path TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (storage.foldername(path))[1] = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old, problematic policies
DROP POLICY IF EXISTS "Allow authenticated users to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Create new policies using the custom function
CREATE POLICY "Allow authenticated users to upload to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'credit-reports' AND
  user_has_access_to_path(name)
);

CREATE POLICY "Allow users to read their own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'credit-reports' AND
  user_has_access_to_path(name)
);

CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'credit-reports' AND
  user_has_access_to_path(name)
);

CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'credit-reports' AND
  user_has_access_to_path(name)
);
