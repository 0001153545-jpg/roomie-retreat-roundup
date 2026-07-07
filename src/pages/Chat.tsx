import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Image as ImageIcon, Languages, ArrowLeft, Loader2, Smile, Check, CheckCheck } from "lucide-react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type Conversation, type Message,
  LANG_FLAG, LANG_LABEL, canSendMessages, displayText, translateText,
} from "@/lib/chat";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";

interface PartnerProfile {
  user_id: string; full_name: string | null; avatar_url: string | null; account_type: string;
}

const ChatPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [params] = useSearchParams();
  const convId = params.get("id");

  const [conv, setConv] = useState<Conversation | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  useEffect(() => { if (!loading && !user) navigate("/login"); }, [user, loading, navigate]);

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

      const isGuest = c.guest_id === user.id;
      const field = isGuest ? "read_by_guest" : "read_by_host";
      await supabase.from("messages").update({ [field]: true } as any)
        .eq("conversation_id", convId).neq("sender_id", user.id).eq(field, false);
    })();
  }, [user, convId, navigate]);

  // Realtime: DB changes + typing presence
  useEffect(() => {
    if (!convId || !user) return;
    const channel = supabase.channel(`chat-${convId}`, { config: { presence: { key: user.id } } })
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
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId && payload.userId !== user.id) {
          setPartnerTyping(true);
          if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = window.setTimeout(() => setPartnerTyping(false), 2500);
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, [convId, user, conv]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, partnerTyping]);

  const partnerLang = useMemo(() => {
    return (["pt", "en", "es"] as const).filter((l) => l !== language);
  }, [language]);

  const isExpired = conv ? !canSendMessages(conv) : false;

  const emitTyping = () => {
    if (!channelRef.current || !user) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: user.id } });
  };

  const sendMessage = async (body: string | null, imageUrl: string | null) => {
    if (!user || !conv) return;
    if (!body && !imageUrl) return;
    setSending(true);

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
  const iAmGuest = conv.guest_id === user.id;

  return (
    <div className="container-page py-4">
      <div className="mx-auto flex h-[calc(100vh-160px)] max-w-3xl flex-col rounded-xl border border-border bg-card overflow-hidden">
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
              {partnerTyping ? (
                <span className="text-primary">digitando…</span>
              ) : (
                partner.account_type === "owner" ? "Anfitrião" : "Hóspede"
              )}
            </p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/40">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              {t("chat.startMessage") !== "chat.startMessage" ? t("chat.startMessage") : "Inicie a conversa enviando uma mensagem."}
            </p>
          )}
          {messages.map((m) => (
            <ChatMessageBubble
              key={m.id}
              message={m}
              mine={m.sender_id === user.id}
              iAmGuest={iAmGuest}
              viewerLang={language}
              showOriginal={!!showOriginal[m.id]}
              onToggleOriginal={() => setShowOriginal((p) => ({ ...p, [m.id]: !p[m.id] }))}
            />
          ))}
          {partnerTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-3 py-2">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </span>
              </div>
            </div>
          )}
        </div>

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
              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" disabled={sending}>
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto border-0 p-0">
                  <EmojiPicker
                    onEmojiClick={(d) => { setText((t) => t + d.emoji); setEmojiOpen(false); }}
                    emojiStyle={EmojiStyle.NATIVE}
                    theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                    height={360}
                    width={320}
                    lazyLoadEmojis
                  />
                </PopoverContent>
              </Popover>
              <Input
                value={text}
                onChange={(e) => { setText(e.target.value); emitTyping(); }}
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

function ChatMessageBubble({
  message: m, mine, iAmGuest, viewerLang, showOriginal, onToggleOriginal,
}: {
  message: Message; mine: boolean; iAmGuest: boolean; viewerLang: any;
  showOriginal: boolean; onToggleOriginal: () => void;
}) {
  const { text: shown, isTranslated } = displayText(m, viewerLang);
  const dynamic = useAutoTranslate(
    !isTranslated && m.body && m.source_lang !== viewerLang ? m.body : null,
    m.source_lang || "pt",
  );
  const dynamicAvailable = dynamic && dynamic !== m.body;
  const effectiveTranslated = isTranslated || dynamicAvailable;
  const translatedText = isTranslated ? shown : (dynamicAvailable ? dynamic : (m.body || ""));
  const finalText = showOriginal ? (m.body || "") : translatedText;

  // Read receipt (only for messages I sent): read if partner marked their side as read
  const readByPartner = mine && (iAmGuest ? m.read_by_host : m.read_by_guest);

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
        {m.image_url && (
          <img src={m.image_url} alt="anexo" className="mb-1 max-h-60 rounded-lg object-cover" />
        )}
        {m.body && <p className="whitespace-pre-wrap break-words">{finalText}</p>}
        <div className={`mt-1 flex items-center gap-2 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {effectiveTranslated && m.body && (
            <button
              onClick={onToggleOriginal}
              className="inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
              type="button"
            >
              <Languages className="h-3 w-3" />
              {showOriginal ? "Ver tradução" : "Ver original"}
            </button>
          )}
          {mine && (
            readByPartner
              ? <CheckCheck className="h-3.5 w-3.5" />
              : <Check className="h-3.5 w-3.5" />
          )}
        </div>
      </div>
    </div>
  );
}
