// ─── MusicAPI Suno-Style Gateway Adapter ──────────────────────────────────────
// Third-party Suno-compatible music generation via MusicAPI
//
// ⚠️ THIRD-PARTY GATEWAY — NOT an official Suno API.
// MusicAPI is an independent service that provides Suno-style generation.
// Billing is to the user's MusicAPI account. Not affiliated with Suno.
// Commercial rights depend on MusicAPI plan and Suno license terms.
//
// Provider ID: 'musicapi-suno'
// Docs: https://musicapi.lol (MusicAPI developer documentation)

import type {
  MusicPromptSpec, GenerationResult, GeneratedMediaAsset,
  MediaGenerationError, ManualWorkflowGuide,
} from '../types';
import { buildMusicPromptText } from './kieAiSunoAdapter';

export const MUSICAPI_GATEWAY_NOTICE = `⚠️ Third-Party Gateway — MusicAPI is an independent Suno-compatible music generation service. Not an official Suno API. Billing goes to your MusicAPI account. Verify commercial rights before publishing.`;

const DEFAULT_BASE_URL = 'https://musicapi.lol';

function musicApiError(code: MediaGenerationError['code'], message: string, retryable = false): MediaGenerationError {
  return { code, message, provider: 'musicapi-suno', retryable };
}

export async function validateMusicApiKey(apiKey: string, baseUrl = DEFAULT_BASE_URL) {
  if (!apiKey?.trim()) return { ok: false, provider: 'musicapi-suno', error: musicApiError('invalid-api-key', 'API key required.') };
  try {
    const res = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'X-API-Key': apiKey },
    });
    if (res.status === 401) return { ok: false, provider: 'musicapi-suno', error: musicApiError('invalid-api-key', 'Invalid MusicAPI key.') };
    if (!res.ok) return { ok: false, provider: 'musicapi-suno', error: musicApiError('provider-unavailable', `MusicAPI returned ${res.status}.`) };
    const data = await res.json() as { plan?: string; credits?: number };
    return { ok: true, provider: 'musicapi-suno', plan: data.plan, creditsRemaining: data.credits };
  } catch {
    return { ok: false, provider: 'musicapi-suno', error: musicApiError('provider-unavailable', 'Could not reach MusicAPI.', true) };
  }
}

export async function generateMusicApiTrack(
  apiKey: string,
  spec: MusicPromptSpec,
  baseUrl = DEFAULT_BASE_URL,
  projectId?: string,
  episodeId?: string,
): Promise<GenerationResult> {
  if (!apiKey?.trim()) {
    return { ok: false, error: musicApiError('not-configured', 'MusicAPI key not configured.') };
  }

  const prompt = buildMusicPromptText(spec);

  try {
    const res = await fetch(`${baseUrl}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        instrumental: !spec.isVocal,
        duration: spec.durationSeconds,
      }),
    });

    if (res.status === 401) return { ok: false, error: musicApiError('invalid-api-key', 'Invalid MusicAPI key.') };
    if (res.status === 429) return { ok: false, error: musicApiError('rate-limit-exceeded', 'Rate limit exceeded.', true) };
    if (res.status === 402) return { ok: false, error: musicApiError('insufficient-credits', 'Insufficient MusicAPI credits.') };
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: musicApiError('generation-failed', `MusicAPI returned ${res.status}: ${body.slice(0, 200)}`) };
    }

    const data = await res.json() as { id?: string; audio_url?: string; status?: string };

    // If audio URL is returned immediately
    if (data.audio_url) {
      return await downloadAndWrap(data.audio_url, data.id, prompt, spec, projectId, episodeId);
    }

    // Otherwise poll by job ID
    const jobId = data.id ?? '';
    if (!jobId) return { ok: false, error: musicApiError('unsupported-response', 'MusicAPI did not return a job ID.') };

    for (let i = 0; i < 18; i++) {
      await sleep(10000);
      try {
        const poll = await fetch(`${baseUrl}/api/v1/feed/${jobId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'X-API-Key': apiKey },
        });
        if (!poll.ok) continue;
        const pd = await poll.json() as { audio_url?: string; status?: string };
        if (pd.status === 'error') return { ok: false, error: musicApiError('generation-failed', 'MusicAPI generation failed.') };
        if (pd.audio_url) return await downloadAndWrap(pd.audio_url, jobId, prompt, spec, projectId, episodeId);
      } catch { /* continue polling */ }
    }

    return { ok: false, error: musicApiError('generation-failed', 'MusicAPI generation timed out.', true) };
  } catch {
    return { ok: false, error: musicApiError('provider-unavailable', 'Could not reach MusicAPI.', true) };
  }
}

async function downloadAndWrap(
  audioUrl: string,
  jobId: string | undefined,
  prompt: string,
  spec: MusicPromptSpec,
  projectId?: string,
  episodeId?: string,
): Promise<GenerationResult> {
  const audioRes = await fetch(audioUrl).catch(() => null);
  if (!audioRes?.ok) {
    return { ok: false, error: { code: 'asset-download-failed', message: 'Music generated but audio download failed.', provider: 'musicapi-suno' } };
  }
  const buf = await audioRes.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const dataUri = `data:audio/mpeg;base64,${btoa(binary)}`;

  const asset: GeneratedMediaAsset = {
    id: crypto.randomUUID(),
    assetType: 'music',
    provider: 'musicapi-suno',
    providerCategory: 'music',
    prompt,
    generatedAt: new Date().toISOString(),
    projectId,
    episodeId,
    fileName: `music-${spec.use}-${Date.now()}.mp3`,
    fileFormat: 'mp3',
    durationSeconds: spec.durationSeconds,
    licenseStatus: 'not-confirmed',
    commercialRightsStatus: 'not-confirmed',
    userConfirmedRights: false,
    sourceUrl: audioUrl,
    providerJobId: jobId,
    localBlob: dataUri,
    importedToMediaLibrary: false,
    placedInDAW: false,
    rightsNote: 'THIRD-PARTY GATEWAY (MusicAPI). Commercial rights depend on your MusicAPI plan and Suno license terms. Verify before publishing.',
  };
  return { ok: true, asset };
}

export function getMusicApiManualGuide(prompt: string): ManualWorkflowGuide {
  return {
    prompt,
    steps: [
      { step: 1, action: 'Copy the prompt above.' },
      { step: 2, action: 'Open MusicAPI or the provider\'s web interface.', detail: 'https://musicapi.lol' },
      { step: 3, action: 'Submit the prompt and generate your track.' },
      { step: 4, action: 'Download the generated audio file.' },
      { step: 5, action: 'Import into PodCraft Central Media Library and confirm rights.' },
    ],
    providerWebsiteUrl: 'https://musicapi.lol',
    importNote: 'Confirm commercial rights before placing in any final mix.',
  };
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
