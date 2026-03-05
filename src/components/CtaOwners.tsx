import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";

const CtaOwners = () => {
  return (
    <section className="bg-secondary py-16">
      <div className="container-page text-center">
        <Building2 className="mx-auto mb-4 h-10 w-10 text-accent" />
        <h2 className="font-heading text-2xl font-bold text-secondary-foreground sm:text-3xl">
          É proprietário? Anuncie com a gente!
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-secondary-foreground/70">
          Cadastre seu hotel, pousada ou quarto e alcance milhares de viajantes.
          Comece a receber reservas em poucos minutos.
        </p>
        <Link to="/anunciar">
          <Button size="lg" className="mt-6 gap-2 shadow-hero">
            Anunciar meu quarto <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CtaOwners;
