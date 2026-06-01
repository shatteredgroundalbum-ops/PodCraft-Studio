import type { ResearchResult, AIMessage } from './types';
import { aiProducerService } from './aiProducerService';

class ResearchAssistantService {
  async generateResearch(topic: string, notes?: string): Promise<ResearchResult> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `I'm creating a podcast episode about: "${topic}"\n${notes ? `My notes: ${notes}\n` : ''}
Please help me with:
1. A 5-point episode outline
2. 5 research questions to investigate
3. 5 key points my audience should know
4. A suggested unique angle for this episode

Format as JSON with keys: outline (array), researchQuestions (array), keyPoints (array), suggestedAngle (string).`,
      },
    ];

    const raw = await aiProducerService.runTask('research', messages);

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          topic,
          outline: parsed.outline ?? [],
          researchQuestions: parsed.researchQuestions ?? [],
          keyPoints: parsed.keyPoints ?? [],
          suggestedAngle: parsed.suggestedAngle ?? '',
        };
      }
    } catch {
      // fallback: parse as plain text
    }

    const lines = raw.split('\n').filter((l) => l.trim());
    return {
      topic,
      outline: lines.slice(0, 5),
      researchQuestions: [],
      keyPoints: [],
      suggestedAngle: '',
    };
  }

  async askFollowUp(question: string, context: string, onChunk?: (c: string) => void): Promise<string> {
    const messages: AIMessage[] = [
      { role: 'system', content: `Context: Researching podcast episode about: ${context}` },
      { role: 'user', content: question },
    ];
    return aiProducerService.runTask('research', messages, { onChunk });
  }
}

export const researchAssistantService = new ResearchAssistantService();
