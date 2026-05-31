export type AIAvailability =
  | 'checking'
  | 'available'
  | 'requires-download'
  | 'unavailable';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  onChunk?: (chunk: string) => void;
}

export interface AIProviderInfo {
  name: string;
  description: string;
  availability: AIAvailability;
  setupInstructions?: string;
}

export interface MicReadiness {
  status: 'ready' | 'too-quiet' | 'too-loud' | 'clipping' | 'no-signal' | 'noise-high';
  message: string;
  suggestion: string;
  level: number;
}

export interface RecordingFeedback {
  id: string;
  type: 'level' | 'clipping' | 'silence' | 'noise' | 'pacing';
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export interface ResearchResult {
  topic: string;
  outline: string[];
  researchQuestions: string[];
  keyPoints: string[];
  suggestedAngle: string;
}

export interface ScriptDraft {
  title: string;
  sections: Array<{
    type: 'intro' | 'segment' | 'transition' | 'ad-break' | 'outro';
    title: string;
    content: string;
    estimatedSeconds?: number;
  }>;
  totalEstimatedMinutes: number;
}

export interface MasteringRecommendation {
  eq: string;
  compression: string;
  deEssing: string;
  limiting: string;
  noiseReduction: string;
  targetLUFS: number;
  summary: string;
}
