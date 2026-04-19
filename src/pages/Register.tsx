import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", type: "guest", phone: "", cpf: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  if (user) { navigate("/"); return null; }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const name = form.name.trim();
    if (name.length < 3) e.name = "Mínimo de 3 caracteres";
    else if (name.length > 100) e.name = "Máximo de 100 caracteres";
    else if (/^\d+$/.test(name)) e.name = "Nome não pode conter apenas números";

    if (!form.email) e.email = "E-mail obrigatório";
    else if (form.email.length > 150) e.email = "Máximo de 150 caracteres";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Formato de e-mail inválido";

    if (form.password.length < 6) e.password = "Mínimo de 6 caracteres";
    else if (form.password.length > 50) e.password = "Máximo de 50 caracteres";

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (form.phone && phoneDigits.length !== 11) e.phone = "Telefone deve ter 11 dígitos";

    const cpfDigits = form.cpf.replace(/\D/g, "");
    if (!cpfDigits) e.cpf = "CPF obrigatório";
    else if (cpfDigits.length !== 11) e.cpf = "CPF deve ter 11 dígitos";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          account_type: form.type,
          cpf: form.cpf.replace(/\D/g, ""),
          phone: form.phone.replace(/\D/g, ""),
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) toast.error(t("register.alreadyRegistered"));
      else toast.error(error.message);
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
              maxLength={100} minLength={3}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("login.email")}</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={150}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("login.password")}</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required minLength={6} maxLength={50}
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">CPF *</label>
            <input type="text" required inputMode="numeric" value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })}
              placeholder="00000000000" maxLength={11}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Telefone</label>
            <input type="tel" value={formatPhone(form.phone)}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
              placeholder="(11) 99999-9999" maxLength={15}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
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
