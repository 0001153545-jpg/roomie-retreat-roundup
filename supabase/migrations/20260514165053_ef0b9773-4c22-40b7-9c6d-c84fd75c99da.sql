-- Admin permissions table for Super_Admin to control what other admins can do.
CREATE TABLE public.admin_permissions (
  user_id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  perms JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Super admin (the email in is_admin()) can do everything
CREATE POLICY "Super admin full access"
  ON public.admin_permissions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can view their own permissions row
CREATE POLICY "Admins can view own perms"
  ON public.admin_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_admin_permissions_updated_at
  BEFORE UPDATE ON public.admin_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: check if current user has access to a given module.
-- Super admin (is_admin) always returns true. Other users return true only if their perms[module] = true.
CREATE OR REPLACE FUNCTION public.has_admin_perm(_module TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN public.is_admin() THEN true
      ELSE COALESCE(
        (SELECT (perms ->> _module)::boolean
         FROM public.admin_permissions
         WHERE user_id = auth.uid()),
        false
      )
    END;
$$;

-- Helper: check if current user is any kind of admin (super or has at least one perm enabled)
CREATE OR REPLACE FUNCTION public.is_any_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.admin_permissions
      WHERE user_id = auth.uid()
        AND perms <> '{}'::jsonb
    );
$$;