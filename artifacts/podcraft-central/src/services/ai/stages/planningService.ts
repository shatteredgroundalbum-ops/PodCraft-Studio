import type {
  EpisodeBlueprint, EpisodeConcept, EpisodePlan, EpisodeSegment,
  ChecklistItem, AIMessage, ProductionStage,
} from '../types';
import { aiProviderService } from '../aiProviderService';

const SYS = 'You are an expert podcast producer and showrunner with 10+ years of experience. Respond with valid JSON when requested.';

class PlanningService {
  async generateTopicIdeas(showContext: string, recentTopics: string[] = [], count = 5): Promise<string[]> {
    const raw = await aiProviderService.prompt([
      { role: 'system', content: SYS },
      {
        role: 'user',
        content: `Generate ${count} fresh podcast episode topic ideas for: "${showContext}".${recentTopics.length ? `\nAvoid: ${recentTopics.join(', ')}.` : ''}
Respond with JSON: { "topics": ["topic 1", ...] }`,
      },
    ]);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return (JSON.parse(m[0]).topics ?? []) as string[];
    } catch { /* ignore */ }
    return raw.split('\n').filter(l => l.trim()).slice(0, count);
  }

  async generateBlueprint(
    topic: string,
    audience = '',
    format: EpisodeConcept['format'] = 'solo',
    showName = '',
  ): Promise<EpisodeBlueprint> {
    const messages: AIMessage[] = [
      { role: 'system', content: SYS },
      {
        role: 'user',
        content: `Build a complete episode production blueprint.
Topic: "${topic}" | Show: "${showName || 'podcast'}" | Audience: "${audience || 'general listeners'}" | Format: ${format}

Respond with JSON:
{
  "plan": {
    "concept": { "title": "...", "premise": "...", "targetAudience": "...", "format": "${format}", "estimatedDuration": "35-45 minutes", "uniqueAngle": "..." },
    "segments": [{ "name": "...", "type": "intro", "durationMinutes": 3, "description": "...", "talkingPoints": ["..."] }],
    "guestSuggestions": ["..."],
    "contentStrategy": "...",
    "publishingNote": "..."
  },
  "checklist": [{ "id": "1", "stage": "planning", "task": "...", "required": true, "completed": false }],
  "estimatedProductionHours": 8
}
Include 5-8 segments and 12-15 checklist items spanning all production stages.`,
      },
    ];

    const raw = await aiProviderService.prompt(messages);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const p = JSON.parse(m[0]);
        return {
          plan: p.plan as EpisodePlan,
          checklist: (p.checklist ?? []) as ChecklistItem[],
          estimatedProductionHours: (p.estimatedProductionHours ?? 8) as number,
        };
      }
    } catch { /* ignore */ }

    return {
      plan: {
        concept: { title: topic, premise: '', targetAudience: audience, format, estimatedDuration: '35-45 minutes', uniqueAngle: '' },
        segments: this.defaultSegments(),
        guestSuggestions: [],
        contentStrategy: '',
        publishingNote: '',
      },
      checklist: this.defaultChecklist(),
      estimatedProductionHours: 8,
    };
  }

  async generateContentStrategy(showName: string, episodesPerMonth: number, onChunk?: (c: string) => void): Promise<string> {
    return aiProviderService.prompt([
      { role: 'user', content: `Create a 3-month content strategy for "${showName}" publishing ${episodesPerMonth} episodes/month. Cover: themes, guest types, engagement tactics, growth opportunities. Be concise and actionable.` },
    ], { onChunk });
  }

  private defaultSegments(): EpisodeSegment[] {
    return [
      { name: 'Intro', type: 'intro', durationMinutes: 2, description: 'Hook and overview', talkingPoints: [] },
      { name: 'Main Content', type: 'main', durationMinutes: 28, description: 'Core episode content', talkingPoints: [] },
      { name: 'Outro', type: 'outro', durationMinutes: 2, description: 'Summary and CTA', talkingPoints: [] },
    ];
  }

  private defaultChecklist(): ChecklistItem[] {
    const stages: { stage: ProductionStage; tasks: string[] }[] = [
      { stage: 'planning', tasks: ['Define episode topic and angle', 'Identify target audience', 'Confirm episode format'] },
      { stage: 'pre-production', tasks: ['Complete research package', 'Generate episode outline', 'Write or prepare script'] },
      { stage: 'production', tasks: ['Check mic and room acoustics', 'Record episode', 'Review raw recording for obvious issues'] },
      { stage: 'post-production', tasks: ['Edit out mistakes and long pauses', 'Remove filler words', 'Assemble final edit'] },
      { stage: 'mixing', tasks: ['Balance all tracks', 'Apply EQ and compression', 'Verify mix loudness'] },
      { stage: 'mastering', tasks: ['Apply final limiter', 'Hit target LUFS', 'Export mastered file'] },
      { stage: 'packaging', tasks: ['Write episode description and show notes', 'Generate keywords', 'Create social media copy'] },
      { stage: 'distribution', tasks: ['Export in correct format and bitrate', 'Upload to hosting platform', 'Schedule or publish'] },
    ];
    return stages.flatMap(({ stage, tasks }) =>
      tasks.map((task, i) => ({ id: `${stage}-${i}`, stage, task, required: true, completed: false }))
    );
  }
}

export const planningService = new PlanningService();
