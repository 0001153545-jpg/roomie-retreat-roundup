import { Shield, CreditCard, Headphones, Star } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Reserva Segura",
    description: "Seus dados protegidos com criptografia de ponta e pagamento seguro.",
  },
  {
    icon: Star,
    title: "Melhores Avaliações",
    description: "Hospedagens verificadas e avaliadas por hóspedes reais.",
  },
  {
    icon: CreditCard,
    title: "Melhor Preço",
    description: "Garantia do menor preço e ofertas exclusivas para você.",
  },
  {
    icon: Headphones,
    title: "Suporte 24h",
    description: "Equipe dedicada pronta para ajudar a qualquer momento.",
  },
];

const BenefitsSection = () => {
  return (
    <section className="container-page py-16">
      <h2 className="mb-2 text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
        Por que escolher a ReservaFácil?
      </h2>
      <p className="mb-10 text-center text-muted-foreground">
        Vantagens que fazem a diferença na sua viagem
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-xl border border-border bg-card p-6 text-center shadow-card transition-shadow hover:shadow-elevated"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <benefit.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-heading text-base font-semibold text-card-foreground">
              {benefit.title}
            </h3>
            <p className="text-sm text-muted-foreground">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsSection;
