import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are Letterly, an AI assistant that helps people write difficult personal messages.

Your job is to help the user express their own thoughts clearly and naturally.

Never invent specific facts, events, dialogue, feelings, intentions, or motivations that the user has not provided.

Preserve nuance, especially when responsibility is shared.

Do not force the user to accept blame for everything.

Do not automatically take sides.

Write in natural, human language.

Avoid therapy jargon, robotic language, excessive formality, and dramatic emotional interpretation.

Follow the selected tone and length.

When rewriting, never introduce new facts.`;

function getGeminiClient(): GoogleGenAI {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "").trim();

  if (!apiKey) {
    throw new Error("Gemini API key is not available on the server.");
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function generateWithFallback(ai: GoogleGenAI, configPayload: any) {
  const modelsToTry = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          ...configPayload,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || "");
        if (
          msg.includes("503") ||
          msg.includes("high demand") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("429")
        ) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }
  }
  throw lastError;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let payload = req.body;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        // ignore
      }
    }
    payload = payload || {};

    const currentLetter = payload.currentLetter;
    if (!currentLetter || typeof currentLetter !== "string" || !currentLetter.trim()) {
      return res.status(400).json({ error: "No message to rewrite." });
    }

    const ai = getGeminiClient();

    const conversationLines = (payload.conversationHistory || [])
      .map((msg: any) => `${msg.role === "user" ? "User" : "Letterly"}: ${msg.content}`)
      .join("\n");

    const prompt = `
Current Letter:
"""
${currentLetter}
"""

Original User Context:
"""
${payload.initialPrompt || ""}
"""
${conversationLines ? `Conversation Context:\n${conversationLines}\n` : ""}

Target Tone: ${payload.tone || "Calm"}
Target Length: ${payload.length || "Medium"}

Rewrite Direction:
${payload.rewriteOption ? `Quick Option: "${payload.rewriteOption}"` : ""}
${payload.customInstruction ? `User specific instruction: "${payload.customInstruction}"` : ""}

REWRITE RULES:
1. Preserve all facts exactly.
2. DO NOT introduce ANY new facts, promises, statements, or details.
3. Preserve the user's intended meaning and perspective.
4. Only change phrasing, tone, cadence, sentence structure, or length.
5. Sound human, natural, and honest. Avoid clichés and robotic or therapy language.

Respond in JSON with the rewritten letter.
`.trim();

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.65,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            letter: {
              type: Type.STRING,
              description: "The rewritten letter meeting the requested direction and preserving all facts.",
            },
          },
          required: ["letter"],
        },
      },
    });

    const rawText = response.text || "{}";
    const parsed = JSON.parse(rawText);
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error("=== LETTERLY VERCEL API REWRITE ERROR ===", error);
    const isMissingKey =
      error?.message?.includes("Gemini API key is not available") ||
      error?.message?.includes("GEMINI_API_KEY");

    const userMessage = isMissingKey
      ? "Gemini API key is not available on the server."
      : "Unable to generate a message right now. Please try again.";

    return res.status(500).json({
      error: userMessage,
      debugError: error?.message || String(error),
    });
  }
}
