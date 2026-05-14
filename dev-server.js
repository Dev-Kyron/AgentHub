// Local dev API server — run alongside Vite: node dev-server.js
// Reads ANTHROPIC_API_KEY from .env.local, serves /api/chat on :3001
import { createServer } from "http";
import { readFileSync } from "fs";

try {
  readFileSync(".env.local", "utf8").split("\n").forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k?.trim()) process.env[k.trim()] = v.join("=").trim();
  });
} catch {}

const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.error("No ANTHROPIC_API_KEY found in .env.local"); process.exit(1); }

createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); return res.end(); }
  if (req.url !== "/api/chat") { res.writeHead(404); return res.end(); }

  let body = "";
  for await (const chunk of req) body += chunk;
  const { messages = [], question, sources = [] } = JSON.parse(body || "{}");

  // Reuse the same handler logic
  const { default: handler } = await import("./api/chat.js?" + Date.now());

  let status = 200, responseBody = "";
  const mockRes = {
    setHeader() {}, end() {},
    status(c) { status = c; return this; },
    json(d) { responseBody = JSON.stringify(d); },
  };
  await handler({ method: "POST", body: { messages, question, sources } }, mockRes);

  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(responseBody);
}).listen(3001, () => console.log("✓ Dev API on http://localhost:3001  (proxied via Vite → /api/chat)"));
