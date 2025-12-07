import { GoogleGenAI, Type, Schema } from "@google/genai";
import { VoiceAnalysisData, FaceAnalysisData, AnalysisResult, ChatMessage } from "../types";

// Using gemini-2.5-flash for speed and multimodal capabilities.
// Can be swapped for gemini-3-pro-preview if high-reasoning is required.
const MODEL_NAME = "gemini-2.5-flash"; 

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas ---

const indicatorSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    value: { type: Type.STRING },
    description: { type: Type.STRING },
    severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
  },
  required: ["name", "value", "description", "severity"],
};

const commonAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    wellnessScore: { type: Type.NUMBER, description: "0-100 score, higher is better" },
    riskLevel: { type: Type.STRING, enum: ["low", "moderate", "high", "severe"] },
    indicators: { type: Type.ARRAY, items: indicatorSchema },
    summary: { type: Type.STRING },
    recommendation: { type: Type.STRING },
    isCrisis: { type: Type.BOOLEAN, description: "True if immediate intervention is needed (suicide, self-harm)" },
  },
  required: ["wellnessScore", "riskLevel", "indicators", "summary", "recommendation", "isCrisis"],
};

// --- Helpers ---

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- API Functions ---

export const analyzeVoice = async (audioBlob: Blob): Promise<VoiceAnalysisData> => {
  const base64Audio = await blobToBase64(audioBlob);

  const prompt = `
    Analyze this voice recording for mental wellness.
    Focus on: Tone, Pace, Energy, and Emotional markers.
    Be supportive. Identify if the user sounds stressed, anxious, depressed, or calm.
    CRITICAL: If you detect immediate suicidal intent, set isCrisis to true.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "audio/webm", data: base64Audio } } // Assuming webm from MediaRecorder
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ...commonAnalysisSchema.properties,
          tone: { type: Type.STRING },
          pace: { type: Type.STRING },
          energy: { type: Type.STRING },
        },
        required: [...(commonAnalysisSchema.required || []), "tone", "pace", "energy"],
      },
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(text) as VoiceAnalysisData;
};

export const analyzeFace = async (imageBase64: string): Promise<FaceAnalysisData> => {
  // imageBase64 expects the raw base64 string (no data:image/jpeg;base64 prefix ideally, but SDK handles it mostly)
  // Ensure we strip the prefix if passed from canvas.toDataURL
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const prompt = `
    Analyze this facial expression for mental wellness indicators.
    Look for: Tension, Eye contact, Micro-expressions of sadness/anxiety.
    Be compassionate. Indicators only, no diagnosis.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ...commonAnalysisSchema.properties,
          expression: { type: Type.STRING },
          eyeContact: { type: Type.STRING },
        },
        required: [...(commonAnalysisSchema.required || []), "expression", "eyeContact"],
      },
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(text) as FaceAnalysisData;
};

export const chatWithBot = async (history: ChatMessage[], newMessage: string): Promise<{ text: string; isCrisis: boolean }> => {
  // Construct history for context
  // System instruction is crucial here
  const systemInstruction = `
    You are MindGuard, a supportive mental health companion.
    Role: Listen, validate, suggest coping strategies. NOT a doctor.
    Tone: Empathetic, calm, non-judgmental.
    Safety: If user mentions suicide, self-harm, or killing themselves, you MUST respond with specific crisis resources and immediate encouragement to call 988.
    Output: Return a JSON object with the response text and a boolean 'isCrisis' flag.
  `;

  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  // Add new message
  contents.push({
    role: "user",
    parts: [{ text: newMessage }]
  });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          isCrisis: { type: Type.BOOLEAN }
        },
        required: ["text", "isCrisis"]
      }
    }
  });

  const resultText = response.text;
  if (!resultText) throw new Error("No response");
  return JSON.parse(resultText);
};

export const generateFusionReport = async (
  voiceData: VoiceAnalysisData | null,
  faceData: FaceAnalysisData | null,
  chatHistory: ChatMessage[]
): Promise<AnalysisResult> => {

  const promptParts = [
    { text: "Generate a holistic mental health risk assessment based on the available multimodal data." }
  ];

  if (voiceData) {
    promptParts.push({ text: `VOICE ANALYSIS DATA: ${JSON.stringify(voiceData)}` });
  }
  if (faceData) {
    promptParts.push({ text: `FACIAL ANALYSIS DATA: ${JSON.stringify(faceData)}` });
  }
  if (chatHistory.length > 0) {
    const chatSummary = chatHistory.map(m => `${m.role}: ${m.text}`).join("\n");
    promptParts.push({ text: `CHAT HISTORY SUMMARY: ${chatSummary}` });
  }

  promptParts.push({
    text: `
      Combine these inputs to generate a final report.
      1. Calculate an overall wellness score (0-100).
      2. Identify cross-modal patterns (e.g., voice says 'fine' but face shows sadness).
      3. Provide a compassionate summary and specific, actionable recommendations.
      4. Determine overall risk level.
    `
  });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: promptParts },
    config: {
      responseMimeType: "application/json",
      responseSchema: commonAnalysisSchema,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response");
  return JSON.parse(text) as AnalysisResult;
};