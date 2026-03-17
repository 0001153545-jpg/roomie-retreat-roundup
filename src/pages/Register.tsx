import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, X } from "lucide-react";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", type: "guest" });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  if (user) { navigate("/"); return null; }

  const addChild = () => {
    if (children.length < 5) setChildren([...children, 5]);
  };

  const removeChild = (i: number) => {
    setChildren(children.filter((_, idx) => idx !== i));
  };

  const updateChildAge = (i: number, age: number) => {
    const updated = [...children];
    updated[i] = Math.min(17, Math.max(0, age));
    setChildren(updated);
  };

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
          adults,
          children: children.map((age, i) => ({ label: `${t("register.children")} ${i + 1}`, age })),
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Este email já está cadastrado. Faça login.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Conta criada! Verifique seu email para confirmar o cadastro. 🎉");
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-elevated">
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
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("register.accountType")}</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="guest">{t("register.guestType")}</option>
              <option value="owner">{t("register.ownerType")}</option>
            </select>
          </div>

          {/* Adults */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("register.adults")}</label>
            <select value={adults} onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Children */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("register.children")}</label>
            {children.map((age, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{t("register.children")} {i + 1}</span>
                <select value={age} onChange={(e) => updateChildAge(i, Number(e.target.value))}
                  className="flex-1 rounded-lg border border-input bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {Array.from({ length: 18 }, (_, a) => <option key={a} value={a}>{a} {a === 1 ? "ano" : "anos"}</option>)}
                </select>
                <button type="button" onClick={() => removeChild(i)} className="text-destructive hover:text-destructive/80">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {children.length < 5 && (
              <button type="button" onClick={addChild} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus className="h-3 w-3" /> {t("register.addChild")}
              </button>
            )}
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
