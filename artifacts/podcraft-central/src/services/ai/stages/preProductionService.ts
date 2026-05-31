import type { ResearchPackage, EpisodeOutline, AIMessage, EpisodeConcept } from '../types';
import { aiProviderService } from '../aiProviderService';

const SYS = 'You are an expert podcast research assistant and pre-production specialist. Respond with valid JSON when requested.';

class PreProductionService {
  async generateResearchPackage(topic: string, concept?: Partial<EpisodeConcept>): Promise<ResearchPackage> {
    const messages: AIMessage[] = [
      { role: 'system', content: SYS },
      {
        role: 'user',
        content: `Create a comprehensive research package for a podcast episode about: "${topic}".
${concept?.uniqueAngle ? `Angle: ${concept.uniqueAngle}` : ''}
${concept?.targetAudience ? `Audience: ${concept.targetAudience}` : ''}

Respond with JSON:
{
  "topic": "${topic}",
  "sources": [{ "title": "...", "type": "article|book|study|data|expert|other", "notes": "...", "reliability": "high|medium|low" }],
  "keyFacts": ["..."],
  "statistics": ["..."],
  "controversies": ["..."],
  "expertPerspectives": ["..."]
}
Include 5-7 sources, 5+ key facts, 3+ statistics, 2+ controversies, 3+ expert perspectives.`,
      },
    ];

    const raw = await aiProviderService.prompt(messages);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]) as ResearchPackage;
    } catch { /* ignore */ }

    return {
      topic,
      sources: [],
      keyFacts: raw.split('\n').filter(l => l.trim()).slice(0, 5),
      statistics: [],
      controversies: [],
      expertPerspectives: [],
    };
  }

  async generateOutline(
    topic: string,
    angle = '',
    audience = '',
    durationMinutes = 40,
    format: EpisodeConcept['format'] = 'solo',
  ): Promise<EpisodeOutline> {
    const messages: AIMessage[] = [
      { role: 'system', content: SYS },
      {
        role: 'user',
        content: `Create a detailed episode outline for: "${topic}"
Angle: ${angle || 'general exploration'} | Audience: ${audience || 'podcast listeners'} | Format: ${format} | Duration: ~${durationMinutes} min

Respond with JSON:
{
  "title": "...",
  "sections": [{ "title": "...", "type": "intro|main|interview-question|sponsor|transition|outro", "estimatedMinutes": 3, "talkingPoints": ["..."], "notes": "" }],
  "totalEstimatedMinutes": ${durationMinutes},
  "interviewQuestions": ["..."],
  "sponsorPlacements": ["Pre-roll (0:00-0:30)"],
  "productionNotes": "..."
}
Include 6-10 sections.`,
      },
    ];

    const raw = await aiProviderService.prompt(messages);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]) as EpisodeOutline;
    } catch { /* ignore */ }

    return {
      title: topic,
      sections: [],
      totalEstimatedMinutes: durationMinutes,
      interviewQuestions: [],
      sponsorPlacements: [],
      productionNotes: raw.slice(0, 300),
    };
  }

  async generateInterviewQuestions(guestName: string, topic: string, angle = ''): Promise<string[]> {
    const raw = await aiProviderService.prompt([{
      role: 'user',
      content: `Generate 12 thoughtful interview questions for a podcast conversation with ${guestName} about "${topic}".${angle ? ` Angle: ${angle}` : ''}
Include: warm-up, core exploration, unique insights, audience value questions, and a memorable closer.
JSON: { "questions": ["..."] }`,
    }]);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return (JSON.parse(m[0]).questions ?? []) as string[];
    } catch { /* ignore */ }
    return raw.split('\n').filter(l => l.match(/^\d+\.|^-|^•/)).slice(0, 12).map(l => l.replace(/^[\d.\-•\s]+/, ''));
  }

  async generateProductionNotes(topic: string, format: string, specialRequirements = '', onChunk?: (c: string) => void): Promise<string> {
    return aiProviderService.prompt([{
      role: 'user',
      content: `Write concise production notes for a ${format} podcast episode about "${topic}".${specialRequirements ? ` Special requirements: ${specialRequirements}` : ''}
Cover: recording setup, timing, and any special considerations. Under 200 words.`,
    }], { onChunk });
  }
}

export const preProductionService = new PreProductionService();
