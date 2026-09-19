import { GoogleGenAI, Type } from "@google/genai";
import type {
  GenerateRequestPayload,
  GenerateResponsePayload,
  RewriteRequestPayload,
  RewriteResponsePayload,
} from "../src/types";

const SYSTEM_INSTRUCTION = `You are Letterly, an AI assistant that helps people write difficult personal messages.

Your job is to help the user express their own thoughts clearly and naturally.

Never invent specific facts, events, dialogue, feelings, intentions, or motivations that the user has not provided.

If essential information is missing, ask no more than two short clarification questions at a time.

If the user does not know or does not want to provide more detail, continue using neutral language that does not assume unknown facts.

Preserve nuance, especially when responsibility is shared.

Do not force the user to accept blame for everything.

Do not automatically take sides.

Write in natural, human language.

Avoid therapy jargon, robotic language, excessive formality, and dramatic emotional interpretation.

Follow the selected tone and length.

When rewriting, never introduce new facts.

CRITICAL RULES ON NON-INVENTION:
- Never invent: what another person said, what the user said, specific events, the cause of an argument, specific actions, specific feelings, specific intentions, motivations, promises, dates, locations, relationship history, or outcomes.
- If the user says something vague like "We had a fight", do NOT write "I'm sorry for raising my voice" or "I'm sorry for what I said" unless the user explicitly stated they did that. Use neutral phrasing such as "I'm sorry for how things went between us."
- When conflict or shared responsibility is mentioned (e.g., user says the other person was also wrong, or doesn't want to take all the blame): acknowledge their own part, express regret without over-apologizing, explain perspective calmly, avoid blaming, acknowledge both have feelings, and leave room for future conversation. (e.g. "I know I could have handled parts of things better, but I also want to be honest that I felt hurt too.")

CLARIFICATION RULES:
- Ask clarification questions ONLY when missing information would fundamentally change the core nature/recipient/purpose of the message, AND only if the user hasn't already stated they don't want to explain or just want to write it.
- Maximum 2 questions. Questions must be short, simple, non-judgmental, directly relevant.
- Do NOT interrogate or ask repeatedly.
- If the user says "I don't know", "I don't want to explain", "Just help me write something", or if forceDraft is true, DO NOT ask clarification questions: status MUST be "letter". Use neutral phrasing that assumes no unknown facts.`;

export function getGeminiApiKey(): { key: string | null; matchedVarName: string | null } {
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

export function getGeminiClient(): GoogleGenAI {
  const { key } = getGeminiApiKey();

  if (!key) {
    console.error(
      "CRITICAL: GEMINI_API_KEY is not defined in environment variables."
    );
    throw new Error("Gemini API key is not available on the server.");
  }

  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function generateWithFallback(ai: GoogleGenAI, configPayload: any) {
  const modelsToTry = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
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
          msg.includes("429") ||
          msg.includes("404") ||
          msg.includes("NOT_FOUND") ||
          msg.includes("not found")
        ) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        throw err;
      }
    }
  }
  throw lastError;
}

export async function handleGenerateMessage(payload: GenerateRequestPayload): Promise<GenerateResponsePayload> {
  const ai = getGeminiClient();

  const conversationLines = (payload.conversationHistory || [])
    .map((msg) => `${msg.role === "user" ? "User" : "Letterly"}: ${msg.content}`)
    .join("\n");

  const prompt = `
Requested Tone: ${payload.tone}
Tone guidelines:
- Warm: softer wording, more emotional warmth, more emphasis on connection
- Calm: balanced, neutral, respectful
- Honest: direct but thoughtful, allows difficult feelings to be expressed
- Apologetic: emphasizes regret, still avoids excessive self-blame
- Casual: sounds more like a text message, simpler wording
- Direct: concise, straightforward, less emotional language

Requested Length: ${payload.length}
Length guidelines:
- Short: about 2–5 sentences, suitable for text messages
- Medium: around 1–3 short paragraphs
- Long: more context and emotional explanation, still concise enough to feel natural

User's initial description:
"${payload.initialPrompt}"

${conversationLines ? `Conversation History so far:\n${conversationLines}\n` : ""}
${payload.forceDraft ? "User Instruction: Force drafting the letter now. Do NOT ask any clarification questions. Write a neutral, balanced message using ONLY the provided facts." : ""}

Determine if you have enough information to write the message, or if a critical piece of information is missing and clarification should be asked (maximum 2 short questions). Remember: If user expressed unwillingness to explain, or already answered questions, or if forceDraft is true, you MUST choose status "letter".

Respond in JSON according to schema.
`.trim();

  const response = await generateWithFallback(ai, {
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.6,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: {
            type: Type.STRING,
            description: "Either 'clarification' if vital context is missing and user hasn't opted out, or 'letter' if message is ready.",
          },
          clarificationQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Up to 2 short clarification questions when status is 'clarification'. Empty if status is 'letter'.",
          },
          letter: {
            type: Type.STRING,
            description: "The drafted letter or message when status is 'letter'. Leave empty or null if status is 'clarification'.",
          },
          contextSummary: {
            type: Type.STRING,
            description: "A short, discreet internal summary of the situation and intended tone balance.",
          },
        },
        required: ["status"],
      },
    },
  });

  const rawText = response.text || "{}";
  const parsed = JSON.parse(rawText) as GenerateResponsePayload;

  if (payload.forceDraft && parsed.status === "clarification") {
    parsed.status = "letter";
  }

  return parsed;
}

export async function handleRewriteMessage(payload: RewriteRequestPayload): Promise<RewriteResponsePayload> {
  const ai = getGeminiClient();

  const conversationLines = (payload.conversationHistory || [])
    .map((msg) => `${msg.role === "user" ? "User" : "Letterly"}: ${msg.content}`)
    .join("\n");

  const prompt = `
Current Letter:
"""
${payload.currentLetter}
"""

Original User Context:
"""
${payload.initialPrompt}
"""
${conversationLines ? `Conversation Context:\n${conversationLines}\n` : ""}

Target Tone: ${payload.tone}
Target Length: ${payload.length}

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
  const parsed = JSON.parse(rawText) as RewriteResponsePayload;
  return parsed;
}
