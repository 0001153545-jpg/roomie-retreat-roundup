-- 1. Fix cascade_delete_user_data: add admin authorization check
CREATE OR REPLACE FUNCTION public.cascade_delete_user_data(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  DELETE FROM public.favorites WHERE user_id = target_user_id;
  DELETE FROM public.reviews WHERE user_id = target_user_id;
  DELETE FROM public.reservations WHERE user_id = target_user_id;
  DELETE FROM public.listings WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
END;
$$;

-- 2. Fix permissive DELETE policy on profiles
DROP POLICY IF EXISTS "Users can delete profiles" ON public.profiles;

CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin can delete any profile"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin());

-- 3. Fix profiles SELECT: stop exposing PII (email, cpf, phone) to public
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users can see their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin can see any profile
CREATE POLICY "Admin can view any profile"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

-- Public can view limited host info (full_name, avatar_url) via a view
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id, user_id, full_name, avatar_url, account_type, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow authenticated users to view non-sensitive fields of other profiles
-- (needed for showing host names/avatars on listings, review author avatars, etc.)
CREATE POLICY "Authenticated can view basic profile info"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Note: The above still exposes columns. Better: revoke and use the view.
-- We'll drop that and force consumers through the view for cross-user reads.
DROP POLICY IF EXISTS "Authenticated can view basic profile info" ON public.profiles;

-- 4. Fix public storage bucket listing: restrict listing of property-images
-- Keep individual file reads public but prevent listing all files
DROP POLICY IF EXISTS "Public can list property images" ON storage.objects;

-- We don't create a list policy, so listing is denied by default.
-- Public read of individual files (by known path) remains via existing policies.
