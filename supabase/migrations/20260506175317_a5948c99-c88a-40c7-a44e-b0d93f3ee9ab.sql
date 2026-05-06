
DROP POLICY IF EXISTS "Users can update own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;

CREATE POLICY "Users can update own property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images'
  AND (owner = auth.uid() OR (auth.uid())::text = (storage.foldername(name))[1])
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (owner = auth.uid() OR (auth.uid())::text = (storage.foldername(name))[1])
);

CREATE POLICY "Users can delete own property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images'
  AND (owner = auth.uid() OR (auth.uid())::text = (storage.foldername(name))[1])
);
