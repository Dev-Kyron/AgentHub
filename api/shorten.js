export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const r = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
    const short = (await r.text()).trim();
    if (!short.startsWith("http")) return res.status(500).json({ error: "Shortener failed" });
    return res.status(200).json({ short });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
