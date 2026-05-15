export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const r = await fetch(url, { redirect: "follow" });
    return res.status(200).json({ resolved: r.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
