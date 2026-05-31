import type { AIAdapter, AIAvailability, AIMessage, AIRequestOptions, ByokProvider } from './types';
import { BYOK_PROVIDER_NAMES } from './types';

async function readSSE(
  response: Response,
  onChunk: (text: string) => void,
  extractDelta: (data: unknown) => string
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const delta = extractDelta(JSON.parse(payload));
        if (delta) {
          full += delta;
          onChunk(delta);
        }
      } catch { /* skip malformed lines */ }
    }
  }
  return full;
}

class OpenAICompatAdapter implements AIAdapter {
  private _availability: AIAvailability = 'checking';
  constructor(
    readonly name: string,
    readonly description: string,
    private _baseUrl: string,
    private _apiKey: string,
    private _model: string,
    private _extraHeaders: Record<string, string> = {}
  ) {}

  get availability(): AIAvailability { return this._availability; }

  async checkAvailability(): Promise<AIAvailability> {
    try {
      const res = await fetch(`${this._baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this._apiKey}`, ...this._extraHeaders },
      });
      this._availability = res.ok ? 'available' : 'unavailable';
    } catch {
      this._availability = 'unavailable';
    }
    return this._availability;
  }

  async prompt(messages: AIMessage[], options: AIRequestOptions = {}): Promise<string> {
    const body = {
      model: this._model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      stream: !!options.onChunk,
    };
    const res = await fetch(`${this._baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this._apiKey}`,
        ...this._extraHeaders,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`${this.name} error ${res.status}: ${errText}`);
    }
    if (options.onChunk) {
      return readSSE(res, options.onChunk, (d) => {
        const choice = (d as { choices?: { delta?: { content?: string } }[] })?.choices?.[0];
        return choice?.delta?.content ?? '';
      });
    }
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() ?? '';
  }
}

class AnthropicAdapter implements AIAdapter {
  readonly name = 'Anthropic';
  readonly description = 'Claude models from Anthropic.';
  private _availability: AIAvailability = 'checking';

  constructor(private _apiKey: string, private _model: string) {}

  get availability(): AIAvailability { return this._availability; }

  async checkAvailability(): Promise<AIAvailability> {
    try {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': this._apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true',
        },
      });
      this._availability = res.ok ? 'available' : 'unavailable';
    } catch {
      this._availability = 'unavailable';
    }
    return this._availability;
  }

  async prompt(messages: AIMessage[], options: AIRequestOptions = {}): Promise<string> {
    const systemMsg = messages.find((m) => m.role === 'system')?.content;
    const userMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const body: Record<string, unknown> = {
      model: this._model,
      max_tokens: options.maxTokens ?? 1024,
      messages: userMessages,
      stream: !!options.onChunk,
    };
    if (systemMsg) body.system = systemMsg;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this._apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Anthropic error ${res.status}: ${errText}`);
    }
    if (options.onChunk) {
      return readSSE(res, options.onChunk, (d) => {
        const evt = d as { type?: string; delta?: { type?: string; text?: string } };
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          return evt.delta.text ?? '';
        }
        return '';
      });
    }
    const json = await res.json();
    return json.content?.[0]?.text?.trim() ?? '';
  }
}

class GeminiAPIAdapter implements AIAdapter {
  readonly name = 'Google Gemini API';
  readonly description = 'Gemini models via Google AI API.';
  private _availability: AIAvailability = 'checking';

  constructor(private _apiKey: string, private _model: string) {}

  get availability(): AIAvailability { return this._availability; }

  async checkAvailability(): Promise<AIAvailability> {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this._apiKey}`
      );
      this._availability = res.ok ? 'available' : 'unavailable';
    } catch {
      this._availability = 'unavailable';
    }
    return this._availability;
  }

  async prompt(messages: AIMessage[], options: AIRequestOptions = {}): Promise<string> {
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.7,
      },
    };
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };

    const endpoint = options.onChunk
      ? `https://generativelanguage.googleapis.com/v1beta/models/${this._model}:streamGenerateContent?key=${this._apiKey}&alt=sse`
      : `https://generativelanguage.googleapis.com/v1beta/models/${this._model}:generateContent?key=${this._apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }
    if (options.onChunk) {
      return readSSE(res, options.onChunk, (d) => {
        const evt = d as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        return evt.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      });
    }
    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  }
}

export class ByokProviderAdapter implements AIAdapter {
  private _inner: AIAdapter;
  readonly name: string;
  readonly description: string;

  constructor(provider: ByokProvider, apiKey: string, model: string) {
    this.name = BYOK_PROVIDER_NAMES[provider];
    this.description = `Your ${BYOK_PROVIDER_NAMES[provider]} API key — usage billed to your account.`;
    this._inner = ByokProviderAdapter._build(provider, apiKey, model);
  }

  private static _build(provider: ByokProvider, key: string, model: string): AIAdapter {
    switch (provider) {
      case 'openai':
        return new OpenAICompatAdapter('OpenAI', 'OpenAI GPT models.', 'https://api.openai.com/v1', key, model || 'gpt-4o-mini');
      case 'anthropic':
        return new AnthropicAdapter(key, model || 'claude-3-5-haiku-20241022');
      case 'gemini':
        return new GeminiAPIAdapter(key, model || 'gemini-1.5-flash');
      case 'openrouter':
        return new OpenAICompatAdapter('OpenRouter', 'OpenRouter — access many models.', 'https://openrouter.ai/api/v1', key, model || 'meta-llama/llama-3.1-8b-instruct:free', {
          'HTTP-Referer': 'https://podcraft-central.replit.app',
          'X-Title': 'PodCraft Central',
        });
      case 'groq':
        return new OpenAICompatAdapter('Groq', 'Groq — ultra-fast inference.', 'https://api.groq.com/openai/v1', key, model || 'llama-3.1-8b-instant');
      case 'mistral':
        return new OpenAICompatAdapter('Mistral', 'Mistral AI models.', 'https://api.mistral.ai/v1', key, model || 'mistral-small-latest');
    }
  }

  get availability(): AIAvailability { return this._inner.availability; }
  async checkAvailability(): Promise<AIAvailability> { return this._inner.checkAvailability(); }
  async prompt(messages: AIMessage[], options?: AIRequestOptions): Promise<string> {
    return this._inner.prompt(messages, options);
  }
}

export async function validateByokKey(
  provider: ByokProvider,
  apiKey: string,
  model?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!apiKey.trim()) return { ok: false, error: 'API key is required.' };
  try {
    const adapter = new ByokProviderAdapter(provider, apiKey, model ?? '');
    const avail = await adapter.checkAvailability();
    if (avail === 'available') return { ok: true };
    return { ok: false, error: 'Key validation failed — please check the key and try again.' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Validation failed.' };
  }
}
