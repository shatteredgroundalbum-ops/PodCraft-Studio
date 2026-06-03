/**
 * Multi-provider AI system — provider definitions, inference, and validation.
 * Supports OpenAI-compatible, Anthropic, Gemini, and marks Bedrock as unsupported from browser.
 */

export type InferenceCategory = 'openai-compatible' | 'anthropic' | 'gemini' | 'unsupported';
export type ProviderStatus = 'not-connected' | 'validating' | 'connected' | 'invalid-key' | 'connection-failed' | 'missing-key' | 'unsupported';

export interface ProviderModel {
  id: string;
  name: string;
  recommendedModules: string[];
  note?: string;
}

export interface ProviderDef {
  id: string;
  name: string;
  inferenceCategory: InferenceCategory;
  needsKey: boolean;
  keyPrefix: string;
  keyPlaceholder: string;
  apiBase: string;
  validatePath: string;
  authStyle: 'bearer' | 'x-api-key' | 'query-param' | 'none';
  extraHeaders?: Record<string, string>;
  extraFields?: Array<{ key: string; label: string; placeholder: string; defaultValue: string }>;
  models: ProviderModel[];
  recommendedFor: string;
  browserCompatible: boolean;
  unsupportedNote?: string;
  docsUrl: string;
  keyHint: string;
}

export const PROVIDER_DEFS: ProviderDef[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    inferenceCategory: 'openai-compatible',
    needsKey: true,
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    apiBase: 'https://api.openai.com/v1',
    validatePath: '/models',
    authStyle: 'bearer',
    models: [
      { id: 'gpt-5', name: 'GPT-5', recommendedModules: ['ai-producer', 'script-writer', 'pipeline', 'search-research', 'global-default'] },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', recommendedModules: ['ai-producer', 'metadata-generator', 'chat', 'transcript'] },
    ],
    recommendedFor: 'AI Producer, scripting, orchestration, planning, general assistant',
    browserCompatible: true,
    docsUrl: 'https://platform.openai.com/api-keys',
    keyHint: 'platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    inferenceCategory: 'anthropic',
    needsKey: true,
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-...',
    apiBase: 'https://api.anthropic.com',
    validatePath: '/v1/models',
    authStyle: 'x-api-key',
    extraHeaders: {
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    models: [
      { id: 'claude-opus-4-5', name: 'Claude Opus', recommendedModules: ['script-writer', 'storyboard', 'search-research', 'pipeline'] },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet', recommendedModules: ['script-writer', 'ai-producer', 'chat', 'transcript'] },
    ],
    recommendedFor: 'Script writing, long-form generation, dialogue, story work',
    browserCompatible: true,
    docsUrl: 'https://console.anthropic.com/',
    keyHint: 'console.anthropic.com',
  },
  {
    id: 'google',
    name: 'Google',
    inferenceCategory: 'gemini',
    needsKey: true,
    keyPrefix: 'AIza',
    keyPlaceholder: 'AIza...',
    apiBase: 'https://generativelanguage.googleapis.com',
    validatePath: '/v1beta/models',
    authStyle: 'query-param',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', recommendedModules: ['pipeline', 'search-research', 'ai-producer', 'storyboard'] },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', recommendedModules: ['pipeline', 'chat', 'metadata-generator', 'transcript', 'audio-assistant'] },
    ],
    recommendedFor: 'Orchestration, multimodal, pipeline assistance',
    browserCompatible: true,
    docsUrl: 'https://aistudio.google.com/app/apikey',
    keyHint: 'aistudio.google.com',
  },
  {
    id: 'bedrock',
    name: 'Amazon Bedrock',
    inferenceCategory: 'unsupported',
    needsKey: true,
    keyPrefix: 'AKIA',
    keyPlaceholder: 'AWS Access Key ID',
    apiBase: 'https://bedrock-runtime.us-east-1.amazonaws.com',
    validatePath: '',
    authStyle: 'bearer',
    models: [
      { id: 'anthropic.claude-sonnet-4-5-v1:0', name: 'Claude Sonnet (Bedrock)', recommendedModules: ['script-writer', 'ai-producer'] },
      { id: 'anthropic.claude-opus-4-5-v1:0', name: 'Claude Opus (Bedrock)', recommendedModules: ['script-writer', 'storyboard'] },
      { id: 'meta.llama3-70b-instruct-v1:0', name: 'Llama 3 70B (Bedrock)', recommendedModules: ['ai-producer', 'chat'] },
      { id: 'amazon.nova-pro-v1:0', name: 'Amazon Nova Pro', recommendedModules: ['pipeline', 'search-research'] },
      { id: 'mistral.mistral-large-2402-v1:0', name: 'Mistral Large (Bedrock)', recommendedModules: ['script-writer', 'metadata-generator'] },
    ],
    recommendedFor: 'Enterprise routing, multi-model deployments, backend orchestration',
    browserCompatible: false,
    unsupportedNote: 'Requires AWS Sig V4 signing + server proxy — cannot run directly from browser',
    docsUrl: 'https://aws.amazon.com/bedrock/',
    keyHint: 'AWS Console → IAM → Access Keys',
  },
  {
    id: 'together',
    name: 'Together AI',
    inferenceCategory: 'openai-compatible',
    needsKey: true,
    keyPrefix: '',
    keyPlaceholder: 'API key...',
    apiBase: 'https://api.together.xyz/v1',
    validatePath: '/models',
    authStyle: 'bearer',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B', recommendedModules: ['ai-producer', 'script-writer', 'chat'] },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', recommendedModules: ['search-research', 'pipeline', 'storyboard'] },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B', recommendedModules: ['script-writer', 'chat', 'transcript'] },
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B', recommendedModules: ['chat', 'metadata-generator'] },
    ],
    recommendedFor: 'Lower-cost cloud inference, experimentation',
    browserCompatible: true,
    docsUrl: 'https://api.together.xyz/',
    keyHint: 'api.together.xyz → Settings → API Keys',
  },
  {
    id: 'groq',
    name: 'Groq',
    inferenceCategory: 'openai-compatible',
    needsKey: true,
    keyPrefix: 'gsk_',
    keyPlaceholder: 'gsk_...',
    apiBase: 'https://api.groq.com/openai/v1',
    validatePath: '/models',
    authStyle: 'bearer',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', recommendedModules: ['ai-producer', 'script-writer', 'chat', 'transcript'] },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 (Llama)', recommendedModules: ['search-research', 'pipeline'] },
    ],
    recommendedFor: 'Ultra-low latency, realtime assistance, transcript processing',
    browserCompatible: true,
    docsUrl: 'https://console.groq.com/',
    keyHint: 'console.groq.com → API Keys',
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    inferenceCategory: 'openai-compatible',
    needsKey: true,
    keyPrefix: 'fw_',
    keyPlaceholder: 'fw_...',
    apiBase: 'https://api.fireworks.ai/inference/v1',
    validatePath: '/models',
    authStyle: 'bearer',
    models: [
      { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B', recommendedModules: ['ai-producer', 'script-writer', 'chat'] },
      { id: 'accounts/fireworks/models/deepseek-r1', name: 'DeepSeek R1', recommendedModules: ['search-research', 'pipeline'] },
      { id: 'accounts/fireworks/models/mistral-7b-instruct-4k', name: 'Mistral 7B', recommendedModules: ['metadata-generator', 'chat'] },
    ],
    recommendedFor: 'Scalable, high-throughput cloud inference',
    browserCompatible: true,
    docsUrl: 'https://fireworks.ai/',
    keyHint: 'fireworks.ai → Account → API Keys',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    inferenceCategory: 'openai-compatible',
    needsKey: true,
    keyPrefix: 'sk-or-',
    keyPlaceholder: 'sk-or-...',
    apiBase: 'https://openrouter.ai/api/v1',
    validatePath: '/models',
    authStyle: 'bearer',
    extraHeaders: {
      'HTTP-Referer': 'https://podcraft.app',
      'X-Title': 'PodCraft Central',
    },
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', recommendedModules: ['ai-producer', 'chat', 'script-writer'] },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', recommendedModules: ['script-writer', 'storyboard'] },
      { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash', recommendedModules: ['pipeline', 'transcript', 'metadata-generator'] },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', recommendedModules: ['search-research', 'pipeline'] },
    ],
    recommendedFor: 'Provider abstraction — access many models with one key',
    browserCompatible: true,
    docsUrl: 'https://openrouter.ai/keys',
    keyHint: 'openrouter.ai/keys',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    inferenceCategory: 'openai-compatible',
    needsKey: true,
    keyPrefix: '',
    keyPlaceholder: 'API key...',
    apiBase: 'https://api.cohere.com/compatibility/v1',
    validatePath: '/models',
    authStyle: 'bearer',
    models: [
      { id: 'command-r-plus-08-2024', name: 'Command R+', recommendedModules: ['script-writer', 'search-research', 'metadata-generator'] },
      { id: 'command-r-08-2024', name: 'Command R', recommendedModules: ['chat', 'ai-producer', 'transcript'] },
    ],
    recommendedFor: 'Structured generation, retrieval-augmented workflows',
    browserCompatible: true,
    docsUrl: 'https://dashboard.cohere.com/api-keys',
    keyHint: 'dashboard.cohere.com/api-keys',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    inferenceCategory: 'openai-compatible',
    needsKey: true,
    keyPrefix: '',
    keyPlaceholder: 'API key...',
    apiBase: 'https://api.mistral.ai/v1',
    validatePath: '/models',
    authStyle: 'bearer',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', recommendedModules: ['script-writer', 'ai-producer', 'search-research'] },
      { id: 'mistral-medium-latest', name: 'Mistral Medium', recommendedModules: ['chat', 'metadata-generator', 'transcript'] },
    ],
    recommendedFor: 'Writing, multilingual support',
    browserCompatible: true,
    docsUrl: 'https://console.mistral.ai/api-keys/',
    keyHint: 'console.mistral.ai',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    inferenceCategory: 'openai-compatible',
    needsKey: true,
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    apiBase: 'https://api.deepseek.com/v1',
    validatePath: '/models',
    authStyle: 'bearer',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', recommendedModules: ['ai-producer', 'chat', 'script-writer'] },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', recommendedModules: ['search-research', 'pipeline', 'storyboard'] },
    ],
    recommendedFor: 'Analysis, reasoning, structured tasks',
    browserCompatible: true,
    docsUrl: 'https://platform.deepseek.com/',
    keyHint: 'platform.deepseek.com → API Keys',
  },
  {
    id: 'xai',
    name: 'xAI',
    inferenceCategory: 'openai-compatible',
    needsKey: true,
    keyPrefix: 'xai-',
    keyPlaceholder: 'xai-...',
    apiBase: 'https://api.x.ai/v1',
    validatePath: '/models',
    authStyle: 'bearer',
    models: [
      { id: 'grok-2-1212', name: 'Grok 2', recommendedModules: ['ai-producer', 'chat', 'search-research'] },
      { id: 'grok-2-mini-1212', name: 'Grok 2 Mini', recommendedModules: ['chat', 'metadata-generator'] },
    ],
    recommendedFor: 'Conversational assistance, up-to-date knowledge',
    browserCompatible: true,
    docsUrl: 'https://console.x.ai/',
    keyHint: 'console.x.ai → API Keys',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    inferenceCategory: 'openai-compatible',
    needsKey: false,
    keyPrefix: '',
    keyPlaceholder: '',
    apiBase: 'http://localhost:11434/v1',
    validatePath: '/models',
    authStyle: 'none',
    extraFields: [
      { key: 'ollamaUrl', label: 'Ollama URL', placeholder: 'http://localhost:11434', defaultValue: 'http://localhost:11434' },
    ],
    models: [],
    recommendedFor: 'Local server inference — any locally installed model',
    browserCompatible: true,
    docsUrl: 'https://ollama.com/download',
    keyHint: 'Run: OLLAMA_ORIGINS=* ollama serve',
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    inferenceCategory: 'openai-compatible',
    needsKey: false,
    keyPrefix: '',
    keyPlaceholder: 'API key (optional)',
    apiBase: '',
    validatePath: '/models',
    authStyle: 'bearer',
    extraFields: [
      { key: 'customUrl', label: 'Endpoint URL', placeholder: 'https://api.example.com/v1', defaultValue: '' },
      { key: 'customModel', label: 'Model name', placeholder: 'model-id', defaultValue: '' },
    ],
    models: [],
    recommendedFor: 'Any OpenAI-compatible API endpoint',
    browserCompatible: true,
    docsUrl: '',
    keyHint: 'Enter your OpenAI-compatible endpoint URL',
  },
];

export const MODULE_SYSTEM_PROMPTS: Record<string, string> = {
  'ai-producer': 'You are an AI podcast producer assistant inside PodCraft Central. Help with show notes, episode titles, guest research, interview questions, scripting, production decisions, and audio quality tips. Be concise and actionable.',
  'script-writer': 'You are a professional podcast script writer. Focus on compelling dialogue, clear structure, natural-sounding speech, and engaging storytelling for audio content.',
  'pipeline': 'You are a podcast production pipeline assistant. Help plan and orchestrate production workflows, episode scheduling, content pipelines, and delivery strategies.',
  'storyboard': 'You are a podcast episode storyboard and structure planner. Help outline episode structure, segment flow, narrative arcs, and pacing for compelling podcasts.',
  'audio-assistant': 'You are an audio production specialist for podcasts. Focus on recording quality, microphone technique, mixing, mastering, EQ, noise reduction, and compression.',
  'metadata-generator': 'You are a podcast metadata specialist. Generate SEO-optimized episode titles, descriptions, show notes summaries, tags, and structured metadata for podcast platforms.',
  'transcript': 'You are a podcast transcript assistant. Help clean, format, summarize, and extract insights from podcast transcripts.',
  'search-research': 'You are a research assistant for podcast creators. Help with guest research, topic exploration, fact-checking, competitive analysis, and content planning.',
  'chat': 'You are a helpful assistant for podcast creators at PodCraft Central. Answer questions and provide guidance on any podcast-related topic.',
  'global-default': 'You are an AI assistant for PodCraft Central, a professional podcast production platform. Help with any podcast production, writing, research, or planning task.',
};

type Message = { role: string; content: string };

async function openaiCompatibleInfer(
  apiBase: string,
  apiKey: string,
  modelId: string,
  messages: Message[],
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  if (extraHeaders) Object.assign(headers, extraHeaders);
  const res = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: modelId, messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `API error ${res.status}: ${res.statusText}`);
  return data.choices?.[0]?.message?.content ?? 'No response';
}

async function anthropicInfer(
  apiKey: string,
  modelId: string,
  messages: Message[],
): Promise<string> {
  const system = messages.find(m => m.role === 'system')?.content;
  const chat = messages.filter(m => m.role !== 'system');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: modelId, max_tokens: 1024, system, messages: chat }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Anthropic error ${res.status}`);
  return data.content?.[0]?.text ?? 'No response';
}

async function geminiInfer(
  apiKey: string,
  modelId: string,
  messages: Message[],
): Promise<string> {
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

export async function callProviderInference(
  def: ProviderDef,
  modelId: string,
  apiKey: string,
  messages: Message[],
  extra?: Record<string, string>,
): Promise<string> {
  if (!def.browserCompatible) throw new Error(`${def.name} is not supported in browser mode. ${def.unsupportedNote ?? ''}`);
  const apiBase = def.id === 'ollama' ? (extra?.ollamaUrl ?? def.apiBase)
    : def.id === 'custom' ? (extra?.customUrl ?? def.apiBase)
    : def.apiBase;
  const effectiveModelId = def.id === 'custom' ? (extra?.customModel ?? modelId) : modelId;
  switch (def.inferenceCategory) {
    case 'openai-compatible': return openaiCompatibleInfer(apiBase, apiKey, effectiveModelId, messages, def.extraHeaders);
    case 'anthropic': return anthropicInfer(apiKey, effectiveModelId, messages);
    case 'gemini': return geminiInfer(apiKey, effectiveModelId, messages);
    case 'unsupported': throw new Error(`${def.name} is not supported in browser mode. ${def.unsupportedNote ?? ''}`);
    default: throw new Error('Unknown inference category');
  }
}

export async function validateProviderConnection(
  def: ProviderDef,
  apiKey: string,
  extra?: Record<string, string>,
): Promise<{ ok: boolean; status: ProviderStatus; error?: string }> {
  if (!def.browserCompatible) return { ok: false, status: 'unsupported', error: def.unsupportedNote };
  if (def.needsKey && (!apiKey || apiKey.length < 4)) return { ok: false, status: 'missing-key' };
  try {
    const apiBase = def.id === 'ollama' ? (extra?.ollamaUrl ?? def.apiBase)
      : def.id === 'custom' ? (extra?.customUrl ?? def.apiBase)
      : def.apiBase;
    const qs = def.authStyle === 'query-param' ? `?key=${encodeURIComponent(apiKey)}` : '';
    const url = `${apiBase}${def.validatePath}${qs}`;
    const headers: Record<string, string> = {};
    if (def.authStyle === 'bearer' && apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    if (def.authStyle === 'x-api-key' && apiKey) headers['x-api-key'] = apiKey;
    if (def.extraHeaders) Object.assign(headers, def.extraHeaders);
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (res.status === 200) return { ok: true, status: 'connected' };
    if (res.status === 401 || res.status === 403) return { ok: false, status: 'invalid-key', error: 'Invalid API key' };
    return { ok: false, status: 'connection-failed', error: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, status: 'connection-failed', error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function fetchOllamaModelList(ollamaUrl: string): Promise<string[]> {
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models ?? []).map((m: any) => m.name as string);
  } catch { return []; }
}
