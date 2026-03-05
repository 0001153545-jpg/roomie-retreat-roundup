import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Globe, User, LogOut, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Buscar Quartos", path: "/buscar" },
  { label: "Explorar", path: "/explorar" },
  { label: "Anunciar Quarto", path: "/anunciar" },
  { label: "Sobre", path: "/sobre" },
  { label: "Contato", path: "/contato" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Até logo!");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-heading text-lg font-bold text-primary-foreground">R</div>
          <span className="font-heading text-xl font-bold text-foreground">ReservaFácil</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${location.pathname === link.path ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex"><Globe className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>🇧🇷 Português</DropdownMenuItem>
              <DropdownMenuItem>🇺🇸 English</DropdownMenuItem>
              <DropdownMenuItem>🇪🇸 Español</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex">
                  <User className="h-4 w-4" />
                  {user.user_metadata?.full_name?.split(" ")[0] || "Conta"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/minhas-reservas")}>
                  <CalendarDays className="mr-2 h-4 w-4" /> Minhas Reservas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login"><Button variant="outline" size="sm" className="hidden sm:inline-flex">Entrar</Button></Link>
              <Link to="/cadastro"><Button size="sm" className="hidden sm:inline-flex">Cadastrar</Button></Link>
            </>
          )}

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${location.pathname === link.path ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
                {link.label}
              </Link>
            ))}
            {user && (
              <Link to="/minhas-reservas" onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
                Minhas Reservas
              </Link>
            )}
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              {user ? (
                <Button variant="outline" className="w-full" onClick={() => { handleSignOut(); setMobileOpen(false); }}>Sair</Button>
              ) : (
                <>
                  <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">Entrar</Button>
                  </Link>
                  <Link to="/cadastro" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full">Cadastrar</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
