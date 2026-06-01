import type {
  EpisodeBlueprint, EpisodeConcept, EpisodePlan, EpisodeSegment,
  ChecklistItem, AIMessage, ProductionStage,
} from '../types';
import { aiProducerService } from '../aiProducerService';

const SYS = 'You are an expert podcast producer and showrunner. Respond with valid JSON when requested.';

class PlanningService {
  async generateTopicIdeas(showContext: string, recentTopics: string[] = [], count = 6): Promise<string[]> {
    const raw = await aiProducerService.runTask('planning', [
      { role: 'system', content: SYS },
      {
        role: 'user',
        content: `Generate ${count} fresh podcast episode topic ideas for: "${showContext}".${recentTopics.length ? `\nAvoid repeating: ${recentTopics.join(', ')}.` : ''}
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
    purpose = '',
    tone = '',
  ): Promise<EpisodeBlueprint> {
    const messages: AIMessage[] = [
      { role: 'system', content: SYS },
      {
        role: 'user',
        content: `Build a complete episode production blueprint for:
Topic: "${topic}" | Show: "${showName || 'podcast'}" | Format: ${format}
Audience: "${audience || 'general listeners'}"
${purpose ? `Purpose: ${purpose}` : ''}
${tone ? `Tone: ${tone}` : ''}

Respond with JSON:
{
  "plan": {
    "concept": {
      "title": "compelling episode title",
      "premise": "2-3 sentence episode premise",
      "targetAudience": "specific audience description",
      "format": "${format}",
      "estimatedDuration": "35-45 minutes",
      "uniqueAngle": "what makes this episode stand out"
    },
    "segments": [
      { "name": "Intro", "type": "intro", "durationMinutes": 3, "description": "Hook and overview", "talkingPoints": ["..."] }
    ],
    "guestSuggestions": ["type of guest or expert needed"],
    "contentStrategy": "how this episode fits the show strategy",
    "publishingNote": "suggested timing or scheduling notes",
    "purpose": "${purpose || 'educate and entertain'}",
    "tone": "${tone || 'conversational and engaging'}",
    "requiredMusicOrSFX": ["intro music", "transition sting"],
    "deliveryGoal": "what the listener should know/feel/do after listening"
  },
  "checklist": [
    { "id": "planning-0", "stage": "planning", "task": "Confirm episode topic and angle", "required": true, "completed": false }
  ],
  "estimatedProductionHours": 8
}

Include 5-8 segments. Include 16-20 checklist items covering ALL production stages (planning through distribution). Each stage must have at least 2 checklist items.`,
      },
    ];

    const raw = await aiProducerService.runTask('planning', messages);
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
        concept: {
          title: topic,
          premise: `Episode about ${topic}`,
          targetAudience: audience || 'podcast listeners',
          format,
          estimatedDuration: '35-45 minutes',
          uniqueAngle: '',
        },
        segments: this.defaultSegments(),
        guestSuggestions: [],
        contentStrategy: '',
        publishingNote: '',
        purpose: purpose || 'Educate and entertain the audience',
        tone: tone || 'Conversational and engaging',
        requiredMusicOrSFX: ['Intro/outro music', 'Transition stings'],
        deliveryGoal: 'Listener leaves with actionable insights on the topic',
      },
      checklist: this.defaultChecklist(),
      estimatedProductionHours: 8,
    };
  }

  async generateContentStrategy(showName: string, episodesPerMonth: number, onChunk?: (c: string) => void): Promise<string> {
    return aiProducerService.runTask('planning', [{
      role: 'user',
      content: `Create a 3-month content strategy for "${showName}" publishing ${episodesPerMonth} episodes/month.
Cover: episode themes, guest types, audience engagement tactics, growth opportunities, seasonal relevance.
Be specific and actionable. Under 300 words.`,
    }], { onChunk });
  }

  async generateAudienceAnalysis(showName: string, topic: string, onChunk?: (c: string) => void): Promise<string> {
    return aiProducerService.runTask('planning', [{
      role: 'user',
      content: `Analyse the target audience for a podcast episode about "${topic}" on the show "${showName}".
Cover: demographics, interests, knowledge level, why they'd tune in, what they need to hear.
Keep it concise and actionable for a podcast producer.`,
    }], { onChunk });
  }

  private defaultSegments(): EpisodeSegment[] {
    return [
      { name: 'Intro', type: 'intro', durationMinutes: 2, description: 'Hook and episode overview', talkingPoints: ['Opening hook', 'What listeners will learn'] },
      { name: 'Main Content', type: 'main', durationMinutes: 28, description: 'Core episode content', talkingPoints: [] },
      { name: 'Outro', type: 'outro', durationMinutes: 2, description: 'Summary and CTA', talkingPoints: ['Key takeaways', 'Subscribe / review CTA'] },
    ];
  }

  private defaultChecklist(): ChecklistItem[] {
    const items: { stage: ProductionStage; task: string; required: boolean }[] = [
      // Planning
      { stage: 'planning', task: 'Define episode topic, purpose, and delivery goal', required: true },
      { stage: 'planning', task: 'Identify target audience and listener value', required: true },
      { stage: 'planning', task: 'Confirm episode format and estimated length', required: true },
      { stage: 'planning', task: 'Identify required guests, music, or sound effects', required: false },
      // Pre-production
      { stage: 'pre-production', task: 'Complete research package and source collection', required: true },
      { stage: 'pre-production', task: 'Generate or write episode outline', required: true },
      { stage: 'pre-production', task: 'Write and review episode script', required: false },
      { stage: 'pre-production', task: 'Prepare interview questions if applicable', required: false },
      // Production
      { stage: 'production', task: 'Run recording readiness check (mic, levels, room)', required: true },
      { stage: 'production', task: 'Record episode — no clipping, clean signal', required: true },
      { stage: 'production', task: 'Review raw recording for obvious issues', required: true },
      // Post-production
      { stage: 'post-production', task: 'Remove mistakes, false starts, and long silences', required: true },
      { stage: 'post-production', task: 'Reduce filler words and pacing issues', required: true },
      { stage: 'post-production', task: 'Apply noise reduction if needed', required: false },
      // Mixing
      { stage: 'mixing', task: 'Apply EQ and compression following cleanup chain', required: true },
      { stage: 'mixing', task: 'Balance all speaker and music levels', required: true },
      // Mastering
      { stage: 'mastering', task: 'Apply limiter at −1 dBTP true peak ceiling', required: true },
      { stage: 'mastering', task: 'Verify integrated loudness target is met', required: true },
      // Packaging
      { stage: 'packaging', task: 'Write episode description, show notes, and keywords', required: true },
      { stage: 'packaging', task: 'Generate social media copy for all platforms', required: true },
      // Distribution
      { stage: 'distribution', task: 'Export final master in correct format and bitrate', required: true },
      { stage: 'distribution', task: 'Confirm all metadata is complete before upload', required: true },
    ];
    return items.map((item, i) => ({
      id: `${item.stage}-${i}`,
      stage: item.stage,
      task: item.task,
      required: item.required,
      completed: false,
    }));
  }
}

export const planningService = new PlanningService();
