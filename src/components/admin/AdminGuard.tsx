import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "0001152760@senaimgaluno.com.br";

export const isAdminEmail = (email: string | undefined) =>
  email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

const AdminGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdminEmail(user.email)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-8">
        <div className="bg-destructive/10 text-destructive rounded-xl p-8 max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p>Você não tem permissão para acessar esta área.</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
