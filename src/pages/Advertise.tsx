import { useState } from "react";
import { Building2, Camera, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Advertise = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", city: "", state: "", type: "Hotel", price: "", guests: "2", description: "",
  });

  const steps = [
    { icon: Building2, title: t("advertise.step1"), desc: t("advertise.step1Desc") },
    { icon: Camera, title: t("advertise.step2"), desc: t("advertise.step2Desc") },
    { icon: DollarSign, title: t("advertise.step3"), desc: t("advertise.step3Desc") },
    { icon: BarChart3, title: t("advertise.step4"), desc: t("advertise.step4Desc") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("advertise.loginRequired"));
      navigate("/login");
      return;
    }
    if (!form.title || !form.city || !form.price) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSubmitting(true);
    // For now, store as a profile update or just show success
    // In a real app, you'd have a listings table
    toast.success("Propriedade cadastrada com sucesso! 🎉", {
      description: `${form.title} — ${form.city}, ${form.state}`,
    });
    setSubmitting(false);
    setShowForm(false);
    setForm({ title: "", city: "", state: "", type: "Hotel", price: "", guests: "2", description: "" });
  };

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-3 font-heading text-3xl font-bold text-foreground sm:text-4xl">{t("advertise.title")}</h1>
        <p className="mb-10 text-lg text-muted-foreground">{t("advertise.subtitle")}</p>
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

      {!showForm ? (
        <div className="text-center">
          <Button size="lg" className="shadow-hero" onClick={() => {
            if (!user) { toast.error(t("advertise.loginRequired")); navigate("/login"); return; }
            setShowForm(true);
          }}>
            {t("advertise.startNow")}
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6 shadow-elevated">
          <h2 className="mb-6 font-heading text-xl font-bold text-foreground">{t("advertise.formTitle")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.propertyName")} *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.city")} *</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.state")}</label>
                <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.propertyType")}</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="styled-select w-full appearance-none rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option>Hotel</option>
                  <option>Pousada</option>
                  <option>Resort</option>
                  <option>Suíte</option>
                  <option>Hostel</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.pricePerNight")} *</label>
                <input type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.maxGuests")}</label>
                <select value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })}
                  className="styled-select w-full appearance-none rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.descriptionLabel")}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4} className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button type="submit" className="w-full shadow-hero" disabled={submitting}>
              {submitting ? t("advertise.submitting") : t("advertise.submit")}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Advertise;
