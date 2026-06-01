// ─── Media Services Hub ───────────────────────────────────────────────────────
// The single entry point for all external audio generation.
//
// AI Producer calls the Hub. React components call the Hub.
// Nobody calls provider adapters directly.
//
// Rules:
// - No generated asset enters the mix without user rights confirmation.
// - No silent failures — every result has ok/error.
// - Gateway providers are always labeled as third-party integrations.
// - API keys come from the caller — the Hub does not store secrets itself.

import type {
  HubGenerateRequest, GenerationResult, VoiceListResult,
  ProviderValidationResult, MediaProviderConfig, ManualWorkflowGuide,
  MusicPromptSpec, SfxPromptSpec, VoicePromptSpec,
} from './types';
import { voiceProviderService } from './voiceProviderService';
import { soundEffectsProviderService } from './soundEffectsProviderService';
import { musicProviderService } from './musicProviderService';
import { getManualMusicWorkflow, getManualSfxWorkflow, getManualVoiceWorkflow } from './providers/manualWorkflowAdapter';
import { buildMusicPromptText } from './providers/kieAiSunoAdapter';
import { buildSfxPromptText } from './providers/elevenLabsSoundEffectsAdapter';
import { suggestVoicePrompt } from './providers/elevenLabsVoiceAdapter';

// ─── Provider Registry ────────────────────────────────────────────────────────
// Static metadata about all supported providers. Configs (with API keys)
// are stored in IndexedDB by MediaProviderStore.

export const PROVIDER_REGISTRY: Array<Omit<MediaProviderConfig, 'status' | 'statusMessage' | 'validatedAt' | 'updatedAt' | 'apiKey' | 'endpointBaseUrl' | 'selectedModel' | 'defaultFor'>> = [
  // ── Voice ──────────────────────────────────────────────────────────────────
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    category: 'voice',
    isThirdPartyGateway: false,
    isOfficialApi: true,
    termsUrl: 'https://elevenlabs.io/terms',
    pricingUrl: 'https://elevenlabs.io/pricing',
  },
  // ── Sound Effects ──────────────────────────────────────────────────────────
  {
    id: 'elevenlabs-sfx',
    name: 'ElevenLabs Sound Effects',
    category: 'sound-effects',
    isThirdPartyGateway: false,
    isOfficialApi: true,
    termsUrl: 'https://elevenlabs.io/terms',
    pricingUrl: 'https://elevenlabs.io/pricing',
  },
  // ── Music ──────────────────────────────────────────────────────────────────
  {
    id: 'kie-ai-suno',
    name: 'Kie.ai (Suno Gateway)',
    category: 'music',
    isThirdPartyGateway: true,
    isOfficialApi: false,
    termsUrl: 'https://kie.ai/terms',
    pricingUrl: 'https://kie.ai/pricing',
  },
  {
    id: 'musicapi-suno',
    name: 'MusicAPI (Suno-style)',
    category: 'music',
    isThirdPartyGateway: true,
    isOfficialApi: false,
    termsUrl: 'https://musicapi.lol/terms',
    pricingUrl: 'https://musicapi.lol/pricing',
  },
  {
    id: 'manual',
    name: 'Manual Workflow',
    category: 'music',
    isThirdPartyGateway: false,
    isOfficialApi: false,
    termsUrl: undefined,
    pricingUrl: undefined,
  },
];

export function getProviderMeta(id: string) {
  return PROVIDER_REGISTRY.find(p => p.id === id);
}

// ─── Hub ─────────────────────────────────────────────────────────────────────

class MediaServicesHub {

  // ── Validation ──────────────────────────────────────────────────────────────

  async validateProvider(config: MediaProviderConfig): Promise<ProviderValidationResult> {
    switch (config.category) {
      case 'voice':         return voiceProviderService.validateProvider(config);
      case 'sound-effects': return soundEffectsProviderService.validateProvider(config);
      case 'music':         return musicProviderService.validateProvider(config);
      default:
        return { ok: false, provider: config.id, error: { code: 'not-configured', message: `Category ${config.category} validation not yet implemented.` } };
    }
  }

  // ── Voice List ──────────────────────────────────────────────────────────────

  async listVoices(voiceConfig: MediaProviderConfig | null): Promise<VoiceListResult> {
    if (!voiceConfig) return { ok: false, error: { code: 'not-configured', message: 'No voice provider configured.' } };
    return voiceProviderService.listVoices(voiceConfig);
  }

  // ── Generate ────────────────────────────────────────────────────────────────

  async generate(
    request: HubGenerateRequest,
    configs: { voice?: MediaProviderConfig | null; sfx?: MediaProviderConfig | null; music?: MediaProviderConfig | null },
    projectId?: string,
    episodeId?: string,
  ): Promise<GenerationResult> {
    switch (request.category) {
      case 'voice':
        return voiceProviderService.generate(request.spec, configs.voice ?? null, projectId, episodeId);
      case 'sound-effects':
        return soundEffectsProviderService.generate(request.spec, configs.sfx ?? null, projectId, episodeId);
      case 'music':
        return musicProviderService.generate(request.spec, configs.music ?? null, projectId, episodeId);
    }
  }

  // ── Prompt Suggestion ───────────────────────────────────────────────────────
  // AI Producer calls these to generate a prompt for user review before generation.

  suggestMusicPrompt(spec: MusicPromptSpec): string {
    return buildMusicPromptText(spec);
  }

  suggestSfxPrompt(spec: SfxPromptSpec): string {
    return buildSfxPromptText(spec);
  }

  suggestVoicePrompt(spec: VoicePromptSpec): string {
    return suggestVoicePrompt(spec);
  }

  // ── Manual Workflows ────────────────────────────────────────────────────────

  getManualWorkflow(
    category: 'music' | 'sound-effects' | 'voice',
    spec: MusicPromptSpec | SfxPromptSpec | VoicePromptSpec,
    providerId?: string,
  ): ManualWorkflowGuide {
    switch (category) {
      case 'music':
        return musicProviderService.getManualWorkflow(spec as MusicPromptSpec, providerId);
      case 'sound-effects':
        return soundEffectsProviderService.getManualWorkflow(spec as SfxPromptSpec);
      case 'voice':
        return getManualVoiceWorkflow(spec as VoicePromptSpec);
    }
  }
}

export const mediaServicesHub = new MediaServicesHub();
