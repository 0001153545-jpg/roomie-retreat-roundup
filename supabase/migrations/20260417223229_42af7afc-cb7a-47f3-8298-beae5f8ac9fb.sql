-- Recreate public_profiles as a SECURITY DEFINER view via function-backed approach.
-- Use a definer function that returns only safe public fields.

DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  account_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, full_name, avatar_url, account_type
  FROM public.profiles
  WHERE user_id = target_user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;

-- Also create a bulk function for fetching multiple public profiles at once (e.g. reviews list)
CREATE OR REPLACE FUNCTION public.get_public_profiles(target_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  account_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, full_name, avatar_url, account_type
  FROM public.profiles
  WHERE user_id = ANY(target_user_ids)
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO anon, authenticated;
