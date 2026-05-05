import { supabase } from "@/integrations/supabase/client";
import type { Language } from "@/i18n/translations";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  source_lang: string;
  translations: Record<string, string>;
  read_by_guest: boolean;
  read_by_host: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  guest_id: string;
  host_id: string;
  last_message_at: string | null;
  last_check_out: string | null;
  created_at: string;
}

export const LANG_FLAG: Record<Language, string> = { pt: "🇧🇷", en: "🇺🇸", es: "🇪🇸" };
export const LANG_LABEL: Record<Language, string> = { pt: "Português", en: "English", es: "Español" };

/**
 * Get-or-create the conversation between current user (guest) and given host.
 * Returns conversation id, throws if no reservation exists.
 */
export async function getOrCreateConversation(hostId: string): Promise<string> {
  const { data, error } = await (supabase.rpc as any)("get_or_create_conversation", { target_host_id: hostId });
  if (error) throw error;
  return data as string;
}

export async function refreshConversationCheckout(convId: string) {
  await (supabase.rpc as any)("refresh_conversation_checkout", { conv_id: convId });
}

/**
 * Translate text via the translate-text edge function. Returns map of lang -> text.
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLangs: string[],
): Promise<Record<string, string>> {
  if (!text.trim() || targetLangs.length === 0) return {};
  try {
    const { data, error } = await supabase.functions.invoke("translate-text", {
      body: { text, source_lang: sourceLang, target_langs: targetLangs },
    });
    if (error) {
      console.warn("translateText error:", error);
      return {};
    }
    return (data?.translations as Record<string, string>) || {};
  } catch (e) {
    console.warn("translateText threw:", e);
    return {};
  }
}

/** True if the conversation still allows new messages (within 2 days after check-out). */
export function canSendMessages(conv: Pick<Conversation, "last_check_out">): boolean {
  if (!conv.last_check_out) return true;
  const co = new Date(conv.last_check_out + "T00:00:00");
  const deadline = new Date(co);
  deadline.setDate(deadline.getDate() + 2);
  return new Date() <= deadline;
}

/** Best translated text for the current viewer's language. */
export function displayText(msg: Message, viewerLang: Language): { text: string; isTranslated: boolean } {
  const body = msg.body || "";
  if (!body) return { text: "", isTranslated: false };
  if (msg.source_lang === viewerLang) return { text: body, isTranslated: false };
  const translated = msg.translations?.[viewerLang];
  if (translated) return { text: translated, isTranslated: true };
  return { text: body, isTranslated: false };
}
