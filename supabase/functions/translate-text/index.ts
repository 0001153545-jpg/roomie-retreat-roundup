// Translate arbitrary text to one or more target languages using Lovable AI.
// Returns { translations: { en?: string, es?: string, pt?: string } }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANG_NAMES: Record<string, string> = {
  pt: "Brazilian Portuguese",
  en: "English",
  es: "Spanish",
};

const AI_TIMEOUT_MS = 18_000;
const MAX_TEXT_CHARS = 4_000;

const withTimeout = async (promise: Promise<Response>, controller: AbortController): Promise<Response> => {
  let timeoutId: number | undefined;
  const timeout = new Promise<Response>((resolve) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      resolve(new Response(JSON.stringify({ translations: {}, warning: "timeout" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }));
    }, AI_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const gracefulFallback = (warning?: string) => new Response(JSON.stringify({ translations: {}, warning }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  try {
    const { text, source_lang, target_langs } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return gracefulFallback();
    }
    const targets: string[] = Array.isArray(target_langs)
      ? target_langs.filter((l: string) => l in LANG_NAMES && l !== source_lang)
      : [];
    if (targets.length === 0) {
      return gracefulFallback();
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY missing");
      return gracefulFallback("ai_unavailable");
    }

    const sourceName = LANG_NAMES[source_lang] || "auto-detect";
    const targetList = targets.map((t) => `${t}: ${LANG_NAMES[t]}`).join(", ");

    const systemPrompt =
      `You translate user text. Source language: ${sourceName}. ` +
      `Translate the EXACT meaning to each requested target language. ` +
      `Keep tone, emojis, links, names and line breaks. Do NOT add explanations. ` +
      `Return only minified JSON with the schema {"translations":{"<code>":"<translated text>"}} for codes: ${targets.join(",")}.`;

    // Cap text length to avoid extremely long generations that hit the platform 150s idle timeout.
    const safeText = text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text;
    const controller = new AbortController();

    let resp: Response;
    try {
      resp = await withTimeout(fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Lovable-API-Key": LOVABLE_API_KEY,
          "X-Lovable-AIG-SDK": "edge-fetch",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Targets: ${targetList}\nText:\n${safeText}` },
          ],
          temperature: 0,
          max_tokens: Math.min(1800, Math.max(256, Math.ceil(safeText.length * 0.8))),
          response_format: { type: "json_object" },
        }),
      }), controller);
    } catch (fetchErr) {
      console.error("AI gateway fetch failed/timed out:", fetchErr);
      return gracefulFallback(fetchErr instanceof DOMException && fetchErr.name === "AbortError" ? "timeout" : "ai_unavailable");
    }

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return gracefulFallback(resp.status === 429 ? "rate_limited" : resp.status === 402 ? "payment_required" : "ai_error");
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    let translations: Record<string, string> = {};
    if (content) {
      try {
        const parsed = JSON.parse(content);
        translations = parsed.translations || {};
      } catch (_) {/* ignore */}
    }
    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-text error:", e);
    return gracefulFallback("translation_failed");
  }
});
