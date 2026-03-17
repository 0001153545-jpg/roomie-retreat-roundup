import { Shield, Globe, Heart, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-3 font-heading text-3xl font-bold text-foreground sm:text-4xl">{t("about.title")}</h1>
        <p className="mb-10 text-lg leading-relaxed text-muted-foreground">{t("about.description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Globe, title: t("about.coverage"), desc: t("about.coverageDesc") },
          { icon: Shield, title: t("about.secure"), desc: t("about.secureDesc") },
          { icon: Heart, title: t("about.reviews"), desc: t("about.reviewsDesc") },
          { icon: Award, title: t("about.quality"), desc: t("about.qualityDesc") },
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
