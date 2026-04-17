-- 1. Restrict resilience_backups SELECT to admins only
DROP POLICY IF EXISTS "Authenticated users can view backups" ON public.resilience_backups;

CREATE POLICY "Admins can view backups"
ON public.resilience_backups FOR SELECT
TO authenticated
USING (public.is_admin());

-- Also restrict INSERT to admins (was: any authenticated)
DROP POLICY IF EXISTS "Authenticated users can create backups" ON public.resilience_backups;

CREATE POLICY "Admins can create backups"
ON public.resilience_backups FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() AND auth.uid() = created_by);

-- And DELETE to admins only (was: creator)
DROP POLICY IF EXISTS "Creator can delete own backups" ON public.resilience_backups;

CREATE POLICY "Admins can delete backups"
ON public.resilience_backups FOR DELETE
TO authenticated
USING (public.is_admin());

-- 2. Add UPDATE and DELETE policies on storage.objects for property-images bucket
-- Owners (uploaders) can manage their own files; admins can manage any
CREATE POLICY "Users can update own property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'property-images' AND owner = auth.uid());

CREATE POLICY "Users can delete own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images' AND owner = auth.uid());

CREATE POLICY "Admins can update any property image"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-images' AND public.is_admin())
WITH CHECK (bucket_id = 'property-images' AND public.is_admin());

CREATE POLICY "Admins can delete any property image"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images' AND public.is_admin());
