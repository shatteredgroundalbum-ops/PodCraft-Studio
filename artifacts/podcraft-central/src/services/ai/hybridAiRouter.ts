import type { AIAdapter, AIAvailability, AIMessage, AIRequestOptions } from './types';
import { phi3MiniAdapter } from './phi3MiniAdapter';
import { geminiNanoAdapter } from './geminiNanoAdapter';

const QUICK_TASKS = ['tip', 'feedback', 'coach', 'quick', 'check', 'brief', 'note'];
const COMPLEX_TASKS = ['research', 'script', 'outline', 'draft', 'generate', 'write', 'analyse', 'plan'];

function classifyTask(messages: AIMessage[]): 'quick' | 'complex' {
  const text = messages.map((m) => m.content).join(' ').toLowerCase();
  if (COMPLEX_TASKS.some((t) => text.includes(t))) return 'complex';
  if (QUICK_TASKS.some((t) => text.includes(t))) return 'quick';
  const totalLength = messages.reduce((acc, m) => acc + m.content.length, 0);
  return totalLength > 400 ? 'complex' : 'quick';
}

export class HybridAiRouter implements AIAdapter {
  readonly name = 'Hybrid (Phi-3 Mini + Gemini Nano)';
  readonly description = 'Uses Gemini Nano for quick tasks and Phi-3 Mini for complex work.';
  private _availability: AIAvailability = 'checking';

  get availability(): AIAvailability { return this._availability; }

  async checkAvailability(): Promise<AIAvailability> {
    const [phi3, nano] = await Promise.all([
      phi3MiniAdapter.checkAvailability(),
      geminiNanoAdapter.checkAvailability(),
    ]);
    if (phi3 === 'requires-download' && nano === 'unavailable') {
      this._availability = 'requires-download';
    } else if (phi3 === 'unavailable' && nano === 'unavailable') {
      this._availability = 'unavailable';
    } else {
      this._availability = 'available';
    }
    return this._availability;
  }

  async prompt(messages: AIMessage[], options?: AIRequestOptions): Promise<string> {
    const taskType = classifyTask(messages);
    const nanoReady = geminiNanoAdapter.availability === 'available';
    const phi3Ready = phi3MiniAdapter.isLoaded;

    if (taskType === 'quick' && nanoReady) {
      try {
        return await geminiNanoAdapter.prompt(messages, options);
      } catch {
        if (phi3Ready) return phi3MiniAdapter.prompt(messages, options);
        throw new Error('Gemini Nano failed and Phi-3 Mini is not loaded. Download Phi-3 Mini to continue.');
      }
    }

    if (phi3Ready) {
      return phi3MiniAdapter.prompt(messages, options);
    }
    if (nanoReady) {
      return geminiNanoAdapter.prompt(messages, options);
    }
    throw new Error('Hybrid AI: Neither Phi-3 Mini (not loaded) nor Gemini Nano (unavailable) is ready. Load Phi-3 Mini from Settings → AI Producer.');
  }
}

export const hybridAiRouter = new HybridAiRouter();
