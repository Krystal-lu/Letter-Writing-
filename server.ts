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
    res.json({
      status: "ok",
      app: "Letterly",
      env: {
        hasGeminiKey: Boolean(
          process.env.GEMINI_API_KEY ||
          process.env.GOOGLE_API_KEY ||
          process.env.VITE_GEMINI_API_KEY
        ),
        expectedEnvVar: "GEMINI_API_KEY",
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
      console.error("Environment Check:", {
        hasGEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
        hasGOOGLE_API_KEY: Boolean(process.env.GOOGLE_API_KEY),
        hasVITE_GEMINI_API_KEY: Boolean(process.env.VITE_GEMINI_API_KEY),
      });
      console.error("==========================================");
      res.status(500).json({
        error: "Something went wrong while generating your message. Please try again.",
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
      res.status(500).json({
        error: "Something went wrong while rewriting your message. Please try again.",
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
