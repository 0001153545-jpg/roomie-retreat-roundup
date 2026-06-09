
-- 1) Realtime authorization: only authenticated users can subscribe.
-- Underlying postgres_changes still enforces table RLS on conversations/messages.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive realtime" ON realtime.messages;
CREATE POLICY "Authenticated can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

-- 2) Explicit INSERT policy on conversations (creation also happens via SECURITY DEFINER RPC)
DROP POLICY IF EXISTS "Guests can create conversations" ON public.conversations;
CREATE POLICY "Guests can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = guest_id);

-- 3) Remove broad listing on public storage buckets.
-- Public CDN access via /object/public/<bucket>/<file> still works without these policies.
DROP POLICY IF EXISTS "Chat images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Property images are publicly readable" ON storage.objects;

-- 4) Lock down SECURITY DEFINER function execution.
-- Trigger functions: no role should call them directly.
REVOKE EXECUTE ON FUNCTION public.touch_conversation_on_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_reservation_overlap() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Admin-only / privileged helpers: revoke from anon.
REVOKE EXECUTE ON FUNCTION public.cascade_delete_user_data(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_conversation_checkout(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_any_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_perm(text) FROM anon;

-- App RPCs used by authenticated users: revoke anon access.
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) FROM anon;
