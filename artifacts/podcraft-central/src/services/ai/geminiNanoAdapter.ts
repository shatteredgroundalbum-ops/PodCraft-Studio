import type { AIAdapter, AIAvailability, AIMessage, AIRequestOptions } from './types';

declare global {
  interface Window {
    ai?: {
      languageModel: {
        capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create(options?: {
          systemPrompt?: string;
          temperature?: number;
          topK?: number;
        }): Promise<GeminiNanoSession>;
      };
    };
  }
}

interface GeminiNanoSession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

const PODCAST_SYSTEM = `You are an expert podcast production assistant called AI Producer.
You help podcasters with planning, research, scripting, recording preparation, editing, and mastering.
Keep responses concise, actionable, and specific to podcast production.
Never make up facts or fabricate research sources.`;

export class GeminiNanoAdapter implements AIAdapter {
  readonly name = 'Gemini Nano (Device AI)';
  readonly description = 'Chrome built-in AI — on-device, no API key needed. Only available in Chrome 127+ with the feature enabled.';

  private _availability: AIAvailability = 'checking';
  private _session: GeminiNanoSession | null = null;

  get availability(): AIAvailability {
    return this._availability;
  }

  async checkAvailability(): Promise<AIAvailability> {
    if (!('ai' in window) || !window.ai?.languageModel) {
      this._availability = 'unavailable';
      return 'unavailable';
    }
    try {
      const caps = await window.ai.languageModel.capabilities();
      if (caps.available === 'readily') {
        this._availability = 'available';
      } else if (caps.available === 'after-download') {
        this._availability = 'requires-download';
      } else {
        this._availability = 'unavailable';
      }
    } catch {
      this._availability = 'unavailable';
    }
    return this._availability;
  }

  private async getSession(): Promise<GeminiNanoSession> {
    if (this._session) return this._session;
    if (!window.ai?.languageModel) throw new Error('Gemini Nano not available on this device/browser.');
    this._session = await window.ai.languageModel.create({
      systemPrompt: PODCAST_SYSTEM,
      temperature: 0.7,
      topK: 40,
    });
    return this._session;
  }

  async prompt(messages: AIMessage[], options: AIRequestOptions = {}): Promise<string> {
    const session = await this.getSession();
    const userContent = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    if (options.onChunk) {
      const stream = session.promptStreaming(userContent);
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

    return session.prompt(userContent);
  }

  destroySession(): void {
    this._session?.destroy();
    this._session = null;
  }
}

export const geminiNanoAdapter = new GeminiNanoAdapter();
