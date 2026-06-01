// ─── AI Provider Router ───────────────────────────────────────────────────────
// Selects the correct AI adapter for each task type based on user settings.
//
// Rules:
// - AI Producer shell calls route() here. Nothing else calls adapters directly.
// - Hybrid mode routes by task type (not just text heuristics).
// - Recording checks, summaries, chat → Gemini Nano (fast, on-device).
// - Script drafting, mastering, mixing → Phi-3 Mini (quality, local).
// - Deep research → BYOK preferred (larger context window needed).
// - Graceful fallback chain: never throw without trying all available options.
// - No model calls another model. The router is the only decision point.

import type { AITaskType, AIMessage, AIRequestOptions, AIConfig } from './types';
import type { AIAdapter } from './types';
import { phi3MiniAdapter } from './phi3MiniAdapter';
import { geminiNanoAdapter } from './geminiNanoAdapter';
import { ByokProviderAdapter } from './byokProviderAdapter';
import { aiProviderService } from './aiProviderService';

// ─── Hybrid routing table ─────────────────────────────────────────────────────
// Each entry defines the preferred adapter + fallback for hybrid mode.

type HybridPreference = 'nano' | 'phi3' | 'byok';

const HYBRID_ROUTING: Record<AITaskType, { primary: HybridPreference; fallback: HybridPreference }> = {
  'recording-check': { primary: 'nano', fallback: 'phi3' },
  'summary':         { primary: 'nano', fallback: 'phi3' },
  'chat':            { primary: 'nano', fallback: 'phi3' },
  'research':        { primary: 'byok', fallback: 'phi3' },   // deep research needs large context
  'script-draft':    { primary: 'phi3', fallback: 'nano' },
  'mastering':       { primary: 'phi3', fallback: 'nano' },
  'mixing':          { primary: 'phi3', fallback: 'nano' },
  'planning':        { primary: 'phi3', fallback: 'nano' },
  'pre-production':  { primary: 'phi3', fallback: 'nano' },
  'post-production': { primary: 'phi3', fallback: 'nano' },
  'packaging':       { primary: 'phi3', fallback: 'nano' },
  'distribution':    { primary: 'phi3', fallback: 'nano' },
  'quality-check':   { primary: 'phi3', fallback: 'nano' },
};

// ─── Router ───────────────────────────────────────────────────────────────────

class AIProviderRouter {

  /**
   * Route a task to the best available adapter and run it.
   *
   * In non-hybrid modes the configured adapter is used directly.
   * In hybrid mode, the task type determines primary and fallback adapters.
   */
  async route(
    taskType: AITaskType,
    messages: AIMessage[],
    options?: AIRequestOptions,
  ): Promise<string> {
    const { config } = aiProviderService;

    if (config.mode === 'none') {
      throw new Error(
        'AI Producer is not configured. Go to Settings → AI Producer to set up an AI provider.'
      );
    }

    if (config.mode === 'hybrid') {
      return this._routeHybrid(taskType, messages, options, config);
    }

    // phi3 / gemini-nano / byok — use the adapter aiProviderService already built
    const adapter = aiProviderService.adapter;
    if (!adapter) {
      throw new Error('AI provider adapter is missing. Re-open Settings → AI Producer to reconfigure.');
    }
    return adapter.prompt(messages, options);
  }

  // ── Hybrid routing ──────────────────────────────────────────────────────────

  private async _routeHybrid(
    taskType: AITaskType,
    messages: AIMessage[],
    options: AIRequestOptions | undefined,
    config: AIConfig,
  ): Promise<string> {
    const pref = HYBRID_ROUTING[taskType];
    const nanoReady = geminiNanoAdapter.availability === 'available';
    const phi3Ready  = phi3MiniAdapter.isLoaded;
    const byokReady  = !!(config.byokProvider && config.byokApiKey);

    // Build ordered candidate list based on routing preference
    const candidates = this._buildCandidates(pref, { nanoReady, phi3Ready, byokReady, config });

    if (candidates.length === 0) {
      throw new Error(
        `No AI model is available for task "${taskType}" in Hybrid mode. ` +
        `Download Phi-3 Mini from Settings → AI Producer, or ensure Gemini Nano is accessible.`
      );
    }

    // Try each candidate in priority order, fall through on failure
    let lastError: Error | null = null;
    for (const candidate of candidates) {
      try {
        return await candidate.prompt(messages, options);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
    throw lastError ?? new Error('All AI models failed for this task.');
  }

  private _buildCandidates(
    pref: { primary: HybridPreference; fallback: HybridPreference },
    ctx: { nanoReady: boolean; phi3Ready: boolean; byokReady: boolean; config: AIConfig },
  ): AIAdapter[] {
    const { nanoReady, phi3Ready, byokReady, config } = ctx;
    const result: AIAdapter[] = [];

    const adapterFor = (p: HybridPreference): AIAdapter | null => {
      switch (p) {
        case 'nano': return nanoReady ? geminiNanoAdapter : null;
        case 'phi3': return phi3Ready ? phi3MiniAdapter : null;
        case 'byok': return byokReady
          ? new ByokProviderAdapter(config.byokProvider!, config.byokApiKey!, config.byokModel ?? '')
          : null;
      }
    };

    const push = (p: HybridPreference) => {
      const a = adapterFor(p);
      if (a && !result.includes(a)) result.push(a);
    };

    push(pref.primary);
    push(pref.fallback);
    // final safety net — add anything available
    if (phi3Ready && !result.includes(phi3MiniAdapter)) result.push(phi3MiniAdapter);
    if (nanoReady && !result.includes(geminiNanoAdapter)) result.push(geminiNanoAdapter);

    return result;
  }

  // ── Inspection ──────────────────────────────────────────────────────────────

  /**
   * Return the display name of the adapter that *would* handle a task type
   * given current state. Useful for UI labels ("Using: Phi-3 Mini").
   */
  getRoutedAdapterName(taskType: AITaskType): string {
    const { config } = aiProviderService;
    if (config.mode === 'none') return 'None';
    if (config.mode !== 'hybrid') return aiProviderService.adapter?.name ?? 'Unknown';

    const pref = HYBRID_ROUTING[taskType];
    const nanoReady = geminiNanoAdapter.availability === 'available';
    const phi3Ready  = phi3MiniAdapter.isLoaded;
    const byokReady  = !!(config.byokProvider && config.byokApiKey);

    const check = (p: HybridPreference) => {
      switch (p) {
        case 'nano': return nanoReady ? 'Gemini Nano' : null;
        case 'phi3': return phi3Ready ? 'Phi-3 Mini' : null;
        case 'byok': return byokReady ? (config.byokProvider ?? 'BYOK') : null;
      }
    };

    return check(pref.primary)
      ?? (check(pref.fallback) ? `${check(pref.fallback)} (fallback)` : null)
      ?? 'None available';
  }
}

export const aiProviderRouter = new AIProviderRouter();
