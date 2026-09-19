export function getGeminiApiKey(): { key: string | null; matchedVarName: string | null } {
  // 1. Direct standard checks
  const explicitCandidates = [
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "VITE_GEMINI_API_KEY",
    "GOOGLE_GEMINI_API_KEY",
    "GEMINI_KEY",
  ];

  for (const name of explicitCandidates) {
    const val = process.env[name];
    if (typeof val === "string") {
      const cleaned = val.trim().replace(/^["']|["']$/g, "").trim();
      if (cleaned.length > 0) {
        return { key: cleaned, matchedVarName: name };
      }
    }
  }

  // 2. Case-insensitive & trimmed search across all process.env keys
  for (const [key, val] of Object.entries(process.env)) {
    if (typeof val !== "string") continue;
    const cleanedVal = val.trim().replace(/^["']|["']$/g, "").trim();
    if (!cleanedVal) continue;

    const normalizedKey = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (
      normalizedKey === "GEMINI_API_KEY" ||
      normalizedKey === "GOOGLE_API_KEY" ||
      normalizedKey === "VITE_GEMINI_API_KEY" ||
      normalizedKey === "GOOGLE_GEMINI_API_KEY" ||
      normalizedKey === "GEMINI_KEY" ||
      (normalizedKey.includes("GEMINI") && normalizedKey.includes("KEY"))
    ) {
      return { key: cleanedVal, matchedVarName: key };
    }
  }

  return { key: null, matchedVarName: null };
}

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

  const { key, matchedVarName } = getGeminiApiKey();
  const hasGeminiKey = Boolean(key);

  const environment =
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "production";

  // Safe list of environment variable names present in process.env (never values)
  const envKeyNames = Object.keys(process.env).sort();

  return res.status(200).json({
    status: "ok",
    hasGeminiKey,
    environment,
    diagnostics: {
      matchedVarName,
      vercelEnv: process.env.VERCEL_ENV || null,
      vercelUrl: process.env.VERCEL_URL || null,
      vercelRegion: process.env.VERCEL_REGION || null,
      availableEnvKeys: envKeyNames,
    },
  });
}


