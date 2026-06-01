// ─── Music Provider Service ───────────────────────────────────────────────────
// Category-level service. Call this — not adapters directly.
//
// IMPORTANT: Direct Suno API is not publicly available to regular users.
// Music generation uses third-party Suno-compatible gateways or manual workflow.
// Labels must always indicate when a gateway is a third-party service.

import type {
  MusicPromptSpec, GenerationResult, ProviderValidationResult, MediaProviderConfig,
} from './types';
import { validateElevenLabsKey } from './providers/elevenLabsVoiceAdapter';
import { generateKieAiMusic, validateKieAiKey, getKieAiManualGuide, buildMusicPromptText } from './providers/kieAiSunoAdapter';
import { generateMusicApiTrack, validateMusicApiKey, getMusicApiManualGuide } from './providers/musicApiSunoAdapter';
import { getManualMusicWorkflow, buildManualMusicPrompt } from './providers/manualWorkflowAdapter';

export class MusicProviderService {

  async validateProvider(config: MediaProviderConfig): Promise<ProviderValidationResult> {
    switch (config.id) {
      case 'elevenlabs-music':
        return validateElevenLabsKey(config.apiKey ?? '');
      case 'kie-ai-suno':
        return validateKieAiKey(config.apiKey ?? '', config.endpointBaseUrl);
      case 'musicapi-suno':
        return validateMusicApiKey(config.apiKey ?? '', config.endpointBaseUrl);
      default:
        return { ok: false, provider: config.id, error: { code: 'not-configured', message: `Unknown music provider: ${config.id}` } };
    }
  }

  async generate(
    spec: MusicPromptSpec,
    config: MediaProviderConfig | null,
    projectId?: string,
    episodeId?: string,
  ): Promise<GenerationResult> {
    const prompt = buildMusicPromptText(spec);

    if (!config) {
      return {
        ok: false,
        error: { code: 'not-configured', message: 'No music provider configured. Use the manual workflow below.' },
        manualWorkflowPrompt: prompt,
      };
    }

    switch (config.id) {
      case 'kie-ai-suno':
        return generateKieAiMusic(config.apiKey ?? '', spec, config.endpointBaseUrl, projectId, episodeId);
      case 'musicapi-suno':
        return generateMusicApiTrack(config.apiKey ?? '', spec, config.endpointBaseUrl, projectId, episodeId);
      case 'manual':
        return {
          ok: false,
          error: { code: 'not-configured', message: 'Manual workflow selected. Follow the steps below.' },
          manualWorkflowPrompt: prompt,
        };
      default:
        return {
          ok: false,
          error: { code: 'not-configured', message: `Unsupported music provider: ${config.id}` },
          manualWorkflowPrompt: prompt,
        };
    }
  }

  /** Generate a music prompt string for user review before generation. */
  suggestPrompt(spec: MusicPromptSpec): string {
    return buildMusicPromptText(spec);
  }

  /** Get the manual workflow guide for the given provider. */
  getManualWorkflow(spec: MusicPromptSpec, providerId?: string) {
    const prompt = buildManualMusicPrompt(spec);
    switch (providerId) {
      case 'kie-ai-suno':   return getKieAiManualGuide(prompt);
      case 'musicapi-suno': return getMusicApiManualGuide(prompt);
      default:              return getManualMusicWorkflow(prompt);
    }
  }
}

export const musicProviderService = new MusicProviderService();
