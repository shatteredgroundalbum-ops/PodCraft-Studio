import type { AIAvailability, AIMessage, AIRequestOptions } from './types';

declare global {
  interface Window {
    ai?: {
      languageModel: {
        capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create(options?: {
          systemPrompt?: string;
          temperature?: number;
          topK?: number;
        }): Promise<ChromeAISession>;
      };
    };
  }
}

interface ChromeAISession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

const PODCAST_SYSTEM_PROMPT = `You are an expert podcast production assistant called AI Producer. 
You help podcasters with planning, research, scripting, recording preparation, editing, and mastering.
Keep responses concise, actionable, and specific to podcast production.
Never make up facts or fabricate research sources.
When discussing audio settings, use standard podcast production values.`;

export class ChromeAIAdapter {
  readonly name = 'Chrome AI (Gemini Nano)';
  readonly description = 'Browser-native AI — no API key required, works offline.';

  private _session: ChromeAISession | null = null;
  private _availability: AIAvailability = 'checking';

  async checkAvailability(): Promise<AIAvailability> {
    if (!('ai' in window) || !window.ai?.languageModel) {
      this._availability = 'unavailable';
      return 'unavailable';
    }
    try {
      const caps = await window.ai.languageModel.capabilities();
      if (caps.available === 'readily') {
        this._availability = 'available';
        return 'available';
      }
      if (caps.available === 'after-download') {
        this._availability = 'requires-download';
        return 'requires-download';
      }
      this._availability = 'unavailable';
      return 'unavailable';
    } catch {
      this._availability = 'unavailable';
      return 'unavailable';
    }
  }

  get availability(): AIAvailability {
    return this._availability;
  }

  private async getSession(): Promise<ChromeAISession> {
    if (this._session) return this._session;
    if (!window.ai?.languageModel) throw new Error('Chrome AI not available');
    this._session = await window.ai.languageModel.create({
      systemPrompt: PODCAST_SYSTEM_PROMPT,
      temperature: 0.7,
      topK: 40,
    });
    return this._session;
  }

  async prompt(messages: AIMessage[], options: AIRequestOptions = {}): Promise<string> {
    const session = await this.getSession();
    const userMessage = messages.filter((m) => m.role !== 'system').map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

    if (options.onChunk) {
      const stream = session.promptStreaming(userMessage);
      const reader = stream.getReader();
      let result = '';
      let prev = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const delta = value.slice(prev.length);
        prev = value;
        result += delta;
        options.onChunk(delta);
      }
      return result;
    }

    return session.prompt(userMessage);
  }

  destroySession(): void {
    this._session?.destroy();
    this._session = null;
  }
}

export const chromeAIAdapter = new ChromeAIAdapter();
