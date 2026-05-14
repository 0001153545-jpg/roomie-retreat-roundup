import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminPermissions, AdminModule } from "@/hooks/useAdminPermissions";

const ADMIN_EMAIL = "0001152760@senaimgaluno.com.br";

export const isAdminEmail = (email: string | undefined) =>
  email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

interface AdminGuardProps {
  children: ReactNode;
  /** Optional: require this specific module permission to access. Super admin always passes. */
  requireModule?: AdminModule;
}

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

const Denied = ({ message }: { message: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-8">
    <div className="bg-destructive/10 text-destructive rounded-xl p-8 max-w-md text-center space-y-4">
      <h1 className="text-2xl font-bold">Acesso Negado</h1>
      <p>{message}</p>
      <Navigate to="/" replace />
    </div>
  </div>
);

const AdminGuard = ({ children, requireModule }: AdminGuardProps) => {
  const { user, loading } = useAuth();
  const { loading: permLoading, isSuper, isAnyAdmin, perms } = useAdminPermissions();

  if (loading || permLoading) return <Spinner />;

  if (!user) return <Denied message="Você precisa estar autenticado." />;

  if (!isSuper && !isAnyAdmin) {
    return <Denied message="Você não tem permissão para acessar esta área." />;
  }

  if (requireModule && !isSuper && !perms[requireModule]) {
    return <Denied message="Você não tem permissão para acessar este módulo." />;
  }

  return <>{children}</>;
};

export default AdminGuard;
