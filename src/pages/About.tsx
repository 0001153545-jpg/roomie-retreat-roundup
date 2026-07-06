import { Shield, Globe, Heart, Award, Target, Eye, Sparkles, Users, HandHeart, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t } = useLanguage();

  const stats = [
    { icon: Globe, title: t("about.coverage"), desc: t("about.coverageDesc") },
    { icon: Shield, title: t("about.secure"), desc: t("about.secureDesc") },
    { icon: Heart, title: t("about.reviews"), desc: t("about.reviewsDesc") },
    { icon: Award, title: t("about.quality"), desc: t("about.qualityDesc") },
  ];

  const values = [
    { icon: Users, title: "Comunidade", desc: "Hóspedes e anfitriões conectados por confiança." },
    { icon: HandHeart, title: "Hospitalidade", desc: "Experiências acolhedoras em cada estadia." },
    { icon: Sparkles, title: "Excelência", desc: "Qualidade verificada em todos os anúncios." },
    { icon: Lock, title: "Segurança", desc: "Pagamentos protegidos e dados criptografados." },
  ];

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center animate-fade-in">
        <h1 className="mb-4 font-heading text-3xl font-bold text-foreground sm:text-5xl">{t("about.title")}</h1>
        <p className="mb-12 text-lg leading-relaxed text-muted-foreground">{t("about.description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-16">
        {stats.map((item, i) => (
          <div
            key={item.title}
            style={{ animationDelay: `${i * 80}ms` }}
            className="rounded-2xl border border-border/60 bg-card p-7 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated animate-fade-in"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <item.icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 font-heading text-base font-semibold text-foreground">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 mb-16">
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card animate-fade-in">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-3 font-heading text-2xl font-bold text-foreground">Nossa Missão</h2>
          <p className="leading-relaxed text-muted-foreground">
            Tornar cada viagem memorável, conectando hóspedes a hospedagens únicas com segurança, transparência e o melhor custo-benefício.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-3 font-heading text-2xl font-bold text-foreground">Nossa Visão</h2>
          <p className="leading-relaxed text-muted-foreground">
            Ser a plataforma de hospedagem mais confiável do Brasil, referência em experiência, qualidade e proximidade com quem viaja.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">Nossos Valores</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {values.map((v, i) => (
            <div
              key={v.title}
              style={{ animationDelay: `${i * 80}ms` }}
              className="rounded-2xl border border-border/60 bg-card p-5 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated animate-fade-in"
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
                <v.icon className="h-5 w-5 text-accent" />
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
