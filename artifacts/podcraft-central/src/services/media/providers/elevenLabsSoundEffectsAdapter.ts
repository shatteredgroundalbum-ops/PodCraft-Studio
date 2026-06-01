// ─── ElevenLabs Sound Effects Adapter ────────────────────────────────────────
// Official ElevenLabs REST API — Sound Generation endpoint
// Use cases: stingers, scene transitions, ambience, Foley, impact sounds,
//            suspense effects, environment sounds, podcast branding sounds
//
// Rules:
// - User provides their own API key.
// - Rights depend on ElevenLabs subscription plan.
// - No silent failures — every error is surfaced.

import type {
  SfxPromptSpec, GenerationResult, GeneratedMediaAsset,
  MediaGenerationError,
} from '../types';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

function sfxError(code: MediaGenerationError['code'], message: string, retryable = false): MediaGenerationError {
  return { code, message, provider: 'elevenlabs-sfx', retryable };
}

export async function generateElevenLabsSfx(
  apiKey: string,
  spec: SfxPromptSpec,
  projectId?: string,
  episodeId?: string,
): Promise<GenerationResult> {
  if (!apiKey?.trim()) {
    return { ok: false, error: sfxError('not-configured', 'ElevenLabs API key not configured.') };
  }

  const prompt = buildSfxPromptText(spec);

  try {
    const res = await fetch(`${ELEVENLABS_BASE}/sound-generation`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: Math.min(spec.durationSeconds, 22),  // ElevenLabs SFX max ~22s
        prompt_influence: 0.3,
      }),
    });

    if (res.status === 401) return { ok: false, error: sfxError('invalid-api-key', 'Invalid API key.') };
    if (res.status === 429) return { ok: false, error: sfxError('rate-limit-exceeded', 'Rate limit exceeded. Try again shortly.', true) };
    if (res.status === 402) return { ok: false, error: sfxError('insufficient-credits', 'Insufficient ElevenLabs credits.') };
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: sfxError('generation-failed', `ElevenLabs SFX returned ${res.status}: ${body.slice(0, 200)}`) };
    }

    const audioBuffer = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(audioBuffer);
    const dataUri = `data:audio/mpeg;base64,${base64}`;

    const asset: GeneratedMediaAsset = {
      id: crypto.randomUUID(),
      assetType: spec.soundType.toLowerCase().includes('music') ? 'transition' : 'sound-effect',
      provider: 'elevenlabs-sfx',
      providerCategory: 'sound-effects',
      prompt,
      generatedAt: new Date().toISOString(),
      projectId,
      episodeId,
      fileName: `sfx-${spec.soundType.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.mp3`,
      fileFormat: 'mp3',
      durationSeconds: spec.durationSeconds,
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
    return { ok: false, error: sfxError('provider-unavailable', 'Could not reach ElevenLabs.', true) };
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function buildSfxPromptText(spec: SfxPromptSpec): string {
  return [
    spec.soundType,
    spec.environment !== 'unspecified' ? `in ${spec.environment} environment` : null,
    spec.intensity !== 'moderate' ? `${spec.intensity} intensity` : null,
    spec.realismLevel !== 'realistic' ? `${spec.realismLevel} style` : null,
    spec.podcastContext ? `for ${spec.podcastContext}` : null,
  ].filter(Boolean).join(', ');
}

export function suggestSfxPrompt(spec: SfxPromptSpec): string {
  return [
    `Sound: ${spec.soundType}`,
    `Environment: ${spec.environment}`,
    `Duration: ${spec.durationSeconds}s`,
    `Intensity: ${spec.intensity}`,
    `Realism: ${spec.realismLevel}`,
    `Context: ${spec.podcastContext}`,
    `Purpose: ${spec.timingPurpose}`,
  ].join('\n');
}
