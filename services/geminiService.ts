import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeminiTaskParseResponse, Priority } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to determine date relative to today for the AI context
const getTodayContext = () => {
  const today = new Date();
  return `Today is ${today.toDateString()}.`;
};

export const parseNaturalLanguageTask = async (input: string): Promise<GeminiTaskParseResponse> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Returning mock data.");
    return mockParse(input);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        ${getTodayContext()}
        Analyze the following task input and extract structured data.
        Input: "${input}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A concise title for the task" },
            priority: { type: Type.STRING, enum: ["high", "medium", "low"], description: "The priority level" },
            dueDate: { type: Type.STRING, description: "ISO 8601 date string if a date is mentioned, otherwise null" },
            category: { type: Type.STRING, description: "A one-word category like Work, Personal, Finance, Health" },
            description: { type: Type.STRING, description: "Any additional details mentioned" }
          },
          required: ["title", "priority"]
        } as Schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeminiTaskParseResponse;

  } catch (error) {
    console.error("Gemini parse error:", error);
    return mockParse(input);
  }
};

export const suggestDailyPlan = async (tasks: string[]): Promise<string> => {
  if (!apiKey) return "Focus on high priority tasks first.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        ${getTodayContext()}
        I have these tasks: ${JSON.stringify(tasks)}.
        Generate a very short, motivating 2-sentence summary of what I should focus on today to be most productive.
      `
    });
    return response.text || "Focus on your highest priority tasks to make progress.";
  } catch (e) {
    return "Plan unavailable. Focus on top priorities.";
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  if (!apiKey) {
    console.warn("Gemini API Key missing for transcription.");
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "Call Sarah about the marketing project updates urgent";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: "Transcribe the spoken audio into text. Return only the transcription."
          }
        ]
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Transcription failed", error);
    throw error;
  }
};

// Fallback for when API key is missing or errors occur
const mockParse = (input: string): GeminiTaskParseResponse => {
  const isHigh = input.toLowerCase().includes('urgent') || input.toLowerCase().includes('asap');
  return {
    title: input,
    priority: isHigh ? 'high' : 'medium',
    category: 'General',
    dueDate: new Date().toISOString()
  };
};