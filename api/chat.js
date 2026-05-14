export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server." });

  const { messages = [], question, sources = [], suk } = req.body;
  const activeKeys = (process.env.SUK_KEYS || "").split(",").map(k => k.trim()).filter(Boolean);
  if (!suk || !activeKeys.includes(suk)) {
    return res.status(401).json({ error: "Invalid system unlock key." });
  }

  let system = `You are an AI assistant helping call centre agents answer customer questions in real time. \
Be direct, factual, and concise. Structure answers with short bullet points when listing multiple items. \
Never tell the agent to "visit the website", "check online", or "contact support" — they need the answer right now. \
If you don't know something, say what you do know and note the specific detail wasn't available.`;
  let apiMessages;

  if (sources.length > 0) {
    system = `You are an AI assistant helping call centre agents answer customer questions in real time using fetched company website content.

Rules:
- Answer ONLY from the source content provided below.
- Be direct and factual — extract the actual information and present it clearly.
- Never say "visit the website", "check the site", "contact support", or redirect anywhere. The agent needs the answer NOW to tell the customer.
- Use short bullet points for lists of items (e.g. types of insurance, fees, options).
- Cite the source URL once at the very end as "Source: [url]" — not inline.
- If specific details are not in the fetched content, state what IS known and note "full details weren't available in the fetched content" — do NOT redirect.
- Keep answers tight: enough for the agent to relay confidently to a customer on a live call.`;

    const fetched = await Promise.all(
      sources.map(async (s) => {
        try {
          // Domain-only URLs (e.g. https://site.com or https://site.com/) use Jina Search
          // to find relevant content across the whole site.
          // Specific page URLs (e.g. https://site.com/about) use Jina Reader for that page.
          const parsed = new URL(s.url);
          const isRootDomain = parsed.pathname === "/" || parsed.pathname === "";

          const jinaHeaders = { Accept: "text/plain" };
          if (process.env.JINA_API_KEY) jinaHeaders["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;

          let body = null;

          if (isRootDomain) {
            // 1. Try authenticated Jina Search (whole-site)
            const searchRes = await fetch(`https://s.jina.ai/${encodeURIComponent(question)}`, {
              headers: { ...jinaHeaders, "X-Site": s.url },
            });
            if (searchRes.ok) {
              body = (await searchRes.text()).slice(0, 15000);
            }

            // 2. Fall back: read homepage + a few likely subpages
            if (!body) {
              const origins = [s.url];
              // Derive candidate pages from question keywords
              const kw = question.toLowerCase();
              const candidates = [
                kw.includes("insur") && "/insurance",
                kw.includes("super") && "/superannuation",
                kw.includes("retire") && "/retirement",
                kw.includes("invest") && "/investments",
                kw.includes("fee") && "/fees",
                kw.includes("contact") && "/contact-us",
              ].filter(Boolean);
              candidates.forEach(path => origins.push(s.url.replace(/\/$/, "") + path));

              const pages = await Promise.all(
                origins.slice(0, 4).map(async (u) => {
                  try {
                    const r2 = await fetch(`https://r.jina.ai/${u}`, { headers: jinaHeaders });
                    return r2.ok ? (await r2.text()).slice(0, 5000) : null;
                  } catch { return null; }
                })
              );
              const combined = pages.filter(Boolean).join("\n\n---\n\n");
              if (combined) body = combined;
            }
          } else {
            const r = await fetch(`https://r.jina.ai/${s.url}`, { headers: jinaHeaders });
            if (r.ok) body = (await r.text()).slice(0, 15000);
          }
          const tag = `[Source: ${s.url}${s.label ? ` — ${s.label}` : ""}]`;
          return body ? `${tag}\n${body}` : `${tag}\n(could not fetch content — try adding a specific page URL instead of the root domain)`;
        } catch {
          return `[Source: ${s.url}]\n(could not fetch content)`;
        }
      })
    );

    apiMessages = [
      ...messages,
      { role: "user", content: `Sources:\n\n${fetched.join("\n\n---\n\n")}\n\n---\n\nQuestion: ${question}` },
    ];
  } else {
    apiMessages = [...messages, { role: "user", content: question }];
  }

  // Switch to SSE streaming so words appear as they're generated
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system,
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      res.write(`data: ${JSON.stringify({ error: err.error?.message || "API error" })}\n\n`);
      return res.end();
    }

    // Pipe Anthropic's SSE stream straight to the client
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
}
