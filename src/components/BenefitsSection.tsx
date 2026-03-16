import { Shield, CreditCard, Headphones, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BenefitsSection = () => {
  const { t } = useLanguage();

  const benefits = [
    { icon: Shield, title: t("benefits.secure"), description: t("benefits.secureDesc") },
    { icon: Star, title: t("benefits.ratings"), description: t("benefits.ratingsDesc") },
    { icon: CreditCard, title: t("benefits.price"), description: t("benefits.priceDesc") },
    { icon: Headphones, title: t("benefits.support"), description: t("benefits.supportDesc") },
  ];

  return (
    <section className="container-page py-16">
      <h2 className="mb-2 text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">{t("benefits.title")}</h2>
      <p className="mb-10 text-center text-muted-foreground">{t("benefits.subtitle")}</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit) => (
          <div key={benefit.title} className="rounded-xl border border-border bg-card p-6 text-center shadow-card transition-shadow hover:shadow-elevated">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <benefit.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-heading text-base font-semibold text-card-foreground">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsSection;
