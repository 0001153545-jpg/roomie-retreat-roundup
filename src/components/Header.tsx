import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Globe, User, LogOut, CalendarDays, Heart, Sun, Moon, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency, type Currency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import type { Language } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountType, setAccountType] = useState<string>("guest");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!user) { setAccountType("guest"); return; }
    supabase.from("profiles").select("account_type").eq("user_id", user.id).single()
      .then(({ data }) => { if (data) setAccountType(data.account_type); });
  }, [user]);

  const navLinks = [
    { label: t("nav.home"), path: "/" },
    { label: t("nav.search"), path: "/buscar" },
    { label: t("nav.explore"), path: "/explorar" },
    { label: t("nav.advertise"), path: "/anunciar" },
    { label: t("nav.about"), path: "/sobre" },
    { label: t("nav.contact"), path: "/contato" },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("common.byeToast"));
    navigate("/");
  };

  const langOptions: { code: Language; flag: string; label: string; curr: Currency }[] = [
    { code: "pt", flag: "🇧🇷", label: "Português", curr: "BRL" },
    { code: "en", flag: "🇺🇸", label: "English", curr: "USD" },
    { code: "es", flag: "🇪🇸", label: "Español", curr: "EUR" },
  ];

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
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden sm:flex">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* Language + currency */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex"><Globe className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {langOptions.map((opt) => (
                <DropdownMenuItem key={opt.code} onClick={() => { setLanguage(opt.code); setCurrency(opt.curr); }}
                  className={language === opt.code ? "bg-muted font-semibold" : ""}>
                  {opt.flag} {opt.label} ({opt.curr})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex">
                  <User className="h-4 w-4" />
                  {user.user_metadata?.full_name?.split(" ")[0] || t("nav.account")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/favoritos")}>
                  <Heart className="mr-2 h-4 w-4" /> {t("nav.favorites")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/minhas-reservas")}>
                  <CalendarDays className="mr-2 h-4 w-4" /> {t("nav.myReservations")}
                </DropdownMenuItem>
                {accountType === "owner" && (
                  <DropdownMenuItem onClick={() => navigate("/meus-quartos")}>
                    <Building2 className="mr-2 h-4 w-4" /> {t("nav.myRooms")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login"><Button variant="outline" size="sm" className="hidden sm:inline-flex">{t("nav.login")}</Button></Link>
              <Link to="/cadastro"><Button size="sm" className="hidden sm:inline-flex">{t("nav.register")}</Button></Link>
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
              <>
                <Link to="/favoritos" onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
                  {t("nav.favorites")}
                </Link>
                <Link to="/minhas-reservas" onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
                  {t("nav.myReservations")}
                </Link>
                {accountType === "owner" && (
                  <Link to="/meus-quartos" onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
                    {t("nav.myRooms")}
                  </Link>
                )}
              </>
            )}
            {/* Theme + language mobile */}
            <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
              <button onClick={toggleTheme} className="rounded-md p-1.5 bg-muted text-muted-foreground">
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              {langOptions.map((opt) => (
                <button key={opt.code} onClick={() => { setLanguage(opt.code); setCurrency(opt.curr); }}
                  className={`rounded-md px-3 py-1.5 text-sm ${language === opt.code ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {opt.flag}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              {user ? (
                <Button variant="outline" className="w-full" onClick={() => { handleSignOut(); setMobileOpen(false); }}>{t("nav.logout")}</Button>
              ) : (
                <>
                  <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">{t("nav.login")}</Button>
                  </Link>
                  <Link to="/cadastro" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full">{t("nav.register")}</Button>
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
