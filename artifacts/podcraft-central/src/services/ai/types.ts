export type AIAvailability =
  | 'checking'
  | 'available'
  | 'requires-download'
  | 'unavailable';

export type AIProviderMode = 'phi3' | 'gemini-nano' | 'hybrid' | 'byok' | 'none';

export type ByokProvider =
  | 'openai'
  | 'gemini'
  | 'anthropic'
  | 'openrouter'
  | 'groq'
  | 'mistral';

export interface AIConfig {
  mode: AIProviderMode;
  byokProvider?: ByokProvider;
  byokApiKey?: string;
  byokModel?: string;
  setupComplete: boolean;
  geminiNanoAvailable?: boolean;
  updatedAt?: string;
}

export interface AIAdapter {
  readonly name: string;
  readonly description: string;
  readonly availability: AIAvailability;
  checkAvailability(): Promise<AIAvailability>;
  prompt(messages: AIMessage[], options?: AIRequestOptions): Promise<string>;
}

export const BYOK_PROVIDER_NAMES: Record<ByokProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini API',
  anthropic: 'Anthropic',
  openrouter: 'OpenRouter',
  groq: 'Groq',
  mistral: 'Mistral',
};

export const BYOK_PROVIDER_MODELS: Record<ByokProvider, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  anthropic: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
  openrouter: ['meta-llama/llama-3.1-8b-instruct:free', 'mistralai/mistral-7b-instruct:free', 'google/gemma-2-9b-it:free'],
  groq: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  mistral: ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'],
};

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
