import { Shield, CreditCard, Headphones, Star, Zap, Ban, BadgeCheck, ThumbsUp, Wallet, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BenefitsSection = () => {
  const { t } = useLanguage();

  const benefits = [
    { icon: Zap, title: "Reserva instantânea", description: "Confirme sua estadia em segundos, sem burocracia." },
    { icon: Ban, title: "Cancelamento flexível", description: "Planos com opção de cancelamento gratuito." },
    { icon: Shield, title: t("benefits.secure"), description: t("benefits.secureDesc") },
    { icon: Headphones, title: "Atendimento 24 horas", description: "Nossa equipe está sempre à disposição." },
    { icon: BadgeCheck, title: "Anúncios verificados", description: "Todos os imóveis passam por checagem manual." },
    { icon: Star, title: t("benefits.ratings"), description: t("benefits.ratingsDesc") },
    { icon: Wallet, title: t("benefits.price"), description: t("benefits.priceDesc") },
    { icon: ThumbsUp, title: "Reserva simples", description: "Processo direto e sem etapas desnecessárias." },
    { icon: CreditCard, title: "Pagamento seguro", description: "PIX, cartão e outros métodos criptografados." },
    { icon: Lock, title: "Segurança de dados", description: "Seus dados protegidos com criptografia de ponta." },
  ];

  return (
    <section className="container-page py-16">
      <div className="mb-10 text-center">
        <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Vantagens
        </span>
        <h2 className="mb-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
          {t("benefits.title")}
        </h2>
        <p className="text-muted-foreground">{t("benefits.subtitle")}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {benefits.map((benefit, i) => (
          <div
            key={benefit.title}
            style={{ animationDelay: `${i * 60}ms` }}
            className="group animate-fade-in rounded-2xl border border-border bg-card p-5 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
              <benefit.icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-1.5 font-heading text-sm font-semibold text-card-foreground sm:text-base">{benefit.title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsSection;
