import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Building2, DollarSign, LogOut, Home, ShieldAlert, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useAdminPermissions, AdminModule } from "@/hooks/useAdminPermissions";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  module?: AdminModule;
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Usuários", url: "/admin/usuarios", icon: Users, module: "users" },
  { title: "Quartos", url: "/admin/quartos", icon: Building2, module: "rooms" },
  { title: "Financeiro", url: "/admin/financeiro", icon: DollarSign, module: "financial" },
  { title: "Resiliência", url: "/admin/resiliencia", icon: ShieldAlert, module: "resilience" },
  { title: "Permissões", url: "/admin/permissoes", icon: ShieldCheck, module: "add_admins" },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { isSuper, perms } = useAdminPermissions();

  const visibleItems = menuItems.filter((item) => !item.module || isSuper || perms[item.module]);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            {!collapsed && "Reserva Fácil Admin"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/admin"
                        ? location.pathname === "/admin"
                        : location.pathname.startsWith(item.url)
                    }
                  >
                    <NavLink to={item.url} end={item.url === "/admin"}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <Home className="h-4 w-4" />
          {!collapsed && "Voltar ao site"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sair da conta"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

const AdminLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background px-4 gap-4">
            <SidebarTrigger />
            <span className="font-semibold text-lg text-foreground">Painel Administrativo</span>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
