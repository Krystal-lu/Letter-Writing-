export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";
  const cleanedKey = rawKey.trim().replace(/^["']|["']$/g, "").trim();
  const hasGeminiKey = Boolean(cleanedKey);

  const environment =
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "production";

  return res.status(200).json({
    status: "ok",
    hasGeminiKey,
    environment,
  });
}


