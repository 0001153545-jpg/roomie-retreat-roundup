
-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "system_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: new reservation → notify host
CREATE OR REPLACE FUNCTION public.notify_on_reservation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_host UUID;
  v_title TEXT;
BEGIN
  SELECT user_id, title INTO v_host, v_title FROM public.listings WHERE id::text = NEW.room_id;
  IF v_host IS NOT NULL AND v_host <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (v_host, 'reservation_confirmed',
      'Nova reserva confirmada',
      'Você recebeu uma reserva em "' || COALESCE(v_title, 'seu imóvel') || '"',
      '/meus-quartos');
  END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.user_id, 'reservation_confirmed',
    'Reserva confirmada',
    'Sua reserva foi confirmada com sucesso.',
    '/minhas-reservas');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_reservation
AFTER INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.notify_on_reservation();

-- Trigger: reservation cancelled → notify both
CREATE OR REPLACE FUNCTION public.notify_on_reservation_cancel()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_host UUID;
  v_title TEXT;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    SELECT user_id, title INTO v_host, v_title FROM public.listings WHERE id::text = NEW.room_id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'reservation_cancelled', 'Reserva cancelada',
      'Sua reserva em "' || COALESCE(v_title, 'imóvel') || '" foi cancelada.',
      '/minhas-reservas');
    IF v_host IS NOT NULL AND v_host <> NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (v_host, 'reservation_cancelled', 'Reserva cancelada por hóspede',
        'Uma reserva em "' || COALESCE(v_title, 'seu imóvel') || '" foi cancelada.',
        '/meus-quartos');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_reservation_cancel
AFTER UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.notify_on_reservation_cancel();

-- Trigger: new message → notify recipient
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_guest UUID; v_host UUID; v_recipient UUID;
  v_sender_name TEXT;
BEGIN
  SELECT guest_id, host_id INTO v_guest, v_host FROM public.conversations WHERE id = NEW.conversation_id;
  v_recipient := CASE WHEN NEW.sender_id = v_guest THEN v_host ELSE v_guest END;
  IF v_recipient IS NULL THEN RETURN NEW; END IF;
  SELECT full_name INTO v_sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (v_recipient, 'message_received',
    'Nova mensagem',
    COALESCE(v_sender_name, 'Alguém') || ': ' || COALESCE(LEFT(NEW.body, 80), '📷 imagem'),
    '/chat?id=' || NEW.conversation_id::text);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- Trigger: new listing → notify all users with a favorite/host account (only admins for now)
CREATE OR REPLACE FUNCTION public.notify_on_new_listing()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Notify all admins
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT ap.user_id, 'new_listing', 'Novo anúncio publicado',
    NEW.title || ' — ' || NEW.city || ', ' || NEW.state,
    '/quarto/' || NEW.id::text
  FROM public.admin_permissions ap;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_listing
AFTER INSERT ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_listing();
