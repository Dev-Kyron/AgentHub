export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server." });

  const { messages = [], question, sources = [] } = req.body;

  let system = "You are a helpful assistant for company staff. Be concise and clear.";
  let apiMessages;

  if (sources.length > 0) {
    system =
      "You are a helpful assistant. Answer questions ONLY using the content from the provided sources below. " +
      "Always cite the exact source URL(s) you drew from. If the answer is not in the sources, say so clearly.";

    const fetched = await Promise.all(
      sources.map(async (s) => {
        try {
          const r = await fetch(`https://r.jina.ai/${s.url}`, { headers: { Accept: "text/plain" } });
          const body = r.ok ? (await r.text()).slice(0, 8000) : null;
          const tag = `[Source: ${s.url}${s.label ? ` — ${s.label}` : ""}]`;
          return body ? `${tag}\n${body}` : `${tag}\n(could not fetch content)`;
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

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1024, system, messages: apiMessages }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.error?.message || "Upstream API error" });
    }

    const data = await upstream.json();
    return res.status(200).json({ content: data.content[0].text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
