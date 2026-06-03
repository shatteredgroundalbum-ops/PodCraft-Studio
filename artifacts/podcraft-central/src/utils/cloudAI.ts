/**
 * Cloud AI — real validation and inference for OpenAI, Anthropic, Google Gemini, Ollama.
 * API keys are stored in localStorage (session-persistent, not encrypted).
 * Validation makes real API calls; nothing is marked Connected without a successful response.
 */

export type CloudProviderId = 'openai' | 'anthropic' | 'gemini' | 'ollama';
export type CloudStatus = 'not-connected' | 'validating' | 'connected' | 'invalid-key' | 'connection-failed' | 'missing-key' | 'unsupported';

export interface CloudModelDef {
  id: string;
  name: string;
  recommendedUse: string;
}

export interface CloudProviderDef {
  id: CloudProviderId;
  name: string;
  models: CloudModelDef[];
  needsKey: boolean;
  keyPrefix: string;
  keyPlaceholder: string;
  keyHint: string;
  docsUrl: string;
}

export const CLOUD_PROVIDERS: CloudProviderDef[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', recommendedUse: 'Fast, cost-effective — show notes, quick scripting' },
      { id: 'gpt-4o', name: 'GPT-4o', recommendedUse: 'Highest quality — complex scripts, deep research' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', recommendedUse: 'Economical older model — basic tasks' },
    ],
    needsKey: true,
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    keyHint: 'platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    models: [
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', recommendedUse: 'Fast and affordable — scripting, notes' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', recommendedUse: 'Best Claude — complex production tasks' },
    ],
    needsKey: true,
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-...',
    keyHint: 'console.anthropic.com',
    docsUrl: 'https://console.anthropic.com/',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', recommendedUse: 'Fast, free-tier friendly — general podcast help' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', recommendedUse: 'Powerful — long-form scripts, deep research' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', recommendedUse: 'Latest fast model — multimodal capable' },
    ],
    needsKey: true,
    keyPrefix: 'AIza',
    keyPlaceholder: 'AIza...',
    keyHint: 'aistudio.google.com',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local Server)',
    models: [],
    needsKey: false,
    keyPrefix: '',
    keyPlaceholder: '',
    keyHint: 'Run: OLLAMA_ORIGINS=* ollama serve',
    docsUrl: 'https://ollama.com/download',
  },
];

const KEY_PREFIX = 'podcraft_cloud_key_';
const OLLAMA_URL_KEY = 'podcraft_cloud_ollama_url';
const OLLAMA_MODEL_KEY = 'podcraft_cloud_ollama_model';

export function getStoredKey(providerId: CloudProviderId): string {
  return localStorage.getItem(`${KEY_PREFIX}${providerId}`) ?? '';
}
export function storeKey(providerId: CloudProviderId, key: string): void {
  localStorage.setItem(`${KEY_PREFIX}${providerId}`, key);
}
export function clearKey(providerId: CloudProviderId): void {
  localStorage.removeItem(`${KEY_PREFIX}${providerId}`);
}
export function getOllamaUrl(): string {
  return localStorage.getItem(OLLAMA_URL_KEY) ?? 'http://localhost:11434';
}
export function setOllamaUrl(url: string): void {
  localStorage.setItem(OLLAMA_URL_KEY, url);
}
export function getOllamaModel(): string {
  return localStorage.getItem(OLLAMA_MODEL_KEY) ?? 'llama3.2';
}
export function setOllamaModel(model: string): void {
  localStorage.setItem(OLLAMA_MODEL_KEY, model);
}

export async function validateProvider(
  providerId: CloudProviderId,
  apiKey: string,
  ollamaUrl?: string,
): Promise<{ ok: boolean; status: CloudStatus; error?: string }> {
  try {
    if (providerId === 'openai') {
      if (!apiKey || apiKey.length < 8) return { ok: false, status: 'missing-key' };
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.status === 200) return { ok: true, status: 'connected' };
      if (res.status === 401) return { ok: false, status: 'invalid-key', error: 'Invalid API key' };
      return { ok: false, status: 'connection-failed', error: `HTTP ${res.status}` };
    }

    if (providerId === 'anthropic') {
      if (!apiKey || apiKey.length < 8) return { ok: false, status: 'missing-key' };
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      });
      if (res.status === 200) return { ok: true, status: 'connected' };
      if (res.status === 401) return { ok: false, status: 'invalid-key', error: 'Invalid API key' };
      return { ok: false, status: 'connection-failed', error: `HTTP ${res.status}` };
    }

    if (providerId === 'gemini') {
      if (!apiKey || apiKey.length < 8) return { ok: false, status: 'missing-key' };
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      );
      if (res.status === 200) return { ok: true, status: 'connected' };
      if (res.status === 400 || res.status === 403) return { ok: false, status: 'invalid-key', error: 'Invalid API key' };
      return { ok: false, status: 'connection-failed', error: `HTTP ${res.status}` };
    }

    if (providerId === 'ollama') {
      const url = ollamaUrl ?? getOllamaUrl();
      const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (res.status === 200) return { ok: true, status: 'connected' };
      return { ok: false, status: 'connection-failed', error: `Cannot reach Ollama at ${url}` };
    }

    return { ok: false, status: 'unsupported' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { ok: false, status: 'connection-failed', error: msg };
  }
}

export async function fetchOllamaModels(url: string): Promise<string[]> {
  try {
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models ?? []).map((m: any) => m.name as string);
  } catch { return []; }
}

type Message = { role: string; content: string };
const SYSTEM_PROMPT =
  'You are an AI podcast producer assistant inside PodCraft Central. Help with show notes, episode titles, guest research, interview questions, scripting, production decisions, and audio quality tips. Be concise and actionable.';

export async function cloudInfer(
  providerId: CloudProviderId,
  modelId: string,
  apiKey: string,
  history: Message[],
  ollamaUrl?: string,
): Promise<string> {
  const messages: Message[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];

  if (providerId === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: modelId, messages }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `OpenAI error ${res.status}`);
    return data.choices?.[0]?.message?.content ?? 'No response';
  }

  if (providerId === 'anthropic') {
    const sysMsg = messages.find(m => m.role === 'system')?.content;
    const chat = messages.filter(m => m.role !== 'system');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: modelId, max_tokens: 1024, system: sysMsg, messages: chat }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `Anthropic error ${res.status}`);
    return data.content?.[0]?.text ?? 'No response';
  }

  if (providerId === 'gemini') {
    const sysMsg = messages.find(m => m.role === 'system')?.content;
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const body: any = { contents };
    if (sysMsg) body.systemInstruction = { parts: [{ text: sysMsg }] };
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `Gemini error ${res.status}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response';
  }

  if (providerId === 'ollama') {
    const url = ollamaUrl ?? getOllamaUrl();
    const res = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId, stream: false, messages }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Ollama error ${res.status}`);
    return data.message?.content ?? 'No response';
  }

  throw new Error('Unknown provider');
}
