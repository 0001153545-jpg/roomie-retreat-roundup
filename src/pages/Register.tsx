import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIBGEStates, useIBGECities } from "@/hooks/useIBGE";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", type: "guest", state: "", city: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { states, loading: statesLoading, error: statesError } = useIBGEStates();
  const { cities, loading: citiesLoading, error: citiesError } = useIBGECities(form.state);

  if (user) { navigate("/"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          account_type: form.type,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error(t("register.alreadyRegistered"));
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(t("register.success"));
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-elevated">
        <h1 className="mb-1 font-heading text-2xl font-bold text-foreground">{t("register.title")}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t("register.subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("register.name")}</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("login.email")}</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("login.password")}</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Telefone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado</label>
              {statesError ? (
                <p className="text-xs text-destructive">{statesError}</p>
              ) : (
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value, city: "" })}
                  disabled={statesLoading}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{statesLoading ? "Carregando..." : "Selecione"}</option>
                  {states.map((s) => (
                    <option key={s.sigla} value={s.sigla}>{s.nome}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Cidade</label>
              {citiesError ? (
                <p className="text-xs text-destructive">{citiesError}</p>
              ) : (
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  disabled={!form.state || citiesLoading}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">
                    {!form.state ? "Selecione o estado" : citiesLoading ? "Carregando..." : "Selecione"}
                  </option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("register.accountType")}</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="guest">{t("register.guestType")}</option>
              <option value="owner">{t("register.ownerType")}</option>
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("register.loading") : t("register.button")}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("register.hasAccount")}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">{t("register.login")}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
