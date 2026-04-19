
-- 1. Anexar trigger BEFORE INSERT/UPDATE para impedir reservas sobrepostas (a função já existe)
DROP TRIGGER IF EXISTS prevent_reservation_overlap ON public.reservations;
CREATE TRIGGER prevent_reservation_overlap
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.check_reservation_overlap();

-- 2. Reatribuir quartos seed (IDs 11111111-1111-1111-1111-1111111110XX) ao usuário admin
UPDATE public.listings
SET user_id = '22a5853c-ddf0-44e5-ba26-e5c54ebe016f'
WHERE id::text LIKE '11111111-1111-1111-1111-11111111100%';
