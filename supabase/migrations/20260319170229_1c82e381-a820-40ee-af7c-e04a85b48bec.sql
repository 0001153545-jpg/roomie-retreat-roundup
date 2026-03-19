
-- Allow listing owners to view reservations for their rooms
CREATE POLICY "Owners can view reservations for their listings"
ON public.reservations FOR SELECT
TO authenticated
USING (
  room_id IN (
    SELECT id::text FROM public.listings WHERE user_id = auth.uid()
  )
);
