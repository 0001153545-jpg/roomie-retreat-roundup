import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Languages, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type Conversation, type Message,
  LANG_FLAG, LANG_LABEL, canSendMessages, displayText, translateText,
} from "@/lib/chat";

interface PartnerProfile {
  user_id: string; full_name: string | null; avatar_url: string | null; account_type: string;
}

const ChatPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const [params] = useSearchParams();
  const convId = params.get("id");

  const [conv, setConv] = useState<Conversation | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) navigate("/login"); }, [user, loading, navigate]);

  // Load conversation + partner + messages
  useEffect(() => {
    if (!user || !convId) return;
    setLoadingChat(true);
    (async () => {
      const { data: c, error } = await supabase
        .from("conversations").select("*").eq("id", convId).maybeSingle();
      if (error || !c) { toast.error("Conversa não encontrada"); navigate("/mensagens"); return; }
      setConv(c as Conversation);

      const partnerId = c.guest_id === user.id ? c.host_id : c.guest_id;
      const { data: profs } = await supabase.rpc("get_public_profile", { target_user_id: partnerId });
      if (profs && profs.length > 0) setPartner(profs[0] as PartnerProfile);

      const { data: msgs } = await supabase
        .from("messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });
      setMessages((msgs || []) as Message[]);
      setLoadingChat(false);

      // Mark unread as read
      const isGuest = c.guest_id === user.id;
      const field = isGuest ? "read_by_guest" : "read_by_host";
      await supabase.from("messages").update({ [field]: true } as any)
        .eq("conversation_id", convId).neq("sender_id", user.id).eq(field, false);
    })();
  }, [user, convId, navigate]);

  // Realtime
  useEffect(() => {
    if (!convId || !user) return;
    const channel = supabase.channel(`chat-${convId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        async (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          if (m.sender_id !== user.id && conv) {
            const isGuest = conv.guest_id === user.id;
            const field = isGuest ? "read_by_guest" : "read_by_host";
            await supabase.from("messages").update({ [field]: true } as any).eq("id", m.id);
          }
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => prev.map((x) => x.id === m.id ? m : x));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [convId, user, conv]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const partnerLang = useMemo(() => {
    // Best-effort: assume partner uses same locale fallback. We translate to all 3 anyway when sending.
    return (["pt", "en", "es"] as const).filter((l) => l !== language);
  }, [language]);

  const isExpired = conv ? !canSendMessages(conv) : false;

  const sendMessage = async (body: string | null, imageUrl: string | null) => {
    if (!user || !conv) return;
    if (!body && !imageUrl) return;
    setSending(true);

    // Optimistic insert (no translations yet) — fast UX
    const { data, error } = await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      body,
      image_url: imageUrl,
      source_lang: language,
      translations: {},
      read_by_guest: conv.guest_id === user.id,
      read_by_host: conv.host_id === user.id,
    } as any).select().single();

    setSending(false);
    if (error) {
      toast.error("Erro ao enviar: " + error.message);
      return;
    }
    const inserted = data as Message;
    setMessages((prev) => prev.some((x) => x.id === inserted.id) ? prev : [...prev, inserted]);
    setText("");

    // Translate in background, then patch the row (UPDATE realtime will sync recipient)
    if (body) {
      translateText(body, language, partnerLang as string[]).then(async (translations) => {
        if (translations && Object.keys(translations).length > 0) {
          await supabase.from("messages").update({ translations } as any).eq("id", inserted.id);
          setMessages((prev) => prev.map((x) => x.id === inserted.id ? { ...x, translations } : x));
        }
      }).catch((e) => console.warn("bg translate failed", e));
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isExpired) return;
    await sendMessage(trimmed, null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !conv || isExpired) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem máxima 5MB"); return; }

    setSending(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${conv.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("chat-images").upload(path, file, {
      contentType: file.type, cacheControl: "3600",
    });
    if (upErr) { setSending(false); toast.error("Upload falhou: " + upErr.message); return; }
    const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
    setSending(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await sendMessage(null, urlData.publicUrl);
  };

  if (loading || loadingChat) {
    return <div className="container-page flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!conv || !partner || !user) return null;

  const partnerInitials = (partner.full_name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const partnerName = partner.full_name || (partner.account_type === "owner" ? "Anfitrião" : "Hóspede");

  return (
    <div className="container-page py-4">
      <div className="mx-auto flex h-[calc(100vh-160px)] max-w-3xl flex-col rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border p-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/mensagens")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            {partner.avatar_url && <AvatarImage src={partner.avatar_url} alt={partnerName} />}
            <AvatarFallback className="bg-primary/10 text-primary font-medium">{partnerInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {partnerName}{" "}
              <span className="text-sm text-muted-foreground">
                {LANG_FLAG[language]} {LANG_LABEL[language]}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {partner.account_type === "owner" ? "Anfitrião" : "Hóspede"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/40">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              {t("chat.startMessage") !== "chat.startMessage" ? t("chat.startMessage") : "Inicie a conversa enviando uma mensagem."}
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user.id;
            const showOrig = showOriginal[m.id];
            const { text: shown, isTranslated } = displayText(m, language);
            const finalText = showOrig ? (m.body || "") : shown;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {m.image_url && (
                    <img src={m.image_url} alt="anexo" className="mb-1 max-h-60 rounded-lg object-cover" />
                  )}
                  {m.body && <p className="whitespace-pre-wrap break-words">{finalText}</p>}
                  <div className={`mt-1 flex items-center gap-2 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {isTranslated && m.body && (
                      <button
                        onClick={() => setShowOriginal((p) => ({ ...p, [m.id]: !p[m.id] }))}
                        className="inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
                        type="button"
                      >
                        <Languages className="h-3 w-3" />
                        {showOrig ? "Ver tradução" : "Ver original"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          {isExpired ? (
            <p className="text-center text-sm text-muted-foreground italic">
              O período de mensagens foi encerrado.
            </p>
          ) : (
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={sending}>
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva uma mensagem..."
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={sending || !text.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
