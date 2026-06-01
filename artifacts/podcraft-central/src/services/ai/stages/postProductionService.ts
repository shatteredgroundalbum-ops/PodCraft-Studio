import type { EditRecommendation, AIMessage } from '../types';
import { aiProducerService } from '../aiProducerService';

class PostProductionService {
  async generateEditRecommendations(
    durationMinutes: number,
    recordingNotes: string,
    format = 'solo',
  ): Promise<EditRecommendation> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are an expert podcast audio editor. Provide practical, actionable editing recommendations. Respond with valid JSON.',
      },
      {
        role: 'user',
        content: `Edit recommendations for a ${format} podcast episode.
Duration: ${durationMinutes} minutes | Notes: ${recordingNotes || 'No specific notes'}

Respond with JSON:
{
  "editPoints": [
    { "timestampApprox": "0:30-1:00", "type": "silence|filler|noise|mistake|pacing", "description": "...", "recommendation": "cut|fade|reduce|keep", "severity": "high|medium|low" }
  ],
  "fillerWordEstimate": 12,
  "totalSilenceEstimateSeconds": 45,
  "estimatedEditSavingsMinutes": 3,
  "cleanupSuggestions": ["..."],
  "assemblyOrder": ["Intro", "Segment 1", "..."],
  "trackOrganizationNotes": "..."
}
Provide 4-8 edit points and 4-6 cleanup suggestions.`,
      },
    ];

    const raw = await aiProducerService.runTask('post-production', messages);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]) as EditRecommendation;
    } catch { /* ignore */ }

    return {
      editPoints: [],
      fillerWordEstimate: 0,
      totalSilenceEstimateSeconds: 0,
      estimatedEditSavingsMinutes: 0,
      cleanupSuggestions: raw.split('\n').filter(l => l.trim()).slice(0, 5),
      assemblyOrder: [],
      trackOrganizationNotes: '',
    };
  }

  detectFillerWords(transcript: string): { word: string; count: number }[] {
    const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'right', 'so', 'kind of', 'sort of', 'i mean', 'you see'];
    const lower = transcript.toLowerCase();
    return fillers
      .map(word => ({
        word,
        count: (lower.match(new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'g')) ?? []).length,
      }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => b.count - a.count);
  }

  async generateCleanupPlan(recordingNotes: string, fillerSummary: string, onChunk?: (c: string) => void): Promise<string> {
    return aiProducerService.runTask('post-production', [{
      role: 'user',
      content: `Create a concise audio cleanup plan for this podcast recording.
Recording notes: ${recordingNotes || 'standard recording'}
Filler words found: ${fillerSummary || 'not analyzed'}
Provide 6-8 specific, prioritized cleanup steps.`,
    }], { onChunk });
  }

  async generateNoiseAnalysis(recordingNotes: string, onChunk?: (c: string) => void): Promise<string> {
    return aiProducerService.runTask('post-production', [{
      role: 'user',
      content: `Analyze and provide noise reduction recommendations for a podcast recording.
Notes: ${recordingNotes || 'no specific noise issues noted'}
Cover: noise floor reduction, room treatment, spectral repair priorities. Be specific and actionable.`,
    }], { onChunk });
  }
}

export const postProductionService = new PostProductionService();
