import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { handleGenerateMessage, handleRewriteMessage } from "./api/_agent.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "1mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    const explicitCandidates = [
      "GEMINI_API_KEY",
      "GOOGLE_API_KEY",
      "VITE_GEMINI_API_KEY",
      "GOOGLE_GEMINI_API_KEY",
      "GEMINI_KEY",
    ];

    let foundKey: string | null = null;
    let matchedVarName: string | null = null;

    for (const name of explicitCandidates) {
      const val = process.env[name];
      if (typeof val === "string") {
        const cleaned = val.trim().replace(/^["']|["']$/g, "").trim();
        if (cleaned.length > 0) {
          foundKey = cleaned;
          matchedVarName = name;
          break;
        }
      }
    }

    if (!foundKey) {
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
          foundKey = cleanedVal;
          matchedVarName = key;
          break;
        }
      }
    }

    res.json({
      status: "ok",
      hasGeminiKey: Boolean(foundKey),
      environment: process.env.NODE_ENV || "development",
      diagnostics: {
        matchedVarName,
        availableEnvKeys: Object.keys(process.env).sort(),
      },
    });
  });

  // Generate Letter or Clarification
  app.post("/api/generate", async (req, res) => {
    try {
      const payload = req.body || {};
      if (!payload.initialPrompt || typeof payload.initialPrompt !== "string" || !payload.initialPrompt.trim()) {
        res.status(400).json({ error: "Tell me a little about what happened first." });
        return;
      }

      const result = await handleGenerateMessage(payload);
      res.json(result);
    } catch (error: any) {
      console.error("=== LETTERLY SERVER API GENERATE ERROR ===");
      console.error("Error Message:", error?.message);
      if (error?.stack) console.error("Error Stack:", error.stack);
      console.error("==========================================");
      const isMissingKey =
        error?.message?.includes("Gemini API key is not available") ||
        error?.message?.includes("GEMINI_API_KEY");

      const userMessage = isMissingKey
        ? "Gemini API key is not available on the server."
        : "Unable to generate a message right now. Please try again.";

      res.status(500).json({
        error: userMessage,
        debugError: error?.message || String(error),
      });
    }
  });

  // Rewrite Letter
  app.post("/api/rewrite", async (req, res) => {
    try {
      const payload = req.body || {};
      if (!payload.currentLetter || typeof payload.currentLetter !== "string" || !payload.currentLetter.trim()) {
        res.status(400).json({ error: "No message to rewrite." });
        return;
      }

      const result = await handleRewriteMessage(payload);
      res.json(result);
    } catch (error: any) {
      console.error("=== LETTERLY SERVER API REWRITE ERROR ===");
      console.error("Error Message:", error?.message);
      if (error?.stack) console.error("Error Stack:", error.stack);
      console.error("=========================================");
      const isMissingKey =
        error?.message?.includes("Gemini API key is not available") ||
        error?.message?.includes("GEMINI_API_KEY");

      const userMessage = isMissingKey
        ? "Gemini API key is not available on the server."
        : "Unable to generate a message right now. Please try again.";

      res.status(500).json({
        error: userMessage,
        debugError: error?.message || String(error),
      });
    }
  });

  // Vite middleware in development, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Letterly server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
