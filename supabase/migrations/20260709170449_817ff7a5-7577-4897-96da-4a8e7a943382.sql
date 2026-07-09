
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS cleanliness NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS service NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS location NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS comfort NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS value NUMERIC(2,1);

CREATE OR REPLACE FUNCTION public.reviews_compute_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE vals NUMERIC[]; s NUMERIC := 0; c INT := 0; v NUMERIC;
BEGIN
  vals := ARRAY[NEW.cleanliness, NEW.service, NEW.location, NEW.comfort, NEW.value];
  FOREACH v IN ARRAY vals LOOP
    IF v IS NOT NULL THEN s := s + v; c := c + 1; END IF;
  END LOOP;
  IF c > 0 THEN NEW.rating := ROUND((s / c)::NUMERIC, 1); END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_reviews_compute_rating ON public.reviews;
CREATE TRIGGER trg_reviews_compute_rating
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.reviews_compute_rating();

CREATE OR REPLACE FUNCTION public.is_super_host(_host_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH host_listings AS (
    SELECT id::text AS lid FROM public.listings WHERE user_id = _host_id
  ),
  r AS (
    SELECT COUNT(*) AS n, COALESCE(AVG(rating), 0) AS avg_rating
    FROM public.reviews WHERE room_id IN (SELECT lid FROM host_listings)
  ),
  b AS (
    SELECT COUNT(*) AS n FROM public.reservations
    WHERE room_id IN (SELECT lid FROM host_listings)
      AND status <> 'cancelled' AND check_out < CURRENT_DATE
  )
  SELECT (r.n >= 5 AND r.avg_rating >= 4.8 AND b.n >= 10) FROM r, b;
$$;

CREATE OR REPLACE FUNCTION public.get_host_stats(_host_id UUID)
RETURNS TABLE(
  listings_count INT,
  reviews_count INT,
  avg_rating NUMERIC,
  avg_response_minutes INT,
  super_host BOOLEAN
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH host_listings AS (
    SELECT id::text AS lid FROM public.listings WHERE user_id = _host_id
  ),
  reply_times AS (
    SELECT EXTRACT(EPOCH FROM (m2.created_at - m1.created_at))/60 AS mins
    FROM public.conversations c
    JOIN public.messages m1 ON m1.conversation_id = c.id AND m1.sender_id <> _host_id
    JOIN LATERAL (
      SELECT created_at FROM public.messages
      WHERE conversation_id = c.id AND sender_id = _host_id AND created_at > m1.created_at
      ORDER BY created_at ASC LIMIT 1
    ) m2 ON true
    WHERE c.host_id = _host_id
  )
  SELECT
    (SELECT COUNT(*)::INT FROM host_listings),
    (SELECT COUNT(*)::INT FROM public.reviews WHERE room_id IN (SELECT lid FROM host_listings)),
    COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM public.reviews WHERE room_id IN (SELECT lid FROM host_listings)), 0),
    COALESCE((SELECT ROUND(AVG(mins))::INT FROM reply_times), 0),
    public.is_super_host(_host_id);
$$;
