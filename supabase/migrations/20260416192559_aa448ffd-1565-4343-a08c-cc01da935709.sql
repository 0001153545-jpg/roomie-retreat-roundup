ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, account_type, email, cpf, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'guest'),
    NEW.email,
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$function$;