import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">R</div>
              <span className="font-heading text-lg font-bold">ReservaFácil</span>
            </div>
            <p className="text-sm text-secondary-foreground/70">{t("footer.tagline")}</p>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider">{t("footer.explore")}</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/buscar" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">{t("footer.searchRooms")}</Link>
              <Link to="/explorar" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">{t("footer.destinations")}</Link>
              <Link to="/buscar?offer=true" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">{t("footer.specialOffers")}</Link>
            </nav>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider">{t("footer.owners")}</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/anunciar" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">{t("footer.advertiseRoom")}</Link>
              <Link to="/contato" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">{t("footer.contactUs")}</Link>
            </nav>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider">{t("footer.support")}</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/termos" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">{t("footer.terms")}</Link>
              <Link to="/privacidade" className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">{t("footer.privacy")}</Link>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-secondary-foreground/10 pt-6 text-center text-sm text-secondary-foreground/50">
          © {new Date().getFullYear()} ReservaFácil. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
