
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const MODEL_NAME = 'gemini-3-flash-preview';

interface GeminiTaskParseResponse {
  title: string;
  priority: Priority;
  dueDate?: string;
  category?: string;
  description?: string;
}

const getTodayContext = () => `Today is ${new Date().toDateString()}.`;

export const parseNaturalLanguageTask = async (input: string): Promise<GeminiTaskParseResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `${getTodayContext()}\nAnalyze this task: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
            dueDate: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "priority"]
        } as Schema
      }
    });

    return JSON.parse(response.text || '{}') as GeminiTaskParseResponse;
  } catch (error) {
    console.error("Gemini parse failed, falling back", error);
    return {
      title: input,
      priority: input.toLowerCase().includes('urgent') ? 'high' : 'medium',
      category: 'General'
    };
  }
};

export const suggestDailyPlan = async (tasks: string[]): Promise<string> => {
  if (tasks.length === 0) return "You have a clear slate. What's the biggest goal today?";
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `${getTodayContext()}\nTasks: ${tasks.join(', ')}\nGive me a 1-sentence productivity focus.`,
    });
    return response.text || "Focus on your top priority tasks first.";
  } catch (e) {
    return "Keep your momentum going. One task at a time.";
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          { text: "Transcribe this audio. Output ONLY the text." }
        ]
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    throw new Error("Voice transcription failed.");
  }
};
