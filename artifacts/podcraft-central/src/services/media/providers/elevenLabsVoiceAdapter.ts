// ─── ElevenLabs Voice Adapter ─────────────────────────────────────────────────
// Official ElevenLabs REST API (api.elevenlabs.io)
// Use cases: TTS, narration, announcer, intro/outro, sponsor reads, character voices
//
// RULES (non-negotiable):
// - Do not use a company-owned API key. User must provide their own.
// - Do not clone a voice without explicit user permission.
// - Do not impersonate a real person.
// - API keys are stored locally in IndexedDB. Never sent to PodCraft servers.
// - All generated assets must be tracked with rights metadata.

import type {
  VoicePromptSpec, VoiceInfo, VoiceListResult,
  GenerationResult, GeneratedMediaAsset, ProviderValidationResult,
  MediaGenerationError,
} from '../types';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

// Default model — xi-multilingual-v2 is ElevenLabs' highest-quality multilingual model
const DEFAULT_MODEL = 'eleven_multilingual_v2';

function elevenlabsError(code: MediaGenerationError['code'], message: string, retryable = false): MediaGenerationError {
  return { code, message, provider: 'elevenlabs', retryable };
}

async function apiFetch(
  path: string,
  apiKey: string,
  options: RequestInit = {},
): Promise<Response> {
  const response = await fetch(`${ELEVENLABS_BASE}${path}`, {
    ...options,
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validateElevenLabsKey(apiKey: string): Promise<ProviderValidationResult> {
  if (!apiKey?.trim()) {
    return { ok: false, provider: 'elevenlabs', error: elevenlabsError('invalid-api-key', 'API key is required.') };
  }
  try {
    const res = await apiFetch('/user', apiKey);
    if (res.status === 401) {
      return { ok: false, provider: 'elevenlabs', error: elevenlabsError('invalid-api-key', 'Invalid API key. Check your ElevenLabs account.') };
    }
    if (!res.ok) {
      return { ok: false, provider: 'elevenlabs', error: elevenlabsError('provider-unavailable', `ElevenLabs returned ${res.status}.`) };
    }
    const data = await res.json() as { subscription?: { tier?: string; character_count?: number; character_limit?: number } };
    const tier = data.subscription?.tier ?? 'unknown';
    const used = data.subscription?.character_count ?? 0;
    const limit = data.subscription?.character_limit ?? 0;
    const remaining = limit > 0 ? `${(limit - used).toLocaleString()} of ${limit.toLocaleString()} characters` : 'unknown';
    return { ok: true, provider: 'elevenlabs', plan: tier, creditsRemaining: remaining };
  } catch {
    return { ok: false, provider: 'elevenlabs', error: elevenlabsError('provider-unavailable', 'Could not reach ElevenLabs. Check your network connection.', true) };
  }
}

// ─── Voice List ───────────────────────────────────────────────────────────────

export async function getElevenLabsVoices(apiKey: string): Promise<VoiceListResult> {
  if (!apiKey?.trim()) {
    return { ok: false, error: elevenlabsError('not-configured', 'ElevenLabs API key not configured.') };
  }
  try {
    const res = await apiFetch('/voices', apiKey);
    if (res.status === 401) {
      return { ok: false, error: elevenlabsError('invalid-api-key', 'Invalid API key.') };
    }
    if (!res.ok) {
      return { ok: false, error: elevenlabsError('provider-unavailable', `ElevenLabs /voices returned ${res.status}.`) };
    }
    const data = await res.json() as { voices?: Array<{
      voice_id: string;
      name: string;
      description?: string;
      category?: string;
      preview_url?: string;
      labels?: Record<string, string>;
    }> };
    const voices: VoiceInfo[] = (data.voices ?? []).map(v => ({
      id: v.voice_id,
      name: v.name,
      description: v.description,
      category: v.category as VoiceInfo['category'],
      previewUrl: v.preview_url,
      labels: v.labels,
      providerId: 'elevenlabs',
    }));
    return { ok: true, voices };
  } catch {
    return { ok: false, error: elevenlabsError('provider-unavailable', 'Could not reach ElevenLabs.', true) };
  }
}

// ─── Text-to-Speech Generation ────────────────────────────────────────────────

export async function generateElevenLabsVoice(
  apiKey: string,
  spec: VoicePromptSpec,
  projectId?: string,
  episodeId?: string,
): Promise<GenerationResult> {
  if (!apiKey?.trim()) {
    return { ok: false, error: elevenlabsError('not-configured', 'ElevenLabs API key not configured.') };
  }
  if (!spec.scriptText?.trim()) {
    return { ok: false, error: elevenlabsError('generation-failed', 'Script text is required for voice generation.') };
  }
  if (!spec.voiceId) {
    return { ok: false, error: elevenlabsError('generation-failed', 'A voice must be selected before generating.') };
  }

  try {
    const body = {
      text: spec.scriptText,
      model_id: DEFAULT_MODEL,
      voice_settings: {
        stability: spec.pacing === 'slow' ? 0.75 : spec.pacing === 'fast' ? 0.45 : 0.60,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    };

    const res = await apiFetch(`/text-to-speech/${spec.voiceId}`, apiKey, {
      method: 'POST',
      headers: { 'Accept': 'audio/mpeg' },
      body: JSON.stringify(body),
    });

    if (res.status === 401) return { ok: false, error: elevenlabsError('invalid-api-key', 'Invalid API key.') };
    if (res.status === 422) return { ok: false, error: elevenlabsError('generation-failed', 'Invalid TTS request — check voice ID and text.') };
    if (res.status === 429) return { ok: false, error: elevenlabsError('rate-limit-exceeded', 'Rate limit exceeded. Try again shortly.', true) };
    if (res.status === 402) return { ok: false, error: elevenlabsError('insufficient-credits', 'Insufficient ElevenLabs credits. Check your subscription.') };
    if (!res.ok) return { ok: false, error: elevenlabsError('generation-failed', `ElevenLabs TTS returned ${res.status}.`) };

    const audioBuffer = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(audioBuffer);
    const dataUri = `data:audio/mpeg;base64,${base64}`;

    const asset: GeneratedMediaAsset = {
      id: crypto.randomUUID(),
      assetType: 'voice',
      provider: 'elevenlabs',
      providerCategory: 'voice',
      prompt: buildVoicePromptString(spec),
      generatedAt: new Date().toISOString(),
      projectId,
      episodeId,
      fileName: `voice-${spec.targetUse}-${Date.now()}.mp3`,
      fileFormat: 'mp3',
      licenseStatus: 'not-confirmed',
      commercialRightsStatus: 'not-confirmed',
      userConfirmedRights: false,
      localBlob: dataUri,
      importedToMediaLibrary: false,
      placedInDAW: false,
      rightsNote: 'Commercial rights depend on your ElevenLabs subscription plan. Verify before use in published content.',
    };

    return { ok: true, asset };
  } catch {
    return { ok: false, error: elevenlabsError('provider-unavailable', 'Could not reach ElevenLabs.', true) };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function buildVoicePromptString(spec: VoicePromptSpec): string {
  return [
    `Use: ${spec.targetUse}`,
    `Tone: ${spec.tone}`,
    `Pacing: ${spec.pacing}`,
    `Emotion: ${spec.emotion}`,
    `Delivery: ${spec.deliveryStyle}`,
    spec.pronunciationNotes ? `Pronunciation: ${spec.pronunciationNotes}` : null,
    `Text: "${spec.scriptText.slice(0, 200)}${spec.scriptText.length > 200 ? '…' : ''}"`,
  ].filter(Boolean).join(' | ');
}

/** Render a suggested voice prompt for the user to review before generation. */
export function suggestVoicePrompt(spec: VoicePromptSpec): string {
  return `Deliver the following text as a ${spec.tone} ${spec.targetUse} voice.
Pacing: ${spec.pacing}. Emotion: ${spec.emotion}. Style: ${spec.deliveryStyle}.
${spec.pronunciationNotes ? `Pronunciation: ${spec.pronunciationNotes}\n` : ''}
Text to speak:
"${spec.scriptText}"`;
}
