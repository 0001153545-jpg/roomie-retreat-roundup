import { Mail, Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const CONTACT_EMAIL = "0001152659@senaimgaluno.com.br";

const Contact = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    // Open user's mail client addressed to the fixed destination
    const subject = encodeURIComponent(`Contato ReservaFácil — ${form.name}`);
    const body = encodeURIComponent(
      `Nome: ${form.name}\nEmail: ${form.email}\n\nMensagem:\n${form.message}`,
    );

    await new Promise((r) => setTimeout(r, 900));
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    setStatus("sent");
    toast.success("Sua mensagem foi enviada com sucesso! Entraremos em contato pelo seu e-mail.");
    setForm({ name: "", email: "", message: "" });

    setTimeout(() => setStatus("idle"), 3500);
  };

  return (
    <div className="container-page py-12 animate-fade-in">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Fale conosco
          </span>
          <h1 className="mb-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">{t("contact.title")}</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Envie sua mensagem pelo formulário abaixo. Nossa equipe responderá diretamente no seu e-mail o mais rápido possível.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("contact.name")}</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("contact.email")}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("contact.message")}</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={status !== "idle"}
              className="h-12 w-full text-base font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {status === "sending" && (<><Loader2 className="h-5 w-5 animate-spin" /> Enviando...</>)}
              {status === "sent" && (<><CheckCircle2 className="h-5 w-5" /> Mensagem enviada!</>)}
              {status === "idle" && (<><Send className="h-5 w-5" /> {t("contact.send")}</>)}
            </Button>
          </form>

          {/* Email card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-1 font-heading text-base font-semibold text-foreground">Nosso e-mail</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Você também pode nos escrever diretamente para o endereço abaixo:
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="block break-all rounded-lg border border-border bg-background p-3 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
