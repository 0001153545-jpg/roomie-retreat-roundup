import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CtaOwners = () => {
  const { t } = useLanguage();

  return (
    <section className="bg-secondary py-16">
      <div className="container-page text-center">
        <Building2 className="mx-auto mb-4 h-10 w-10 text-accent" />
        <h2 className="font-heading text-2xl font-bold text-secondary-foreground sm:text-3xl">{t("cta.title")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-secondary-foreground/70">{t("cta.subtitle")}</p>
        <Link to="/anunciar">
          <Button size="lg" className="mt-6 gap-2 shadow-hero">{t("cta.button")} <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
    </section>
  );
};

export default CtaOwners;
