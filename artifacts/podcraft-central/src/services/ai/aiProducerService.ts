import type { AIAvailability, AIMessage, AIRequestOptions, AIProviderInfo } from './types';
import { chromeAIAdapter } from './chromeAIAdapter';

const SETUP_INSTRUCTIONS = `To enable AI Producer:
1. Open Chrome 127 or later
2. Go to chrome://flags
3. Enable "Prompt API for Gemini Nano"
4. Enable "Optimization Guide On Device Model"
5. Restart Chrome
6. Reload this page

Or open this app directly in a standalone Chrome tab (not inside an iframe).`;

class AIProducerService {
  private _availability: AIAvailability = 'checking';
  private _listeners = new Set<() => void>();

  async initialize(): Promise<void> {
    this._availability = 'checking';
    this._notify();
    const avail = await chromeAIAdapter.checkAvailability();
    this._availability = avail;
    this._notify();
  }

  get availability(): AIAvailability {
    return this._availability;
  }

  get providerInfo(): AIProviderInfo {
    return {
      name: chromeAIAdapter.name,
      description: chromeAIAdapter.description,
      availability: this._availability,
      setupInstructions: this._availability === 'unavailable' ? SETUP_INSTRUCTIONS : undefined,
    };
  }

  isAvailable(): boolean {
    return this._availability === 'available' || this._availability === 'requires-download';
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _notify(): void {
    this._listeners.forEach((l) => l());
  }

  async chat(messages: AIMessage[], options?: AIRequestOptions): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI provider is not available. ' + (this.providerInfo.setupInstructions ?? ''));
    }
    return chromeAIAdapter.prompt(messages, options);
  }

  async quickPrompt(userMessage: string, onChunk?: (chunk: string) => void): Promise<string> {
    return this.chat([{ role: 'user', content: userMessage }], { onChunk });
  }
}

export const aiProducerService = new AIProducerService();
