// ─── Sound Effects Provider Service ──────────────────────────────────────────
// Category-level service. Call this — not adapters directly.

import type {
  SfxPromptSpec, GenerationResult, ProviderValidationResult, MediaProviderConfig,
} from './types';
import {
  validateElevenLabsKey,
} from './providers/elevenLabsVoiceAdapter';
import {
  generateElevenLabsSfx, suggestSfxPrompt,
} from './providers/elevenLabsSoundEffectsAdapter';
import { getManualSfxWorkflow } from './providers/manualWorkflowAdapter';

export class SoundEffectsProviderService {

  async validateProvider(config: MediaProviderConfig): Promise<ProviderValidationResult> {
    switch (config.id) {
      case 'elevenlabs-sfx':
        // SFX uses the same ElevenLabs key as voice
        return validateElevenLabsKey(config.apiKey ?? '');
      default:
        return { ok: false, provider: config.id, error: { code: 'not-configured', message: `Unknown SFX provider: ${config.id}` } };
    }
  }

  async generate(
    spec: SfxPromptSpec,
    config: MediaProviderConfig | null,
    projectId?: string,
    episodeId?: string,
  ): Promise<GenerationResult> {
    if (!config) {
      return {
        ok: false,
        error: { code: 'not-configured', message: 'No SFX provider configured. Use the manual workflow below.' },
        manualWorkflowPrompt: suggestSfxPrompt(spec),
      };
    }
    switch (config.id) {
      case 'elevenlabs-sfx':
        return generateElevenLabsSfx(config.apiKey ?? '', spec, projectId, episodeId);
      default:
        return {
          ok: false,
          error: { code: 'not-configured', message: `Unsupported SFX provider: ${config.id}` },
          manualWorkflowPrompt: suggestSfxPrompt(spec),
        };
    }
  }

  suggestPrompt(spec: SfxPromptSpec): string {
    return suggestSfxPrompt(spec);
  }

  /** Manual workflow for unsupported providers or fallback. */
  getManualWorkflow(spec: SfxPromptSpec) {
    return getManualSfxWorkflow(suggestSfxPrompt(spec));
  }
}

export const soundEffectsProviderService = new SoundEffectsProviderService();
