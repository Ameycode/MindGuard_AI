export interface Indicator {
  name: string;
  value: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  wellnessScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  indicators: Indicator[];
  summary: string;
  recommendation: string;
  isCrisis: boolean;
}

export interface VoiceAnalysisData extends AnalysisResult {
  tone: string;
  pace: string;
  energy: string;
}

export interface FaceAnalysisData extends AnalysisResult {
  expression: string;
  eyeContact: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AppState {
  voiceResult: VoiceAnalysisData | null;
  faceResult: FaceAnalysisData | null;
  chatHistory: ChatMessage[];
  finalReport: AnalysisResult | null;
  isCrisisMode: boolean;
}

export type View = 'home' | 'voice' | 'face' | 'chat' | 'results';