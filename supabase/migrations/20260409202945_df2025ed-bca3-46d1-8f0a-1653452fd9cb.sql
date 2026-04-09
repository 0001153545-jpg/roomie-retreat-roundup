-- Allow authenticated users to delete profiles (admin will use this)
CREATE POLICY "Users can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (true);
