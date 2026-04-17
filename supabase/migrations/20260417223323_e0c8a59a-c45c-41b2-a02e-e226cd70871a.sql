-- Remove broad SELECT policy that enables listing all objects in property-images
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;

-- Note: bucket remains public, so direct URLs (https://.../object/public/property-images/<path>)
-- continue to work for displaying images. Listing the bucket contents now requires server-side access.
