-- Reescreve políticas do bucket property-images para garantir que upload de foto de perfil funcione
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update any property image" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any property image" ON storage.objects;
DROP POLICY IF EXISTS "Property images are publicly readable" ON storage.objects;

CREATE POLICY "Property images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated can upload to own folder (property-images)"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own property images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'property-images'
  AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_admin())
)
WITH CHECK (
  bucket_id = 'property-images'
  AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_admin())
);

CREATE POLICY "Users can delete own property images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images'
  AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_admin())
);
