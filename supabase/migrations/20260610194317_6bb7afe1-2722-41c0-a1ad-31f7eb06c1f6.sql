
CREATE POLICY "Add-admins can view admin list"
ON public.admin_permissions
FOR SELECT
TO authenticated
USING (public.has_admin_perm('add_admins'));

CREATE POLICY "Add-admins can insert new admins"
ON public.admin_permissions
FOR INSERT
TO authenticated
WITH CHECK (public.has_admin_perm('add_admins'));
