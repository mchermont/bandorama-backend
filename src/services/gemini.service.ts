import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

const IMAGE_MODEL = "gemini-2.5-flash-image";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.gemini.apiKey });
  }
  return client;
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const candidates = response.candidates ?? [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    for (const part of parts) {
      const inlineData = part.inlineData;
      if (inlineData?.data) {
        const mimeType = inlineData.mimeType ?? "image/png";
        const buffer = Buffer.from(inlineData.data, "base64");
        return { buffer, mimeType };
      }
    }
  }

  throw new Error("Gemini did not return any image data for the given prompt");
}
