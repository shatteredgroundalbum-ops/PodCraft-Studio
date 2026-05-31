import type {
  AIAdapter,
  AIAvailability,
  AIConfig,
  AIMessage,
  AIRequestOptions,
  AIProviderInfo,
  ByokProvider,
} from './types';
import { phi3MiniAdapter } from './phi3MiniAdapter';
import { geminiNanoAdapter } from './geminiNanoAdapter';
import { hybridAiRouter } from './hybridAiRouter';
import { ByokProviderAdapter, validateByokKey } from './byokProviderAdapter';

const NONE_INFO: AIProviderInfo = {
  name: 'No AI Provider',
  description: 'AI Producer is not configured. Go to Settings → AI Producer to set up.',
  availability: 'unavailable',
  setupInstructions: 'Open Settings → AI Producer to configure your AI provider.',
};

class AIProviderService {
  private _config: AIConfig = { mode: 'none', setupComplete: false };
  private _adapter: AIAdapter | null = null;
  private _availability: AIAvailability = 'unavailable';
  private _listeners = new Set<() => void>();

  configure(config: AIConfig): void {
    this._config = config;
    this._adapter = this._buildAdapter(config);
    if (config.mode === 'none' || !this._adapter) {
      this._availability = 'unavailable';
      this._notify();
      return;
    }
    this._adapter.checkAvailability().then((avail) => {
      this._availability = avail;
      this._notify();
    });
  }

  private _buildAdapter(config: AIConfig): AIAdapter | null {
    switch (config.mode) {
      case 'phi3':
        return phi3MiniAdapter;
      case 'gemini-nano':
        return geminiNanoAdapter;
      case 'hybrid':
        return hybridAiRouter;
      case 'byok':
        if (config.byokProvider && config.byokApiKey) {
          return new ByokProviderAdapter(
            config.byokProvider,
            config.byokApiKey,
            config.byokModel ?? ''
          );
        }
        return null;
      case 'none':
      default:
        return null;
    }
  }

  get config(): AIConfig { return this._config; }
  get availability(): AIAvailability { return this._availability; }
  get adapter(): AIAdapter | null { return this._adapter; }

  get providerInfo(): AIProviderInfo {
    if (!this._adapter || this._config.mode === 'none') return NONE_INFO;
    return {
      name: this._adapter.name,
      description: this._adapter.description,
      availability: this._availability,
      setupInstructions: this._availability === 'unavailable' ? NONE_INFO.setupInstructions : undefined,
    };
  }

  isAvailable(): boolean {
    if (this._config.mode === 'none') return false;
    return this._availability === 'available' || this._availability === 'requires-download';
  }

  async initialize(): Promise<void> {
    if (!this._adapter || this._config.mode === 'none') {
      this._availability = 'unavailable';
      this._notify();
      return;
    }
    this._availability = 'checking';
    this._notify();
    const avail = await this._adapter.checkAvailability();
    this._availability = avail;
    this._notify();
  }

  async prompt(messages: AIMessage[], options?: AIRequestOptions): Promise<string> {
    if (!this._adapter || this._config.mode === 'none') {
      throw new Error(NONE_INFO.setupInstructions ?? 'AI not configured.');
    }
    return this._adapter.prompt(messages, options);
  }

  async validateKey(provider: ByokProvider, key: string, model?: string) {
    return validateByokKey(provider, key, model);
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _notify(): void {
    this._listeners.forEach((l) => l());
  }
}

export const aiProviderService = new AIProviderService();
