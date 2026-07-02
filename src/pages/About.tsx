import { Shield, Globe, Heart, Award, Target, Eye, Sparkles, Users, Handshake, Leaf } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t } = useLanguage();

  const highlights = [
    { icon: Globe, title: t("about.coverage"), desc: t("about.coverageDesc") },
    { icon: Shield, title: t("about.secure"), desc: t("about.secureDesc") },
    { icon: Heart, title: t("about.reviews"), desc: t("about.reviewsDesc") },
    { icon: Award, title: t("about.quality"), desc: t("about.qualityDesc") },
  ];

  const values = [
    { icon: Handshake, title: "Confiança", desc: "Relação transparente entre hóspedes e anfitriões." },
    { icon: Sparkles, title: "Excelência", desc: "Qualidade em cada detalhe da experiência." },
    { icon: Users, title: "Comunidade", desc: "Conectamos pessoas ao redor de todo o Brasil." },
    { icon: Leaf, title: "Sustentabilidade", desc: "Turismo responsável e consciente." },
  ];

  return (
    <div className="container-page py-10 animate-fade-in">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Sobre nós
        </span>
        <h1 className="mb-4 font-heading text-3xl font-bold text-foreground sm:text-4xl">{t("about.title")}</h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t("about.description")}
        </p>
      </div>

      {/* Highlights */}
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((item, i) => (
          <div
            key={item.title}
            style={{ animationDelay: `${i * 80}ms` }}
            className="group animate-fade-in rounded-2xl border border-border bg-card p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
              <item.icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-1.5 font-heading text-base font-semibold text-foreground">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Mission & Vision */}
      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {[
          {
            icon: Target,
            title: "Nossa Missão",
            desc: "Conectar viajantes a hospedagens únicas em todo o Brasil, oferecendo uma experiência de reserva simples, segura e transparente para hóspedes e anfitriões.",
          },
          {
            icon: Eye,
            title: "Nossa Visão",
            desc: "Ser a plataforma de reservas mais confiável do país, transformando cada viagem em uma memória especial e cada estadia em um lar longe de casa.",
          },
        ].map((item, i) => (
          <div
            key={item.title}
            style={{ animationDelay: `${(i + 4) * 80}ms` }}
            className="animate-fade-in rounded-2xl border border-border bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <item.icon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-2 font-heading text-xl font-bold text-foreground">{item.title}</h2>
            <p className="leading-relaxed text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Values */}
      <div className="mx-auto mt-14 max-w-5xl">
        <div className="mb-6 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Nossos Valores</h2>
          <p className="mt-1 text-sm text-muted-foreground">Os princípios que guiam cada decisão da ReservaFácil</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {values.map((v, i) => (
            <div
              key={v.title}
              style={{ animationDelay: `${(i + 6) * 80}ms` }}
              className="group animate-fade-in rounded-2xl border border-border bg-card p-5 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-heading text-sm font-semibold text-foreground">{v.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
