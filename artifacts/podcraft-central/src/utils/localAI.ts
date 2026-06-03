/**
 * Local AI — real in-browser inference via @huggingface/transformers (Transformers.js v4)
 * Models are downloaded from HuggingFace Hub and cached in the browser Cache API.
 * Requires Cross-Origin Isolation (COOP/COEP) — already enabled via vite-plugin-cross-origin-isolation.
 */

export interface LocalModelConfig {
  id: string;
  name: string;
  sizeBytes: number;
  sizeLabel: string;
  category: 'small-fast' | 'balanced' | 'higher-quality' | 'experimental';
  type: string;
  recommendedUse: string;
  requiresWebGPU: boolean;
  task: 'text-generation';
}

export interface ProgressInfo {
  status: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

export const LOCAL_MODELS: LocalModelConfig[] = [
  {
    id: 'HuggingFaceTB/SmolLM2-135M-Instruct',
    name: 'SmolLM2-135M',
    sizeBytes: 105 * 1024 * 1024,
    sizeLabel: '~105 MB',
    category: 'small-fast',
    type: 'Text Generation',
    recommendedUse: 'Fastest option — quick answers, low-memory devices, basic scripting help',
    requiresWebGPU: false,
    task: 'text-generation',
  },
  {
    id: 'HuggingFaceTB/SmolLM2-360M-Instruct',
    name: 'SmolLM2-360M',
    sizeBytes: 270 * 1024 * 1024,
    sizeLabel: '~270 MB',
    category: 'small-fast',
    type: 'Text Generation',
    recommendedUse: 'Fast and capable — show notes, production notes, general chat',
    requiresWebGPU: false,
    task: 'text-generation',
  },
  {
    id: 'onnx-community/Qwen2.5-0.5B-Instruct',
    name: 'Qwen2.5-0.5B',
    sizeBytes: 410 * 1024 * 1024,
    sizeLabel: '~410 MB',
    category: 'balanced',
    type: 'Text Generation',
    recommendedUse: 'Balanced — episode planning, interview prep, social captions',
    requiresWebGPU: false,
    task: 'text-generation',
  },
  {
    id: 'onnx-community/Qwen2.5-1.5B-Instruct-q4f16',
    name: 'Qwen2.5-1.5B (Q4)',
    sizeBytes: 920 * 1024 * 1024,
    sizeLabel: '~920 MB',
    category: 'balanced',
    type: 'Text Generation · WebGPU',
    recommendedUse: 'Better quality scripting and research — WebGPU required',
    requiresWebGPU: true,
    task: 'text-generation',
  },
  {
    id: 'onnx-community/Llama-3.2-1B-Instruct-q4f16',
    name: 'Llama 3.2-1B (Q4)',
    sizeBytes: 720 * 1024 * 1024,
    sizeLabel: '~720 MB',
    category: 'higher-quality',
    type: 'Text Generation · WebGPU',
    recommendedUse: 'Detailed scripts, show notes, audience research — WebGPU required',
    requiresWebGPU: true,
    task: 'text-generation',
  },
  {
    id: 'onnx-community/Qwen2.5-3B-Instruct-q4f16',
    name: 'Qwen2.5-3B (Q4)',
    sizeBytes: 1950 * 1024 * 1024,
    sizeLabel: '~1.95 GB',
    category: 'higher-quality',
    type: 'Text Generation · WebGPU',
    recommendedUse: 'Best local quality — complex production, advanced scripting — WebGPU required',
    requiresWebGPU: true,
    task: 'text-generation',
  },
  {
    id: 'onnx-community/DeepSeek-R1-Distill-Qwen-1.5B',
    name: 'DeepSeek-R1-1.5B',
    sizeBytes: 1050 * 1024 * 1024,
    sizeLabel: '~1.05 GB',
    category: 'experimental',
    type: 'Reasoning · WebGPU',
    recommendedUse: 'Experimental reasoning model — creative podcast concepts — WebGPU required',
    requiresWebGPU: true,
    task: 'text-generation',
  },
];

export async function checkWebGPU(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false;
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return adapter !== null;
  } catch { return false; }
}

export async function checkStorage(): Promise<{ quota: number; usage: number; available: number }> {
  try {
    const est = await navigator.storage.estimate();
    const quota = est.quota ?? 0;
    const usage = est.usage ?? 0;
    return { quota, usage, available: quota - usage };
  } catch { return { quota: 0, usage: 0, available: 0 }; }
}

const INSTALLED_KEY = 'podcraft_local_ai_installed_v2';

export function getInstalledModelIds(): string[] {
  try {
    const s = localStorage.getItem(INSTALLED_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function markInstalled(id: string): void {
  const list = getInstalledModelIds();
  if (!list.includes(id)) {
    localStorage.setItem(INSTALLED_KEY, JSON.stringify([...list, id]));
  }
}

function markUninstalled(id: string): void {
  localStorage.setItem(INSTALLED_KEY, JSON.stringify(getInstalledModelIds().filter(x => x !== id)));
}

let _activePipeline: any | null = null;
let _activePipelineId: string | null = null;

export type LoadedPipeline = any;

export async function loadLocalModel(
  config: LocalModelConfig,
  onProgress: (info: ProgressInfo) => void,
  useWebGPU: boolean,
): Promise<LoadedPipeline> {
  const { pipeline, env } = await import('@huggingface/transformers');

  (env as any).allowLocalModels = false;
  (env as any).useBrowserCache = true;

  const device = (useWebGPU && config.requiresWebGPU) ? 'webgpu' : 'wasm';

  onProgress({ status: 'initiate' });

  const pipe = await (pipeline as any)(config.task, config.id, {
    device,
    progress_callback: (data: any) => {
      onProgress({
        status: data.status,
        file: data.file,
        progress: data.progress,
        loaded: data.loaded,
        total: data.total,
      });
    },
  });

  _activePipeline = pipe;
  _activePipelineId = config.id;
  markInstalled(config.id);

  return pipe;
}

export function unloadLocalModel(): void {
  _activePipeline = null;
  _activePipelineId = null;
}

export async function localInfer(
  pipe: LoadedPipeline,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const output = await pipe(messages, {
    max_new_tokens: 512,
    do_sample: false,
  });

  const arr = output as any[];
  if (!arr || arr.length === 0) return 'No response generated.';

  const gen = arr[0]?.generated_text;
  if (Array.isArray(gen) && gen.length > 0) {
    return gen.at(-1)?.content ?? 'No response.';
  }
  if (typeof gen === 'string') return gen;
  return 'Unable to extract response.';
}

export async function deleteLocalModel(modelId: string): Promise<void> {
  markUninstalled(modelId);
  if (_activePipelineId === modelId) {
    _activePipeline = null;
    _activePipelineId = null;
  }
  try {
    const modelSlug = modelId.split('/').pop() ?? modelId;
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      const hits = keys.filter(r => r.url.includes(modelSlug) || r.url.includes(encodeURIComponent(modelId)));
      await Promise.all(hits.map(k => cache.delete(k)));
    }
  } catch {
    /* Cache cleanup is best-effort; localStorage entry already removed */
  }
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 ** 2)).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}
