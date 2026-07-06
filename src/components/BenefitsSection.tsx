import { Shield, CreditCard, Headphones, Star, Zap, Calendar, BadgeCheck, Award, Sparkles, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BenefitsSection = () => {
  const { t } = useLanguage();

  const benefits = [
    { icon: Zap, title: "Reserva instantânea", description: "Confirme sua estadia em segundos, sem espera." },
    { icon: Calendar, title: "Cancelamento flexível", description: "Planos com política de cancelamento adaptável." },
    { icon: CreditCard, title: "Pagamento seguro", description: "Transações criptografadas e escrow protegido." },
    { icon: Headphones, title: "Atendimento 24 horas", description: "Suporte dedicado a qualquer hora do dia." },
    { icon: BadgeCheck, title: "Anúncios verificados", description: "Cada hospedagem é revisada pela nossa equipe." },
    { icon: Star, title: "Melhores avaliações", description: "Feedback real de hóspedes verificados." },
    { icon: Award, title: "Melhor preço garantido", description: "Encontrou mais barato? A gente cobre." },
    { icon: Sparkles, title: "Suporte rápido", description: "Respostas em minutos por chat, e-mail e telefone." },
    { icon: Shield, title: "Processo simples", description: "Reserva descomplicada em poucos cliques." },
    { icon: Lock, title: "Segurança de dados", description: "Seus dados protegidos com padrão bancário." },
  ];

  return (
    <section className="container-page py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center animate-fade-in">
        <h2 className="mb-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">{t("benefits.title")}</h2>
        <p className="mb-12 text-muted-foreground">{t("benefits.subtitle")}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {benefits.map((benefit, i) => (
          <div
            key={benefit.title}
            style={{ animationDelay: `${i * 60}ms` }}
            className="group rounded-2xl border border-border/60 bg-card p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:border-primary/30 animate-fade-in"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/15">
              <benefit.icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 font-heading text-base font-semibold text-card-foreground">{benefit.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsSection;
