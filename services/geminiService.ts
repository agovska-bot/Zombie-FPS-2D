
import { GoogleGenAI, Type } from "@google/genai";
import { WaveIntel } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Correct way to initialize: new GoogleGenAI({ apiKey: process.env.API_KEY })
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateWaveIntel(wave: number): Promise<WaveIntel> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short tactical intel report for Wave ${wave} of a zombie apocalypse survival game. 
                   The player is fighting off hordes. Provide a scary title, a brief 2-sentence description of the current situation, 
                   a threat level (Alpha, Beta, Gamma, Omega), and a specific "mutation note" describing a new threat.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              threatLevel: { type: Type.STRING },
              mutationNote: { type: Type.STRING }
            },
            required: ["title", "description", "threatLevel", "mutationNote"]
          }
        }
      });

      // The response.text property directly returns the string output.
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (error) {
      console.error("Failed to generate intel:", error);
      return {
        title: "SIGNAL LOST",
        description: "Communication with HQ is unstable. The horde is approaching.",
        threatLevel: "UNKNOWN",
        mutationNote: "Increased aggression detected in the local population."
      };
    }
  }
}

export const geminiService = new GeminiService();
