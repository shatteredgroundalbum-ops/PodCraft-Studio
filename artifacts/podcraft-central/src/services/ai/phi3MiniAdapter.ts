import type { AIAdapter, AIAvailability, AIMessage, AIRequestOptions } from './types';

const MODEL_ID = 'Xenova/Phi-3-mini-4k-instruct';
export const PHI3_SIZE_MB = 2300;

const PODCAST_SYSTEM = `You are an expert podcast production assistant called AI Producer.
You help podcasters with planning, research, scripting, recording preparation, editing, and mastering.
Keep responses concise, actionable, and specific to podcast production.
Never make up facts or fabricate research sources.`;

export class Phi3MiniAdapter implements AIAdapter {
  readonly name = 'Phi-3 Mini (Local)';
  readonly description = `Built-in local AI — runs on your device, no API key needed. Requires ~2.3 GB download on first use.`;

  private _availability: AIAvailability = 'requires-download';
  private _pipeline: ((messages: AIMessage[], opts?: object) => Promise<unknown>) | null = null;
  private _loading = false;

  get availability(): AIAvailability {
    return this._availability;
  }

  async checkAvailability(): Promise<AIAvailability> {
    this._availability = 'requires-download';
    return this._availability;
  }

  get isLoaded(): boolean {
    return this._pipeline !== null;
  }

  get isLoading(): boolean {
    return this._loading;
  }

  async loadModel(onProgress?: (pct: number, status: string) => void): Promise<void> {
    if (this._pipeline) return;
    if (this._loading) return;
    this._loading = true;
    try {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.allowRemoteModels = true;
      env.useBrowserCache = true;

      this._pipeline = await pipeline('text-generation', MODEL_ID, {
        progress_callback: (info: { status: string; progress?: number; file?: string }) => {
          if (info.status === 'downloading' || info.status === 'progress') {
            onProgress?.(Math.round(info.progress ?? 0), `Downloading ${info.file ?? 'model'}…`);
          } else if (info.status === 'loading') {
            onProgress?.(99, 'Loading model into memory…');
          } else if (info.status === 'ready') {
            onProgress?.(100, 'Model ready');
          }
        },
      }) as (messages: AIMessage[], opts?: object) => Promise<unknown>;

      this._availability = 'available';
    } finally {
      this._loading = false;
    }
  }

  async prompt(messages: AIMessage[], options: AIRequestOptions = {}): Promise<string> {
    if (!this._pipeline) {
      throw new Error('Phi-3 Mini is not loaded. Download the model from Settings → AI Producer.');
    }
    const chatMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    const hasSystem = chatMessages.some((m) => m.role === 'system');
    if (!hasSystem) {
      chatMessages.unshift({ role: 'system', content: PODCAST_SYSTEM });
    }

    const result = await this._pipeline(chatMessages as AIMessage[], {
      max_new_tokens: options.maxTokens ?? 512,
      temperature: options.temperature ?? 0.7,
      do_sample: true,
      return_full_text: false,
    });

    const output = Array.isArray(result) ? result[0] : result;
    const text: string =
      (output as { generated_text?: string })?.generated_text?.trim() ?? String(output).trim();

    if (options.onChunk) options.onChunk(text);
    return text;
  }
}

export const phi3MiniAdapter = new Phi3MiniAdapter();
