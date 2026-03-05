import { Shield, Globe, Heart, Award } from "lucide-react";

const About = () => {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-3 font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Sobre a ReservaFácil
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
          Somos a plataforma que conecta viajantes a hospedagens incríveis em todo o Brasil.
          Nossa missão é tornar cada viagem memorável, com segurança, conforto e os melhores preços.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Globe, title: "Cobertura Nacional", desc: "Presentes em mais de 500 cidades brasileiras." },
          { icon: Shield, title: "100% Seguro", desc: "Pagamentos protegidos e dados criptografados." },
          { icon: Heart, title: "+50 mil Avaliações", desc: "Comunidade ativa com feedback real." },
          { icon: Award, title: "Qualidade Verificada", desc: "Todos os anúncios são verificados pela equipe." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-card p-6 text-center shadow-card">
            <item.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-1 font-heading text-base font-semibold text-foreground">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;
