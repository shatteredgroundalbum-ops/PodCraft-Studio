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

// ─── Production Pipeline Types ──────────────────────────────────────────────

export type ProductionStage =
  | 'planning'
  | 'pre-production'
  | 'production'
  | 'post-production'
  | 'mixing'
  | 'mastering'
  | 'packaging'
  | 'distribution';

// Stage 1 — Planning
export interface EpisodeSegment {
  name: string;
  type: 'intro' | 'main' | 'interview' | 'sponsor' | 'outro' | 'transition' | 'qa';
  durationMinutes: number;
  description: string;
  talkingPoints?: string[];
}

export interface EpisodeConcept {
  title: string;
  premise: string;
  targetAudience: string;
  format: 'solo' | 'interview' | 'panel' | 'narrative' | 'roundtable';
  estimatedDuration: string;
  uniqueAngle: string;
}

export interface EpisodePlan {
  concept: EpisodeConcept;
  segments: EpisodeSegment[];
  guestSuggestions: string[];
  contentStrategy: string;
  publishingNote: string;
  purpose?: string;
  tone?: string;
  requiredMusicOrSFX?: string[];
  deliveryGoal?: string;
}

export interface ChecklistItem {
  id: string;
  stage: ProductionStage;
  task: string;
  required: boolean;
  completed: boolean;
}

export interface EpisodeBlueprint {
  plan: EpisodePlan;
  checklist: ChecklistItem[];
  estimatedProductionHours: number;
}

// Stage 2 — Pre-Production
export interface ResearchSource {
  title: string;
  type: 'article' | 'book' | 'study' | 'data' | 'expert' | 'other';
  notes: string;
  reliability: 'high' | 'medium' | 'low';
}

export interface ResearchPackage {
  topic: string;
  sources: ResearchSource[];
  keyFacts: string[];
  statistics: string[];
  controversies: string[];
  expertPerspectives: string[];
}

export interface OutlineSection {
  title: string;
  type: 'intro' | 'main' | 'interview-question' | 'sponsor' | 'transition' | 'outro';
  estimatedMinutes: number;
  talkingPoints: string[];
  notes?: string;
}

export interface EpisodeOutline {
  title: string;
  sections: OutlineSection[];
  totalEstimatedMinutes: number;
  interviewQuestions: string[];
  sponsorPlacements: string[];
  productionNotes: string;
}

// Stage 4 — Post-Production
export interface EditPoint {
  timestampApprox: string;
  type: 'silence' | 'filler' | 'noise' | 'mistake' | 'pacing';
  description: string;
  recommendation: 'cut' | 'fade' | 'reduce' | 'keep';
  severity: 'high' | 'medium' | 'low';
}

export interface EditRecommendation {
  editPoints: EditPoint[];
  fillerWordEstimate: number;
  totalSilenceEstimateSeconds: number;
  estimatedEditSavingsMinutes: number;
  cleanupSuggestions: string[];
  assemblyOrder: string[];
  trackOrganizationNotes: string;
}

// Stage 5 — Mixing
export interface MixRecommendation {
  loudnessNote: string;
  targetLUFS: number;
  measuredLUFS?: number;
  loudnessPass: boolean;
  eqSuggestions: string[];
  compressionSuggestions: string[];
  balanceNotes: string[];
  stereoNotes: string;
  consistencyScore: number;
  overallReport: string;
}

// Stage 7 — Packaging
export interface ChapterMarker {
  timestampSeconds: number;
  title: string;
  description?: string;
}

export interface EpisodeMetadata {
  title: string;
  description: string;
  episode?: number;
  season?: number;
  explicit: boolean;
  language: string;
  categories: string[];
  keywords: string[];
}

export interface SocialCopySet {
  twitter: string;
  linkedin: string;
  instagram: string;
  newsletter: string;
}

export interface EpisodePackage {
  metadata: EpisodeMetadata;
  showNotes: string;
  chapters: ChapterMarker[];
  socialCopy: SocialCopySet;
}

// Stage 8 — Distribution
export type ExportFormat = 'mp3' | 'wav' | 'flac' | 'aac';
export type DistributionPlatform = 'spotify' | 'apple-podcasts' | 'youtube' | 'rss' | 'google-podcasts';

export interface PlatformRequirement {
  platform: DistributionPlatform;
  label: string;
  formatRecommendation: string;
  metadataRequired: string[];
  notes: string;
  ready: boolean;
}

export interface DistributionPackage {
  recommendedFormat: ExportFormat;
  recommendedBitrate: string;
  targetLUFS: number;
  platforms: PlatformRequirement[];
  exportChecklist: string[];
  publishingMetadata: EpisodeMetadata;
  approvalRequired: boolean;
  distributionNotes: string;
}

// Professional podcast delivery standards
// Sources: Apple Podcasts, Spotify, Google/WBUR, Adobe
export const PODCAST_STANDARDS = {
  stereoTargetLUFS:  -16,   // Google/WBUR stereo spoken-word reference
  monoTargetLUFS:    -19,   // Google/WBUR mono spoken-word reference
  truePeakCeiling:    -1,   // -1 dBTP — Apple/Spotify/universal
  musicPlatformLUFS: -14,   // Spotify streaming master (music-heavy only)
  maxClipDB:           0,   // 0 dBFS absolute clipping threshold
} as const;

// Quality Scorecard — 13 categories per professional standard
export type QualityStatus = 'pass' | 'needs-review' | 'fail';

export interface QualityCategoryScore {
  status: QualityStatus;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  pass: boolean;
  feedback: string;
  improvements: string[];
}

export interface QualityScorecard {
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  overallStatus: QualityStatus;
  readyForExport: boolean;
  categories: {
    scriptQuality:         QualityCategoryScore;
    sourceCompleteness:    QualityCategoryScore;
    recordingQuality:      QualityCategoryScore;
    noiseLevel:            QualityCategoryScore;
    speechClarity:         QualityCategoryScore;
    speakerBalance:        QualityCategoryScore;
    musicBalance:          QualityCategoryScore;
    effectsBalance:        QualityCategoryScore;
    loudnessCompliance:    QualityCategoryScore;
    truePeakCompliance:    QualityCategoryScore;
    metadataCompleteness:  QualityCategoryScore;
    exportReadiness:       QualityCategoryScore;
    distributionReadiness: QualityCategoryScore;
  };
  blockers: string[];
  recommendations: string[];
  generatedAt: string;
}

// Approval system
export type ApprovalImpact = 'low' | 'medium' | 'high' | 'destructive';

export interface ApprovalRequest {
  id: string;
  action: string;
  description: string;
  impact: ApprovalImpact;
  payload?: unknown;
}

// Shared context carried between stages
export interface ProducerEpisodeContext {
  showName?: string;
  hostName?: string;
  topic?: string;
  targetAudience?: string;
  format?: EpisodeConcept['format'];
  durationMinutes?: number;
  blueprint?: EpisodeBlueprint;
  research?: ResearchPackage;
  outline?: EpisodeOutline;
  script?: ScriptDraft;
  editRecommendation?: EditRecommendation;
  mixRecommendation?: MixRecommendation;
  masteringRecommendation?: MasteringRecommendation;
  episodePackage?: EpisodePackage;
  distribution?: DistributionPackage;
}
