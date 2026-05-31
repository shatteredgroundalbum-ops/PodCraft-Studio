import type { ScriptDraft, AIMessage } from './types';
import { aiProviderService } from './aiProviderService';

class ScriptAssistantService {
  async generateScript(topic: string, outline: string[], style: string = 'conversational'): Promise<ScriptDraft> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Write a podcast script for an episode about: "${topic}"
Style: ${style}
Outline: ${outline.join(', ')}

Include: intro hook, main segments, transitions, outro with CTA.
Format as JSON with keys:
- title (string)
- sections (array of {type, title, content, estimatedSeconds})
- totalEstimatedMinutes (number)

Types: intro | segment | transition | ad-break | outro`,
      },
    ];

    const raw = await aiProviderService.prompt(messages);

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title ?? topic,
          sections: parsed.sections ?? [],
          totalEstimatedMinutes: parsed.totalEstimatedMinutes ?? 0,
        };
      }
    } catch {
      // fallback
    }

    return {
      title: topic,
      sections: [{ type: 'segment', title: 'Main Content', content: raw, estimatedSeconds: 300 }],
      totalEstimatedMinutes: 5,
    };
  }

  async improveText(text: string, instruction: string, onChunk?: (c: string) => void): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Improve this podcast script section.\nInstruction: ${instruction}\n\nOriginal:\n${text}`,
      },
    ];
    return aiProviderService.prompt(messages, { onChunk });
  }

  async generateIntro(topic: string, hostName?: string): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Write a 30-second podcast intro for an episode about "${topic}".${hostName ? ` Host: ${hostName}.` : ''} Make it engaging and hook the listener.`,
      },
    ];
    return aiProviderService.prompt(messages);
  }

  async generateOutro(topic: string, showName?: string): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Write a 20-second podcast outro for an episode about "${topic}".${showName ? ` Show: ${showName}.` : ''} Include a CTA to subscribe and leave a review.`,
      },
    ];
    return aiProviderService.prompt(messages);
  }

  async rewriteForClarity(text: string, onChunk?: (c: string) => void): Promise<string> {
    return this.improveText(text, 'Rewrite for clarity, natural spoken delivery, and audience engagement', onChunk);
  }
}

export const scriptAssistantService = new ScriptAssistantService();
