
-- Allow users to delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()) = '0001152760@senaimgaluno.com.br',
    false
  )
$$;

-- Allow admin to delete any review
CREATE POLICY "Admin can delete any review"
ON public.reviews
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Allow admin to insert reviews without restriction (for commenting without reservation)
CREATE POLICY "Admin can insert reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Create cascade delete function for admin user deletion
CREATE OR REPLACE FUNCTION public.cascade_delete_user_data(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.favorites WHERE user_id = target_user_id;
  DELETE FROM public.reviews WHERE user_id = target_user_id;
  DELETE FROM public.reservations WHERE user_id = target_user_id;
  DELETE FROM public.listings WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
END;
$$;

-- Allow delete on reservations for admin
CREATE POLICY "Admin can delete any reservation"
ON public.reservations
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Allow admin to delete any listing
CREATE POLICY "Admin can delete any listing"
ON public.listings
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Allow admin to delete any favorite
CREATE POLICY "Admin can delete any favorite"
ON public.favorites
FOR DELETE
TO authenticated
USING (public.is_admin());
