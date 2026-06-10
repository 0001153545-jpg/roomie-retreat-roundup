import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/components/admin/AdminGuard";

export type AdminModule = "users" | "rooms" | "financial" | "resilience" | "permissions" | "add_admins";

export const ADMIN_MODULES: { key: AdminModule; label: string }[] = [
  { key: "users", label: "Gerenciar Usuários" },
  { key: "rooms", label: "Gerenciar Quartos" },
  { key: "financial", label: "Ver Relatórios Financeiros" },
  { key: "resilience", label: "Módulo de Resiliência" },
  { key: "add_admins", label: "Adicionar Novos Administradores" },
  { key: "permissions", label: "Gerenciar Permissões (Super_Admin)" },
];

export interface AdminPermissionsState {
  loading: boolean;
  isSuper: boolean;
  isAnyAdmin: boolean;
  perms: Partial<Record<AdminModule, boolean>>;
}

export function useAdminPermissions(): AdminPermissionsState {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AdminPermissionsState>({
    loading: true,
    isSuper: false,
    isAnyAdmin: false,
    perms: {},
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState({ loading: false, isSuper: false, isAnyAdmin: false, perms: {} });
      return;
    }
    const isSuper = isAdminEmail(user.email);
    if (isSuper) {
      // Super admin has all permissions implicitly.
      const perms: Partial<Record<AdminModule, boolean>> = {};
      ADMIN_MODULES.forEach((m) => { perms[m.key] = true; });
      setState({ loading: false, isSuper: true, isAnyAdmin: true, perms });
      return;
    }
    // Non-super: read own perms row
    supabase
      .from("admin_permissions" as any)
      .select("perms")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const perms = ((data as any)?.perms || {}) as Partial<Record<AdminModule, boolean>>;
        const isAnyAdmin = Object.values(perms).some(Boolean);
        setState({ loading: false, isSuper: false, isAnyAdmin, perms });
      });
  }, [user, authLoading]);

  return state;
}
