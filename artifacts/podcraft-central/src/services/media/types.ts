// ─── Media Services Hub — Types ───────────────────────────────────────────────
// All external media generation flows through these types.
// No component or AI service imports a provider adapter directly.

// ─── Provider Identity ────────────────────────────────────────────────────────

export type MediaProviderCategory =
  | 'voice'
  | 'sound-effects'
  | 'music'
  | 'transcription'
  | 'audio-cleanup';

export type MediaProviderStatus =
  | 'not-configured'
  | 'validating'
  | 'connected'
  | 'error'
  | 'rate-limited'
  | 'insufficient-credits';

export interface MediaProviderConfig {
  id: string;
  name: string;
  category: MediaProviderCategory;
  apiKey?: string;                  // stored locally, never sent to PodCraft servers
  endpointBaseUrl?: string;         // for gateway adapters with configurable base URLs
  selectedModel?: string;
  isThirdPartyGateway: boolean;     // true = label as "Third-Party Gateway", not official
  isOfficialApi: boolean;           // true = provider has a public official developer API
  status: MediaProviderStatus;
  statusMessage?: string;
  defaultFor?: MediaProviderCategory[];
  termsUrl?: string;
  pricingUrl?: string;
  validatedAt?: string;
  updatedAt: string;
}

// ─── Generated Asset Metadata (all 18 required fields) ───────────────────────

export type MediaAssetType =
  | 'voice'
  | 'sound-effect'
  | 'music'
  | 'narration'
  | 'ambience'
  | 'transition';

export type RightsStatus = 'confirmed' | 'not-confirmed' | 'commercial' | 'personal-only' | 'unknown';

export interface GeneratedMediaAsset {
  id: string;                       // UUID
  assetType: MediaAssetType;
  provider: string;                 // provider ID, e.g. 'elevenlabs'
  providerCategory: MediaProviderCategory;
  prompt: string;                   // the exact prompt used
  generatedAt: string;              // ISO timestamp
  projectId?: string;
  episodeId?: string;
  fileName?: string;
  fileFormat?: string;              // 'mp3' | 'wav' | 'ogg' etc.
  durationSeconds?: number;
  sampleRate?: number;
  bitDepth?: number;
  licenseStatus: RightsStatus;
  commercialRightsStatus: RightsStatus;
  userConfirmedRights: boolean;     // user must explicitly confirm before final export
  sourceUrl?: string;               // URL where audio was hosted by provider
  providerJobId?: string;           // async job ID for polling
  localBlob?: string;               // base64 data URI for locally stored audio
  importedToMediaLibrary: boolean;
  placedInDAW: boolean;
  rightsNote?: string;              // freeform rights note from provider plan
}

// ─── Generation Inputs ────────────────────────────────────────────────────────

export interface MusicPromptSpec {
  genre: string;
  mood: string;
  tempo: string;                    // 'slow' | 'medium' | 'upbeat' | 'driving'
  instrumentation: string;          // e.g. 'piano, strings, subtle drums'
  episodeType: string;              // 'true-crime' | 'interview' etc.
  durationSeconds: number;
  isVocal: boolean;                 // false = instrumental only
  use: 'intro' | 'outro' | 'transition' | 'background' | 'theme' | 'stinger';
  avoidOverpoweringSpeech: boolean;
  commercialUse: boolean;
}

export interface SfxPromptSpec {
  soundType: string;                // e.g. 'door creak', 'thunder', 'crowd murmur'
  environment: string;              // e.g. 'indoor', 'outdoor', 'studio'
  durationSeconds: number;
  intensity: 'subtle' | 'moderate' | 'intense';
  realismLevel: 'realistic' | 'cinematic' | 'stylized';
  podcastContext: string;           // how it will be used in the episode
  timingPurpose: string;            // e.g. 'scene transition', 'narrative emphasis'
}

export interface VoicePromptSpec {
  tone: string;                     // e.g. 'authoritative', 'warm', 'dramatic'
  pacing: 'slow' | 'normal' | 'fast';
  emotion: string;                  // e.g. 'calm', 'excited', 'serious'
  pronunciationNotes?: string;
  targetUse: 'narrator' | 'announcer' | 'intro' | 'outro' | 'sponsor' | 'character' | 'disclaimer';
  scriptText: string;
  deliveryStyle: string;            // e.g. 'documentary', 'conversational', 'broadcast'
  voiceId?: string;                 // provider-specific voice ID
}

// ─── Generation Results ───────────────────────────────────────────────────────

export type MediaGenerationErrorCode =
  | 'provider-unavailable'
  | 'invalid-api-key'
  | 'insufficient-credits'
  | 'rate-limit-exceeded'
  | 'generation-failed'
  | 'asset-download-failed'
  | 'unsupported-response'
  | 'import-failed'
  | 'not-configured'
  | 'rights-not-confirmed';

export interface MediaGenerationError {
  code: MediaGenerationErrorCode;
  message: string;
  provider?: string;
  retryable?: boolean;
}

export interface GenerationResult {
  ok: boolean;
  asset?: GeneratedMediaAsset;
  error?: MediaGenerationError;
  manualWorkflowPrompt?: string;    // set when provider requires manual workflow
}

// ─── Voice Metadata ───────────────────────────────────────────────────────────

export interface VoiceInfo {
  id: string;
  name: string;
  description?: string;
  category?: 'premade' | 'cloned' | 'generated' | 'professional';
  previewUrl?: string;
  labels?: Record<string, string>;
  providerId: string;
}

export interface VoiceListResult {
  ok: boolean;
  voices?: VoiceInfo[];
  error?: MediaGenerationError;
}

// ─── Provider Validation ──────────────────────────────────────────────────────

export interface ProviderValidationResult {
  ok: boolean;
  provider: string;
  plan?: string;
  creditsRemaining?: number | string;
  error?: MediaGenerationError;
}

// ─── Hub request/response ─────────────────────────────────────────────────────

export type HubGenerateRequest =
  | { category: 'voice';         spec: VoicePromptSpec;  providerId?: string }
  | { category: 'sound-effects'; spec: SfxPromptSpec;    providerId?: string }
  | { category: 'music';         spec: MusicPromptSpec;  providerId?: string };

// ─── Manual workflow ──────────────────────────────────────────────────────────

export interface ManualWorkflowStep {
  step: number;
  action: string;
  detail?: string;
}

export interface ManualWorkflowGuide {
  prompt: string;
  steps: ManualWorkflowStep[];
  providerWebsiteUrl: string;
  importNote: string;
}
