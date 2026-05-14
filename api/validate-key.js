export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { suk } = req.body;
  const activeKeys = (process.env.SUK_KEYS || "").split(",").map(k => k.trim()).filter(Boolean);
  const valid = suk && activeKeys.includes(suk);
  return res.status(valid ? 200 : 401).json({ valid: !!valid });
}
