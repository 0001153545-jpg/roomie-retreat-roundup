import { Mail, Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const CONTACT_EMAIL = "0001152659@senaimgaluno.com.br";

const Contact = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate delay for UX
    await new Promise((r) => setTimeout(r, 900));
    const subject = encodeURIComponent(`Contato de ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSending(false);
    setSent(true);
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setSent(false), 6000);
  };

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center animate-fade-in">
        <h1 className="mb-3 font-heading text-3xl font-bold text-foreground sm:text-4xl">{t("contact.title")}</h1>
        <p className="mb-10 text-muted-foreground">
          Preencha o formulário abaixo e retornaremos diretamente pelo seu e-mail.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-card animate-fade-in"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("contact.name")}</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("contact.email")}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("contact.message")}</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              size="lg"
              className="w-full h-12 text-base font-semibold transition-transform hover:scale-[1.02]"
            >
              {sending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando...</>
              ) : sent ? (
                <><CheckCircle2 className="mr-2 h-5 w-5" /> Enviado</>
              ) : (
                <><Send className="mr-2 h-5 w-5" /> Enviar mensagem</>
              )}
            </Button>

            {sent && (
              <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success animate-fade-in flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <span>Sua mensagem foi enviada com sucesso! Entraremos em contato pelo seu e-mail.</span>
              </div>
            )}
          </div>
        </form>

        <aside className="rounded-2xl border border-border/60 bg-card p-6 shadow-card animate-fade-in h-fit" style={{ animationDelay: "80ms" }}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-1 font-heading text-lg font-semibold text-foreground">Fale conosco</h3>
          <p className="mb-3 text-sm text-muted-foreground">Envie sua dúvida diretamente para:</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="block break-all text-sm font-medium text-primary hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </aside>
      </div>
    </div>
  );
};

export default Contact;
