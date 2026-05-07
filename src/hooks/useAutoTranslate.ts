import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateText } from "@/lib/chat";

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const key = (text: string, lang: string) => `${lang}::${text}`;

/**
 * Auto-translate any user-generated text to the current language.
 * Returns the original text immediately; updates reactively when translation arrives.
 * Skips translation when the text is empty or matches the current language already.
 */
export function useAutoTranslate(text: string | null | undefined, sourceLang: string = "pt"): string {
  const { language } = useLanguage();
  const original = text || "";
  const [out, setOut] = useState<string>(() => {
    if (!original.trim() || language === sourceLang) return original;
    return cache.get(key(original, language)) || original;
  });

  useEffect(() => {
    if (!original.trim()) { setOut(""); return; }
    if (language === sourceLang) { setOut(original); return; }
    const k = key(original, language);
    const cached = cache.get(k);
    if (cached) { setOut(cached); return; }
    setOut(original);
    let cancelled = false;
    const existing = inflight.get(k);
    const p = existing || translateText(original, sourceLang, [language]).then((res) => {
      const v = res?.[language];
      if (v) cache.set(k, v);
      return v || original;
    }).finally(() => inflight.delete(k));
    if (!existing) inflight.set(k, p);
    p.then((v) => { if (!cancelled) setOut(v); }).catch(() => {});
    return () => { cancelled = true; };
  }, [original, language, sourceLang]);

  return out;
}

/** Translate a list of texts at once (preserves order). */
export function useAutoTranslateMany(texts: (string | null | undefined)[], sourceLang: string = "pt"): string[] {
  const { language } = useLanguage();
  const [out, setOut] = useState<string[]>(() => texts.map((t) => {
    const o = t || ""; if (!o.trim() || language === sourceLang) return o;
    return cache.get(key(o, language)) || o;
  }));

  useEffect(() => {
    let cancelled = false;
    const next = texts.map((t) => {
      const o = t || ""; if (!o.trim() || language === sourceLang) return o;
      return cache.get(key(o, language)) || o;
    });
    setOut(next);
    if (language === sourceLang) return;
    (async () => {
      const updated = [...next];
      let changed = false;
      for (let i = 0; i < texts.length; i++) {
        const o = texts[i] || ""; if (!o.trim()) continue;
        const k = key(o, language);
        if (cache.has(k)) continue;
        try {
          const res = await translateText(o, sourceLang, [language]);
          const v = res?.[language];
          if (v) { cache.set(k, v); updated[i] = v; changed = true; }
        } catch (_) {/* skip */}
        if (cancelled) return;
      }
      if (!cancelled && changed) setOut(updated);
    })();
    return () => { cancelled = true; };
  }, [JSON.stringify(texts), language, sourceLang]);

  return out;
}
