import { Building2, Camera, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const steps = [
  { icon: Building2, title: "Cadastre seu imóvel", desc: "Preencha os dados do seu hotel, pousada ou quarto." },
  { icon: Camera, title: "Adicione fotos", desc: "Fotos de qualidade atraem mais hóspedes." },
  { icon: DollarSign, title: "Defina seu preço", desc: "Configure preços, disponibilidade e políticas." },
  { icon: BarChart3, title: "Receba reservas", desc: "Comece a receber hóspedes e faturar." },
];

const Advertise = () => {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-3 font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Anuncie seu quarto
        </h1>
        <p className="mb-10 text-lg text-muted-foreground">
          Cadastre sua propriedade e alcance milhares de viajantes em todo o Brasil
        </p>
      </div>

      <div className="mx-auto mb-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {steps.map((step, i) => (
          <div key={step.title} className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <step.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Passo {i + 1}</p>
              <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link to="/cadastro">
          <Button size="lg" className="shadow-hero">Começar agora</Button>
        </Link>
      </div>
    </div>
  );
};

export default Advertise;
