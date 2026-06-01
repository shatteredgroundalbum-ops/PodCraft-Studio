// ─── Manual Workflow Adapter ─────────────────────────────────────────────────
// For providers without a supported API, the AI Producer generates a prompt,
// the user generates audio manually at the provider's website, then imports it.
//
// This adapter:
// - Generates the provider-specific prompt
// - Returns a step-by-step workflow guide
// - Accepts a manually uploaded file and wraps it as a GeneratedMediaAsset
// - Tracks rights metadata
//
// No API key required. No external calls. Works offline.

import type {
  MusicPromptSpec, SfxPromptSpec, VoicePromptSpec,
  ManualWorkflowGuide, GeneratedMediaAsset, MediaAssetType, MediaProviderCategory,
} from '../types';
import { buildMusicPromptText } from './kieAiSunoAdapter';
import { buildSfxPromptText } from './elevenLabsSoundEffectsAdapter';
import { buildVoicePromptString } from './elevenLabsVoiceAdapter';

// ─── Prompt generation ────────────────────────────────────────────────────────

export function buildManualMusicPrompt(spec: MusicPromptSpec): string {
  return buildMusicPromptText(spec);
}

export function buildManualSfxPrompt(spec: SfxPromptSpec): string {
  return buildSfxPromptText(spec);
}

export function buildManualVoicePrompt(spec: VoicePromptSpec): string {
  return buildVoicePromptString(spec);
}

// ─── Workflow guides ──────────────────────────────────────────────────────────

export function getManualMusicWorkflow(prompt: string, providerName = 'your music provider'): ManualWorkflowGuide {
  return {
    prompt,
    steps: [
      { step: 1, action: 'Copy the prompt above — AI Producer generated it for this episode.' },
      { step: 2, action: `Open ${providerName} in your browser.`, detail: 'Suno (suno.com), Udio, or another music tool.' },
      { step: 3, action: 'Paste the prompt and generate your track.' },
      { step: 4, action: 'Listen and optionally refine with the prompt or regenerate.' },
      { step: 5, action: 'Download the generated audio (MP3 or WAV preferred).' },
      { step: 6, action: 'Return to PodCraft Central → Media Library → Upload.', detail: 'Drag and drop or browse to import.' },
      { step: 7, action: 'Confirm usage rights in the asset panel before using in a final mix.' },
    ],
    providerWebsiteUrl: 'https://suno.com',
    importNote: 'Store the original prompt with the asset. Confirm commercial rights before publishing.',
  };
}

export function getManualSfxWorkflow(prompt: string): ManualWorkflowGuide {
  return {
    prompt,
    steps: [
      { step: 1, action: 'Copy the prompt above.' },
      { step: 2, action: 'Open ElevenLabs Sound Effects, Freesound, or a sound design tool.' },
      { step: 3, action: 'Generate or search for the described sound.' },
      { step: 4, action: 'Download the audio file.' },
      { step: 5, action: 'Import into PodCraft Central Media Library.' },
      { step: 6, action: 'Confirm license and rights before use.' },
    ],
    providerWebsiteUrl: 'https://elevenlabs.io/sound-effects',
    importNote: 'Note the source and license for every sound effect.',
  };
}

export function getManualVoiceWorkflow(spec: VoicePromptSpec): ManualWorkflowGuide {
  return {
    prompt: buildVoicePromptString(spec),
    steps: [
      { step: 1, action: 'Copy the script and delivery instructions above.' },
      { step: 2, action: 'Open your TTS tool (ElevenLabs, Eleven.io, etc.).' },
      { step: 3, action: 'Select a voice and paste the script.' },
      { step: 4, action: 'Adjust tone and delivery settings to match the spec.' },
      { step: 5, action: 'Download the generated audio.' },
      { step: 6, action: 'Import into PodCraft Central Media Library.' },
      { step: 7, action: 'Confirm AI voice usage rights (do not impersonate real persons).' },
    ],
    providerWebsiteUrl: 'https://elevenlabs.io',
    importNote: 'All AI voice assets must be labeled. Never impersonate a real person without authorization.',
  };
}

// ─── Manual import wrapper ────────────────────────────────────────────────────

/** Wrap a manually uploaded File as a GeneratedMediaAsset for tracking. */
export function wrapManualUpload(
  file: File,
  prompt: string,
  assetType: MediaAssetType,
  category: MediaProviderCategory,
  providerName: string,
  projectId?: string,
  episodeId?: string,
): GeneratedMediaAsset {
  return {
    id: crypto.randomUUID(),
    assetType,
    provider: `manual:${providerName}`,
    providerCategory: category,
    prompt,
    generatedAt: new Date().toISOString(),
    projectId,
    episodeId,
    fileName: file.name,
    fileFormat: file.name.split('.').pop()?.toLowerCase() ?? 'unknown',
    licenseStatus: 'not-confirmed',
    commercialRightsStatus: 'not-confirmed',
    userConfirmedRights: false,
    importedToMediaLibrary: false,
    placedInDAW: false,
    rightsNote: `Manually imported from ${providerName}. Rights Not Confirmed — verify before publishing.`,
  };
}
