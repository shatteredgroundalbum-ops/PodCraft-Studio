import type { MixRecommendation, AIMessage } from '../types';
import { aiProviderService } from '../aiProviderService';

class MixingService {
  evaluateLoudness(measuredLUFS: number, targetLUFS = -16): { pass: boolean; note: string; adjustment: string } {
    const diff = measuredLUFS - targetLUFS;
    const pass = Math.abs(diff) <= 2;
    return {
      pass,
      note: pass
        ? `Within range of target ${targetLUFS} LUFS`
        : `${Math.abs(diff) > 6 ? 'Significantly' : 'Slightly'} ${diff > 0 ? 'above' : 'below'} target`,
      adjustment: pass ? 'No adjustment needed' : `${diff > 0 ? 'Reduce' : 'Increase'} by ${Math.abs(diff).toFixed(1)} LU`,
    };
  }

  async generateMixRecommendations(
    style: string,
    recordingNotes: string,
    measuredLUFS?: number,
  ): Promise<MixRecommendation> {
    const targetLUFS = style === 'Radio' ? -14 : style === 'Natural' ? -19 : -16;
    const loudnessPass = measuredLUFS !== undefined ? Math.abs(measuredLUFS - targetLUFS) <= 2 : false;

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are a professional podcast mix engineer. Provide specific, actionable mixing recommendations. Respond with valid JSON.',
      },
      {
        role: 'user',
        content: `Mixing recommendations for a ${style}-style podcast.
${measuredLUFS !== undefined ? `Measured: ${measuredLUFS} LUFS | Target: ${targetLUFS} LUFS` : `Target: ${targetLUFS} LUFS`}
Notes: ${recordingNotes || 'Standard recording, no specific issues noted'}

Respond with JSON:
{
  "loudnessNote": "...",
  "targetLUFS": ${targetLUFS},
  "loudnessPass": ${loudnessPass},
  "eqSuggestions": ["high-pass at Xhz", "..."],
  "compressionSuggestions": ["ratio X:1", "..."],
  "balanceNotes": ["..."],
  "stereoNotes": "...",
  "consistencyScore": 78,
  "overallReport": "..."
}`,
      },
    ];

    const raw = await aiProviderService.prompt(messages);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]) as MixRecommendation;
        if (measuredLUFS !== undefined) parsed.measuredLUFS = measuredLUFS;
        return parsed;
      }
    } catch { /* ignore */ }

    return {
      loudnessNote: 'Analysis unavailable',
      targetLUFS,
      measuredLUFS,
      loudnessPass,
      eqSuggestions: [],
      compressionSuggestions: [],
      balanceNotes: [],
      stereoNotes: '',
      consistencyScore: 0,
      overallReport: raw.slice(0, 300),
    };
  }

  async analyzeStereoField(notes: string, onChunk?: (c: string) => void): Promise<string> {
    return aiProviderService.prompt([{
      role: 'user',
      content: `Provide stereo field recommendations for a podcast recording.
Notes: ${notes || 'standard mono vocal recording'}
Cover: mono compatibility, panning, stereo width. Keep it practical.`,
    }], { onChunk });
  }
}

export const mixingService = new MixingService();
