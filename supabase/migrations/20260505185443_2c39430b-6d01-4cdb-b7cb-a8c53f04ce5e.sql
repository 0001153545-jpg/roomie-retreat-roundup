
-- =========================================================
-- CHAT SYSTEM: conversations + messages
-- =========================================================

CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL,
  host_id UUID NOT NULL,
  last_message_at TIMESTAMPTZ,
  last_check_out DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pair_unique UNIQUE (guest_id, host_id),
  CONSTRAINT conversations_distinct CHECK (guest_id <> host_id)
);

CREATE INDEX idx_conversations_guest ON public.conversations(guest_id);
CREATE INDEX idx_conversations_host ON public.conversations(host_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = guest_id OR auth.uid() = host_id OR public.is_admin());

CREATE POLICY "Admin can delete conversations"
  ON public.conversations FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT,
  image_url TEXT,
  source_lang TEXT NOT NULL DEFAULT 'pt',
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_by_guest BOOLEAN NOT NULL DEFAULT false,
  read_by_host BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT messages_has_content CHECK (
    (body IS NOT NULL AND length(trim(body)) > 0) OR image_url IS NOT NULL
  )
);

CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.guest_id = auth.uid() OR c.host_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.guest_id = auth.uid() OR c.host_id = auth.uid())
        AND (c.last_check_out IS NULL OR c.last_check_out + INTERVAL '2 days' >= CURRENT_DATE)
    )
  );

CREATE POLICY "Participants can mark messages as read"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.guest_id = auth.uid() OR c.host_id = auth.uid())
    )
  );

CREATE POLICY "Admin can delete messages"
  ON public.messages FOR DELETE
  USING (public.is_admin());

-- Trigger: bump conversation last_message_at when a new message is inserted
CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_on_message();

-- Function: get-or-create conversation between current user (guest) and a host,
-- only if at least one confirmed reservation exists for a listing of that host.
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(target_host_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest UUID := auth.uid();
  v_conv UUID;
  v_last_checkout DATE;
BEGIN
  IF v_guest IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_guest = target_host_id THEN
    RAISE EXCEPTION 'Cannot start conversation with yourself';
  END IF;

  -- Validate: there must be at least one non-cancelled reservation by this guest
  -- on a listing owned by target_host_id
  SELECT MAX(r.check_out) INTO v_last_checkout
  FROM public.reservations r
  JOIN public.listings l ON l.id::text = r.room_id
  WHERE r.user_id = v_guest
    AND l.user_id = target_host_id
    AND r.status <> 'cancelled';

  IF v_last_checkout IS NULL THEN
    RAISE EXCEPTION 'reservation_required';
  END IF;

  -- Find or create conversation
  SELECT id INTO v_conv
  FROM public.conversations
  WHERE guest_id = v_guest AND host_id = target_host_id;

  IF v_conv IS NULL THEN
    INSERT INTO public.conversations (guest_id, host_id, last_check_out)
    VALUES (v_guest, target_host_id, v_last_checkout)
    RETURNING id INTO v_conv;
  ELSE
    UPDATE public.conversations
    SET last_check_out = v_last_checkout
    WHERE id = v_conv;
  END IF;

  RETURN v_conv;
END;
$$;

-- Function: refresh last_check_out for an existing conversation (used when listing reservations again)
CREATE OR REPLACE FUNCTION public.refresh_conversation_checkout(conv_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest UUID; v_host UUID; v_last DATE;
BEGIN
  SELECT guest_id, host_id INTO v_guest, v_host FROM public.conversations WHERE id = conv_id;
  IF v_guest IS NULL THEN RETURN; END IF;
  IF auth.uid() <> v_guest AND auth.uid() <> v_host THEN RETURN; END IF;

  SELECT MAX(r.check_out) INTO v_last
  FROM public.reservations r
  JOIN public.listings l ON l.id::text = r.room_id
  WHERE r.user_id = v_guest AND l.user_id = v_host AND r.status <> 'cancelled';

  UPDATE public.conversations SET last_check_out = v_last WHERE id = conv_id;
END;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- =========================================================
-- STORAGE: chat-images bucket
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Chat images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own chat images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================================
-- LISTINGS: cached translations for description and amenities
-- =========================================================
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_es TEXT,
  ADD COLUMN IF NOT EXISTS amenities_translations JSONB DEFAULT '{}'::jsonb;
