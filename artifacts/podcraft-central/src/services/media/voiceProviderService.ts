// ─── Voice Provider Service ───────────────────────────────────────────────────
// Category-level service. AI Producer and React components call this — NOT adapters directly.

import type {
  VoicePromptSpec, GenerationResult, VoiceListResult, ProviderValidationResult,
  MediaProviderConfig,
} from './types';
import {
  validateElevenLabsKey, getElevenLabsVoices, generateElevenLabsVoice,
  suggestVoicePrompt,
} from './providers/elevenLabsVoiceAdapter';
import {
  getManualVoiceWorkflow,
} from './providers/manualWorkflowAdapter';

export class VoiceProviderService {

  /** Validate API key for the configured provider. */
  async validateProvider(config: MediaProviderConfig): Promise<ProviderValidationResult> {
    switch (config.id) {
      case 'elevenlabs':
        return validateElevenLabsKey(config.apiKey ?? '');
      default:
        return { ok: false, provider: config.id, error: { code: 'not-configured', message: `Unknown voice provider: ${config.id}` } };
    }
  }

  /** Fetch available voices from the active provider. */
  async listVoices(config: MediaProviderConfig): Promise<VoiceListResult> {
    switch (config.id) {
      case 'elevenlabs':
        return getElevenLabsVoices(config.apiKey ?? '');
      default:
        return { ok: false, error: { code: 'not-configured', message: `Voice list not supported for: ${config.id}` } };
    }
  }

  /**
   * Generate a voice asset.
   * If no provider is configured, returns the manual workflow guide as a prompt string.
   */
  async generate(
    spec: VoicePromptSpec,
    config: MediaProviderConfig | null,
    projectId?: string,
    episodeId?: string,
  ): Promise<GenerationResult> {
    if (!config) {
      const guide = getManualVoiceWorkflow(spec);
      return {
        ok: false,
        error: { code: 'not-configured', message: 'No voice provider configured. Use the manual workflow below.' },
        manualWorkflowPrompt: suggestVoicePrompt(spec),
      };
    }
    switch (config.id) {
      case 'elevenlabs':
        return generateElevenLabsVoice(config.apiKey ?? '', spec, projectId, episodeId);
      default:
        return {
          ok: false,
          error: { code: 'not-configured', message: `Unsupported voice provider: ${config.id}` },
          manualWorkflowPrompt: suggestVoicePrompt(spec),
        };
    }
  }

  /** Generate a suggested prompt string for user review/edit before generation. */
  suggestPrompt(spec: VoicePromptSpec): string {
    return suggestVoicePrompt(spec);
  }
}

export const voiceProviderService = new VoiceProviderService();
