// ─── AI Producer Shell ────────────────────────────────────────────────────────
// The single entry point for all AI tasks in PodCraft Central.
//
// Rules:
// - React components must call runTask() here — not adapters or aiProviderService directly.
// - Production services (script, mastering, mixing, etc.) must call runTask() here.
// - The router selects the correct adapter based on task type + user settings.
// - No model calls another model. No component calls a model.

import type {
  AIAvailability, AIMessage, AIRequestOptions, AIProviderInfo, AITaskType,
} from './types';
import { aiProviderService } from './aiProviderService';
import { aiProviderRouter } from './aiProviderRouter';

class AIProducerService {

  // ── Provider state (delegated to aiProviderService) ─────────────────────────

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

  // ── Task execution ───────────────────────────────────────────────────────────

  /**
   * Run an AI task through the provider router.
   *
   * The router picks the best adapter for the task type based on user settings:
   * - phi3 / gemini-nano / byok modes → uses that adapter directly
   * - hybrid mode → routes by task type (recording-check→Nano, script-draft→Phi-3, research→BYOK…)
   *
   * @param taskType  What kind of task — drives model routing in hybrid mode.
   * @param messages  The conversation or single-turn messages.
   * @param options   Optional: streaming callback, temperature, maxTokens.
   */
  async runTask(
    taskType: AITaskType,
    messages: AIMessage[],
    options?: AIRequestOptions,
  ): Promise<string> {
    return aiProviderRouter.route(taskType, messages, options);
  }

  /**
   * Convenience wrapper for a single user message.
   * @param taskType  Task type for routing.
   * @param userMessage  Plain text user message.
   * @param onChunk  Optional streaming callback.
   */
  async quickPrompt(
    taskType: AITaskType,
    userMessage: string,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    return this.runTask(taskType, [{ role: 'user', content: userMessage }], { onChunk });
  }

  /**
   * Return the adapter display name that would handle a given task type.
   * Use for UI labels like "Using: Phi-3 Mini" or "Using: Gemini Nano".
   */
  getAdapterForTask(taskType: AITaskType): string {
    return aiProviderRouter.getRoutedAdapterName(taskType);
  }
}

export const aiProducerService = new AIProducerService();
