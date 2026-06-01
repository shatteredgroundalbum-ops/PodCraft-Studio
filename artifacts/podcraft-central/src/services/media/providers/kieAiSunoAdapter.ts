// ─── Kie.ai Suno Gateway Adapter ──────────────────────────────────────────────
// Third-party Suno-style music generation gateway via api.kie.ai
//
// ⚠️ IMPORTANT LABELS — ALWAYS DISPLAY TO USER:
// - This is a THIRD-PARTY GATEWAY integration, not an official Suno API.
// - This is NOT direct Suno account access.
// - Kie.ai is an independent service. Not affiliated with Suno.
// - Billing is to the user's Kie.ai account, not Suno directly.
// - PodCraft Central is not responsible for Kie.ai billing.
// - Commercial rights depend on the user's Kie.ai/Suno plan. Verify before publishing.
//
// Provider ID: 'kie-ai-suno'
// Docs: https://docs.kie.ai (Kie.ai developer documentation)

import type {
  MusicPromptSpec, GenerationResult, GeneratedMediaAsset,
  MediaGenerationError, ManualWorkflowGuide,
} from '../types';

export const KIE_AI_GATEWAY_NOTICE = `⚠️ Third-Party Gateway — Kie.ai is an independent Suno-style music generation gateway. This is not an official Suno API. Billing goes to your Kie.ai account. Commercial rights depend on your Kie.ai and Suno plan. Always verify rights before publishing.`;

const DEFAULT_BASE_URL = 'https://api.kie.ai';

function kieError(code: MediaGenerationError['code'], message: string, retryable = false): MediaGenerationError {
  return { code, message, provider: 'kie-ai-suno', retryable };
}

// ─── Submit + Poll ────────────────────────────────────────────────────────────

export async function generateKieAiMusic(
  apiKey: string,
  spec: MusicPromptSpec,
  baseUrl = DEFAULT_BASE_URL,
  projectId?: string,
  episodeId?: string,
): Promise<GenerationResult> {
  if (!apiKey?.trim()) {
    return { ok: false, error: kieError('not-configured', 'Kie.ai API key not configured.') };
  }

  const prompt = buildMusicPromptText(spec);

  // Step 1: Submit generation job
  let jobId: string;
  try {
    const res = await fetch(`${baseUrl}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        make_instrumental: !spec.isVocal,
        duration: spec.durationSeconds,
        model: 'chirp-v3-5',           // Kie.ai's Suno-compatible model
        title: `PodCraft ${spec.use}`,
        tags: buildMusicTags(spec),
      }),
    });

    if (res.status === 401) return { ok: false, error: kieError('invalid-api-key', 'Invalid Kie.ai API key.') };
    if (res.status === 429) return { ok: false, error: kieError('rate-limit-exceeded', 'Rate limit exceeded.', true) };
    if (res.status === 402) return { ok: false, error: kieError('insufficient-credits', 'Insufficient Kie.ai credits. Check your account.') };
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: kieError('generation-failed', `Kie.ai returned ${res.status}: ${body.slice(0, 200)}`) };
    }

    const data = await res.json() as { id?: string; task_id?: string };
    jobId = data.id ?? data.task_id ?? '';
    if (!jobId) {
      return { ok: false, error: kieError('unsupported-response', 'Kie.ai did not return a job ID. API may have changed.') };
    }
  } catch {
    return { ok: false, error: kieError('provider-unavailable', 'Could not reach Kie.ai. Check your network connection.', true) };
  }

  // Step 2: Poll for completion (up to 3 minutes, 10s interval)
  const maxAttempts = 18;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(10000);
    try {
      const pollRes = await fetch(`${baseUrl}/api/v1/feed/${jobId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!pollRes.ok) continue;

      const pollData = await pollRes.json() as {
        status?: string;
        audio_url?: string;
        clips?: Array<{ audio_url?: string; status?: string }>;
      };

      const audioUrl = pollData.audio_url ?? pollData.clips?.[0]?.audio_url;
      const status = pollData.status ?? pollData.clips?.[0]?.status ?? '';

      if (status === 'error' || status === 'failed') {
        return { ok: false, error: kieError('generation-failed', 'Kie.ai music generation failed. Try adjusting the prompt.') };
      }

      if (audioUrl && (status === 'complete' || status === 'streaming')) {
        // Step 3: Download audio
        const audioRes = await fetch(audioUrl).catch(() => null);
        if (!audioRes?.ok) {
          return { ok: false, error: kieError('asset-download-failed', 'Music generated but download failed. Try importing manually.') };
        }
        const audioBuffer = await audioRes.arrayBuffer();
        const base64 = arrayBufferToBase64(audioBuffer);
        const dataUri = `data:audio/mpeg;base64,${base64}`;

        const asset: GeneratedMediaAsset = {
          id: crypto.randomUUID(),
          assetType: 'music',
          provider: 'kie-ai-suno',
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
          rightsNote: 'THIRD-PARTY GATEWAY (Kie.ai). Commercial rights depend on your Kie.ai subscription and Suno\'s license terms. Verify before publishing.',
        };
        return { ok: true, asset };
      }
    } catch {
      // polling failed — continue
    }
  }

  return { ok: false, error: kieError('generation-failed', 'Music generation timed out after 3 minutes. Job may still be running on Kie.ai — check your account.', true) };
}

export async function validateKieAiKey(apiKey: string, baseUrl = DEFAULT_BASE_URL) {
  if (!apiKey?.trim()) return { ok: false, provider: 'kie-ai-suno', error: kieError('invalid-api-key', 'API key required.') };
  try {
    const res = await fetch(`${baseUrl}/api/v1/get-limit`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (res.status === 401) return { ok: false, provider: 'kie-ai-suno', error: kieError('invalid-api-key', 'Invalid Kie.ai API key.') };
    if (!res.ok) return { ok: false, provider: 'kie-ai-suno', error: kieError('provider-unavailable', `Kie.ai returned ${res.status}.`) };
    const data = await res.json() as { credits_left?: number; plan?: string };
    return { ok: true, provider: 'kie-ai-suno', plan: data.plan, creditsRemaining: data.credits_left };
  } catch {
    return { ok: false, provider: 'kie-ai-suno', error: kieError('provider-unavailable', 'Could not reach Kie.ai.', true) };
  }
}

// ─── Manual Fallback Guide ────────────────────────────────────────────────────

export function getKieAiManualGuide(prompt: string): ManualWorkflowGuide {
  return {
    prompt,
    steps: [
      { step: 1, action: 'Copy the prompt above.' },
      { step: 2, action: 'Open kie.ai in your browser.', detail: 'https://kie.ai' },
      { step: 3, action: 'Create a new music generation with the copied prompt.' },
      { step: 4, action: 'Download the generated audio file.' },
      { step: 5, action: 'Return to PodCraft Central → Media Library → Upload.', detail: 'Import the downloaded file and confirm rights before use.' },
    ],
    providerWebsiteUrl: 'https://kie.ai',
    importNote: 'After import, confirm your usage rights in the asset settings before placing in a final mix.',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function buildMusicPromptText(spec: MusicPromptSpec): string {
  return [
    `Genre: ${spec.genre}`,
    `Mood: ${spec.mood}`,
    `Tempo: ${spec.tempo}`,
    `Instrumentation: ${spec.instrumentation}`,
    spec.isVocal ? 'with vocals' : 'instrumental only',
    `Use: podcast ${spec.use}`,
    `Duration: approximately ${spec.durationSeconds} seconds`,
    spec.avoidOverpoweringSpeech ? 'Keep volume modest — must not overpower spoken word' : null,
    `Episode type: ${spec.episodeType}`,
    spec.commercialUse ? 'intended for commercial podcast distribution' : 'personal use',
  ].filter(Boolean).join('. ');
}

function buildMusicTags(spec: MusicPromptSpec): string {
  return [spec.genre, spec.mood, spec.tempo, spec.isVocal ? 'vocals' : 'instrumental', 'podcast'].join(', ');
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
