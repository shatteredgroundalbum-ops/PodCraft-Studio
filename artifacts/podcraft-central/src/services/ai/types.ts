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

// ─── Recording Readiness ──────────────────────────────────────────────────────

export type EnvironmentStatus = 'green' | 'yellow' | 'red';

export type RecordingReadinessLevel =
  | 'ready'              // 90–100
  | 'acceptable'         // 75–89
  | 'needs-improvement'  // 60–74
  | 'not-ready';         // < 60

export interface ReadinessMetric {
  status: EnvironmentStatus;
  note: string;
  recommendation?: string;
}

export interface RoomNoiseAssessment {
  ambientNoiseDB?: number;
  ambientNoiseStatus: EnvironmentStatus;
  hvacFanNoise: ReadinessMetric;
  trafficNoise: ReadinessMetric;
  echoReverb: ReadinessMetric;
  keyboardNoise: ReadinessMetric;
  chairNoise: ReadinessMetric;
  petChildNoise: ReadinessMetric;
  overallStatus: EnvironmentStatus;
  issues: string[];
  recommendations: string[];
}

export interface MicAssessment {
  micDetected: boolean;
  micName?: string;
  distanceEstimate: ReadinessMetric;
  popFilter: ReadinessMetric;
  inputSignalPresent: boolean;
  peakLevelDB?: number;
  peakStatus: EnvironmentStatus;
  clippingEvents: number;
  mouthNoise: ReadinessMetric;
  overallStatus: EnvironmentStatus;
  issues: string[];
  recommendations: string[];
}

export interface RecordingEnvironmentAssessment {
  roomEcho: ReadinessMetric;
  reflections: ReadinessMetric;
  backgroundHum: ReadinessMetric;
  computerFanNoise: ReadinessMetric;
  outsideNoise: ReadinessMetric;
  overallStatus: EnvironmentStatus;
  issues: string[];
  recommendations: string[];
}

export interface RecordingReadinessScore {
  score: number;
  level: RecordingReadinessLevel;
  statusLabel: string;
  environmentStatus: EnvironmentStatus;
  roomNoise: RoomNoiseAssessment;
  micSetup: MicAssessment;
  environment: RecordingEnvironmentAssessment;
  blockers: string[];
  warnings: string[];
  approvedByUser: boolean;
}

// ─── Script Quality ───────────────────────────────────────────────────────────

export type ScriptSectionType =
  | 'metadata'
  | 'cold-open'
  | 'intro'
  | 'segment'
  | 'guest-section'
  | 'sponsor'
  | 'recap'
  | 'outro'
  | 'transition'
  | 'ad-break';

export type ScriptQualityStatus = 'pass' | 'needs-review' | 'fail';

export interface ScriptDimensionScore {
  score: number;
  status: ScriptQualityStatus;
  feedback: string;
  improvements: string[];
}

export interface FinalScriptQuality {
  hookQuality: ScriptDimensionScore;
  clarity: ScriptDimensionScore;
  flow: ScriptDimensionScore;
  researchQuality: ScriptDimensionScore;
  listenerEngagement: ScriptDimensionScore;
  segmentBalance: ScriptDimensionScore;
  outroQuality: ScriptDimensionScore;
  overallScore: number;
  overallStatus: ScriptQualityStatus;
  requiresUserApproval: boolean;
  approvedForRecording: boolean;
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
  episodeNumber?: number;
  recordingDate?: string;
  host?: string;
  guests?: string[];
  topic?: string;
  wordCount?: number;
  sections: Array<{
    type: ScriptSectionType;
    title: string;
    content: string;
    estimatedSeconds?: number;
    objective?: string;
    talkingPoints?: string[];
    retentionHook?: string;
  }>;
  totalEstimatedMinutes: number;
  qualityCheck?: FinalScriptQuality;
  approvedForRecording?: boolean;
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

// ─── Recording Readiness Standards (formal spec) ─────────────────────────────
// Min Acceptable / Gold Standard / Maximum Allowed for each metric.
// Qualitative thresholds use descriptive strings; numeric thresholds use numbers.
export const RECORDING_STANDARDS = {
  roomNoise: {
    ambientNoiseDB:  { min: -50,          goldLow: -70, goldHigh: -60, max: -45,           unit: 'dB' },
    hvacFanNoise:    { min: 'audible',     gold: 'barely detectable',   max: 'clearly audible'          },
    trafficNoise:    { min: 'occasional',  gold: 'none',                max: 'frequent'                  },
    echoReverb:      { min: 'mild',        gold: 'minimal',             max: 'obvious'                   },
    keyboardNoise:   { min: 'occasional',  gold: 'none',                max: 'frequent'                  },
    chairNoise:      { min: 'occasional',  gold: 'none',                max: 'frequent'                  },
    petChildNoise:   { min: 'rare',        gold: 'none',                max: 'any recurring noise'       },
  },
  micCheck: {
    distanceIn:     { min: '10–12 in',    gold: '4–8 in',              max: '2 in'                      },
    popFilter:      { min: 'optional',    gold: 'recommended',         max: 'required (plosive speaker)'},
    peakLevelDB:    { min: -20,           goldLow: -18, goldHigh: -12, max: -6,            unit: 'dBFS' },
    clipping:       'Any clipping event = recording failure — do not distribute',
    mouthNoise:     { min: 'noticeable',  gold: 'minimal',             max: 'excessive'                 },
  },
  environment: {
    roomEcho:       { min: 'mild',        gold: 'minimal',             max: 'obvious'                   },
    reflections:    { min: 'noticeable',  gold: 'controlled',          max: 'excessive'                 },
    backgroundHum:  { min: 'low',         gold: 'none',                max: 'audible'                   },
    computerFan:    { min: 'low',         gold: 'none',                max: 'audible'                   },
    outsideNoise:   { min: 'rare',        gold: 'none',                max: 'frequent'                  },
  },
  readinessScore: {
    ready:            { min: 90, max: 100, label: 'Ready to Record',   status: 'green'  as EnvironmentStatus },
    acceptable:       { min: 75, max: 89,  label: 'Acceptable',        status: 'green'  as EnvironmentStatus },
    needsImprovement: { min: 60, max: 74,  label: 'Needs Improvement', status: 'yellow' as EnvironmentStatus },
    notReady:         { min: 0,  max: 59,  label: 'Not Ready',         status: 'red'    as EnvironmentStatus },
  },
} as const;

// ─── Script Timing ────────────────────────────────────────────────────────────
// Standard spoken podcast pace: ~150 words per minute
export const SCRIPT_TIMING = [
  { words: 150,  minutes: 1  },
  { words: 750,  minutes: 5  },
  { words: 1500, minutes: 10 },
  { words: 3000, minutes: 20 },
  { words: 4500, minutes: 30 },
  { words: 9000, minutes: 60 },
] as const;

/** Estimate spoken runtime from word count at 150 wpm. */
export function estimateRuntimeMinutes(wordCount: number): number {
  return Math.round(wordCount / 150);
}

// ─── Processing Ranges ────────────────────────────────────────────────────────
// Each parameter has Min (too little) / Gold Zone / Max (too much / danger).
// There is no single correct setting — the AI must aim for the gold zone and
// adapt based on the actual voice, microphone, and room conditions.

export interface ProcessingRange {
  readonly min: number;
  readonly goldLow: number;
  readonly goldHigh: number;
  readonly max: number;
  readonly unit: string;
  readonly description: string;
}

export type RangePosition =
  | 'below-min'   // too little — failing
  | 'below-gold'  // usable but below target
  | 'gold'        // ideal range
  | 'above-gold'  // above target but still acceptable
  | 'above-max';  // too much — danger zone

/** Evaluate where a value falls within a processing range. */
export function evaluateRange(
  value: number,
  range: Pick<ProcessingRange, 'min' | 'goldLow' | 'goldHigh' | 'max'>,
): RangePosition {
  if (value < range.min)     return 'below-min';
  if (value < range.goldLow) return 'below-gold';
  if (value <= range.goldHigh) return 'gold';
  if (value <= range.max)    return 'above-gold';
  return 'above-max';
}

export const PROCESSING_RANGES = {

  recording: {
    /** Peak input level — gold zone leaves headroom for loud moments */
    inputPeakDB:       { min: -30, goldLow: -18, goldHigh: -12, max: -6,   unit: 'dBFS',    description: 'Peak input level during speech' } as ProcessingRange,
    /** Sample rate — 48 kHz is the broadcast / podcast gold standard */
    sampleRateHz:      { min: 44100, goldLow: 48000, goldHigh: 48000, max: 96000, unit: 'Hz', description: 'Recording sample rate' } as ProcessingRange,
    /** Bit depth — 24-bit gives editing headroom without file size bloat */
    bitDepth:          { min: 16,  goldLow: 24,  goldHigh: 24,  max: 32,   unit: 'bit',     description: 'Recording bit depth' } as ProcessingRange,
  },

  eq: {
    /** High-pass filter cutoff — removes rumble without thinning the voice */
    hpfHz:             { min: 40,  goldLow: 70,  goldHigh: 90,  max: 120,  unit: 'Hz',      description: 'High-pass filter cutoff' } as ProcessingRange,
    /** Presence / clarity boost — only use if the voice already lacks clarity */
    presenceBoostDB:   { min: 0,   goldLow: 2,   goldHigh: 4,   max: 8,    unit: 'dB',      description: 'Presence boost at 3–5 kHz region' } as ProcessingRange,
    /** Mud reduction cut — reduces boxy / hollow character at 200–400 Hz */
    mudReductionDB:    { min: 0,   goldLow: 2,   goldHigh: 4,   max: 8,    unit: 'dB cut',  description: 'Mid cut at 200–400 Hz to reduce muddiness' } as ProcessingRange,
  },

  compression: {
    /** Ratio — higher values squash dynamics more aggressively */
    ratio:             { min: 1.5, goldLow: 2.5, goldHigh: 4,   max: 8,    unit: ':1',      description: 'Compression ratio' } as ProcessingRange,
    /** Gain reduction — how hard the compressor is working at threshold */
    gainReductionDB:   { min: 1,   goldLow: 3,   goldHigh: 6,   max: 10,   unit: 'dB',      description: 'Gain reduction at typical speech level' } as ProcessingRange,
    /** Attack — faster grabs transients, slower lets them breathe */
    attackMS:          { min: 1,   goldLow: 10,  goldHigh: 30,  max: 100,  unit: 'ms',      description: 'Compressor attack time' } as ProcessingRange,
    /** Release — how fast the compressor recovers between words */
    releaseMS:         { min: 25,  goldLow: 50,  goldHigh: 150, max: 500,  unit: 'ms',      description: 'Compressor release time' } as ProcessingRange,
  },

  deEsser: {
    /** Reduction amount — only as much as needed to remove harshness */
    reductionDB:       { min: 1,   goldLow: 2,   goldHigh: 5,   max: 8,    unit: 'dB',      description: 'De-esser reduction amount at sibilance frequency' } as ProcessingRange,
  },

  noiseReduction: {
    /** Reduction amount — balance between clean audio and artifact avoidance */
    reductionDB:       { min: 0,   goldLow: 3,   goldHigh: 8,   max: 15,   unit: 'dB',      description: 'Noise reduction gain applied to identified noise' } as ProcessingRange,
  },

  limiter: {
    /** True peak ceiling — gold is −1 dBTP, any value above 0 dBTP = clipping failure */
    ceilingDBTP:       { min: -2,  goldLow: -1,  goldHigh: -1,  max: -0.1, unit: 'dBTP',    description: 'True peak limiter ceiling' } as ProcessingRange,
  },

  loudness: {
    /** Stereo podcast integrated loudness target */
    stereoLUFS:        { min: -20, goldLow: -16, goldHigh: -16, max: -14,  unit: 'LUFS',    description: 'Stereo podcast integrated loudness' } as ProcessingRange,
    /** Mono podcast integrated loudness target */
    monoLUFS:          { min: -22, goldLow: -19, goldHigh: -19, max: -16,  unit: 'LUFS',    description: 'Mono podcast integrated loudness' } as ProcessingRange,
    /** Music relative to voice — negative = music is below voice level */
    musicUnderVoiceDB: { min: -30, goldLow: -24, goldHigh: -18, max: -12,  unit: 'dB',      description: 'Music level relative to voice' } as ProcessingRange,
  },

} as const;

// Quality outcome labels — what each extreme sounds like to the listener.
// These map to the Fail / Gold Zone / Overprocessed continuum.
export const QUALITY_OUTCOMES = {
  noiseReduction: { fail: 'distracting background noise',         gold: 'clean and transparent',         over: 'metallic, watery, or robotic artifacts' },
  eq:             { fail: 'muddy, boxy, or harsh',                gold: 'clear and natural',              over: 'thin, harsh, or artificially coloured' },
  compression:    { fail: 'uneven — some words quiet, some loud', gold: 'consistent, natural expression', over: 'squashed, lifeless, pump-and-breathe' },
  deEsser:        { fail: 'harsh, painful S/SH/Z/CH sounds',      gold: 'smooth, comfortable sibilance',  over: 'lisping, dull consonants' },
  loudness:       { fail: 'too quiet — listener reaches for remote', gold: 'comfortable, consistent level', over: 'fatiguing, hot, aggressive' },
  musicBalance:   { fail: 'music too faint or absent',            gold: 'music supports, never competes', over: 'music drowns out speech' },
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

// ─── AI Task Types ────────────────────────────────────────────────────────────
// Every AI call in AI Producer carries a task type.
// The AI Provider Router uses this to select the best adapter.
// In Hybrid mode, task type drives routing:
//   recording-check/summary/chat → Gemini Nano (fast, device)
//   script-draft/mastering/mixing/etc. → Phi-3 Mini (quality, local)
//   research → BYOK preferred (needs larger context window)

export type AITaskType =
  | 'recording-check'   // quick audio/environment analysis — prefer Nano / local
  | 'script-draft'      // full script generation — prefer Phi-3 or BYOK
  | 'research'          // deep research & fact-finding — prefer BYOK (larger context)
  | 'summary'           // quick summarization — prefer Nano
  | 'mastering'         // mastering preset suggestions — prefer Phi-3
  | 'mixing'            // mixing recommendations — prefer Phi-3
  | 'planning'          // episode planning / blueprint — prefer Phi-3
  | 'pre-production'    // outline, research package — prefer Phi-3
  | 'post-production'   // edit recommendations — prefer Phi-3
  | 'packaging'         // show notes, metadata, social copy — prefer Phi-3
  | 'distribution'      // distribution checklist & export — prefer Phi-3
  | 'quality-check'     // quality scorecard evaluation — prefer Phi-3
  | 'chat';             // generic / fallback

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
