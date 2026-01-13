import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAnalysisResult } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeMedicalNotes = async (
  symptoms: string,
  rawNotes: string
): Promise<GeminiAnalysisResult> => {
  try {
    const ai = getAiClient();
    
    const prompt = `
      You are an expert medical AI assistant. Analyze the following patient data.
      
      Patient Symptoms: ${symptoms}
      Doctor's Rough Notes: ${rawNotes}
      
      Provide a structured analysis including a suggested diagnosis, a professional summary of the condition, 
      assess the severity level (Low, Moderate, High, Critical), and list recommended next actions.
      
      Return the response in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedDiagnosis: { type: Type.STRING },
            summary: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ['Low', 'Moderate', 'High', 'Critical'] },
            recommendedActions: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["suggestedDiagnosis", "summary", "severity", "recommendedActions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeminiAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback for demo if API fails or key is missing
    return {
      suggestedDiagnosis: "Analysis Failed",
      summary: "Could not retrieve AI analysis. Please check API Key.",
      severity: "Low",
      recommendedActions: ["Review notes manually"]
    };
  }
};
