import type { AIAvailability, AIMessage, AIRequestOptions, AIProviderInfo } from './types';
import { aiProviderService } from './aiProviderService';

class AIProducerService {
  async initialize(): Promise<void> {
    return aiProviderService.initialize();
  }

  get availability(): AIAvailability {
    return aiProviderService.availability;
  }

  get providerInfo(): AIProviderInfo {
    return aiProviderService.providerInfo;
  }

  isAvailable(): boolean {
    return aiProviderService.isAvailable();
  }

  subscribe(listener: () => void): () => void {
    return aiProviderService.subscribe(listener);
  }

  async chat(messages: AIMessage[], options?: AIRequestOptions): Promise<string> {
    return aiProviderService.prompt(messages, options);
  }

  async quickPrompt(userMessage: string, onChunk?: (chunk: string) => void): Promise<string> {
    return this.chat([{ role: 'user', content: userMessage }], { onChunk });
  }
}

export const aiProducerService = new AIProducerService();
