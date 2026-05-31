import type { MixRecommendation, AIMessage } from '../types';
import { PODCAST_STANDARDS } from '../types';
import { aiProviderService } from '../aiProviderService';

// Dialogue cleanup chain — ordered processing steps (per PodCraft standard)
const DIALOGUE_CLEANUP_CHAIN = [
  '1. Remove obvious mistakes — false starts, repeated lines, flubbed words',
  '2. Trim long silence — remove dead air longer than 2–3 seconds',
  '3. Reduce background noise — fan, HVAC, electrical hum via noise reduction',
  '4. Remove hum/buzz if present — notch filter at 50/60 Hz or nearby harmonics',
  '5. Apply EQ — high-pass rumble; correct muddiness or harshness; subtle presence only if needed',
  '6. Apply compression — control dynamics, improve consistency; avoid pumping or flat speech',
  '7. Apply de-esser (if needed) — target harsh S/SH/Z/CH only; use sparingly',
  '8. Balance speaker levels — all voices at consistent, comfortable listening level',
  '9. Add music/sound effects — music supports speech, never overpowers it',
  '10. Master final mix — limiter at −1 dBTP; target −16 LUFS (stereo) / −19 LUFS (mono)',
];

const EQ_GUIDELINES = [
  'High-pass filter: remove rumble and handling noise below 80–100 Hz',
  'Reduce muddiness: gentle cut at 200–400 Hz if voice sounds boxy or hollow',
  'Reduce harshness: gentle cut at 2–4 kHz if voice sounds harsh or listening is fatiguing',
  'Add presence: gentle boost at 3–5 kHz only if speech lacks clarity — use sparingly',
  'After EQ: voice must still sound natural; do not thin out or artificially colour the voice',
  'Goal: improve clarity and remove problems — not change the person\'s voice character',
];

const COMPRESSION_GUIDELINES = [
  'Goal: reduce sudden loud peaks; bring quiet words to a consistent level',
  'Starting point: ratio 2:1–4:1, threshold −18 to −24 dBFS, attack 5–15 ms, release 80–200 ms',
  'Check for pumping: if the mix "breathes" unnaturally, ease the ratio or slow the attack',
  'Check for flatness: if speech sounds lifeless or robotic, raise the threshold',
  'Preserve natural expression: laughter, emphasis, and emotion should still feel dynamic',
  'Never compress so hard that the voice sounds like a robot or a radio commercial',
];

const DE_ESSER_GUIDELINES = [
  'Use only when S, SH, Z, or CH sounds are genuinely harsh or uncomfortable',
  'Target frequency range: typically 5–8 kHz depending on the voice',
  'Set threshold so it activates only on the harshest sibilants — not constantly',
  'After de-essing: the voice should still sound crisp; over-de-essing creates a lisp',
  'If in doubt, use less — a slight sibilance is better than dull, lisping speech',
];

class MixingService {
  getDialogueCleanupChain(): string[] { return DIALOGUE_CLEANUP_CHAIN; }
  getEQGuidelines(): string[] { return EQ_GUIDELINES; }
  getCompressionGuidelines(): string[] { return COMPRESSION_GUIDELINES; }
  getDeEsserGuidelines(): string[] { return DE_ESSER_GUIDELINES; }

  evaluateLoudness(measuredLUFS: number, isMono = false): { pass: boolean; note: string; adjustment: string } {
    const target = isMono ? PODCAST_STANDARDS.monoTargetLUFS : PODCAST_STANDARDS.stereoTargetLUFS;
    const diff = measuredLUFS - target;
    const pass = Math.abs(diff) <= 2;
    return {
      pass,
      note: pass
        ? `Within acceptable range of ${target} LUFS target`
        : `${Math.abs(diff) > 6 ? 'Significantly' : 'Slightly'} ${diff > 0 ? 'above' : 'below'} the ${target} LUFS target`,
      adjustment: pass ? 'No adjustment needed' : `${diff > 0 ? 'Reduce' : 'Increase'} by ${Math.abs(diff).toFixed(1)} LU`,
    };
  }

  async generateMixRecommendations(
    style: string,
    recordingNotes: string,
    measuredLUFS?: number,
    isMono = false,
    speakerCount = 1,
  ): Promise<MixRecommendation> {
    const targetLUFS = isMono ? PODCAST_STANDARDS.monoTargetLUFS : PODCAST_STANDARDS.stereoTargetLUFS;
    const loudnessPass = measuredLUFS !== undefined ? Math.abs(measuredLUFS - targetLUFS) <= 2 : false;

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are a professional podcast mix engineer. Prioritise speech clarity and listener comfort. Respond with valid JSON.',
      },
      {
        role: 'user',
        content: `Mixing recommendations for a ${style}-style ${isMono ? 'mono' : 'stereo'} podcast.
Speakers: ${speakerCount} | Target: ${targetLUFS} LUFS | True peak ceiling: ${PODCAST_STANDARDS.truePeakCeiling} dBTP
${measuredLUFS !== undefined ? `Measured loudness: ${measuredLUFS} LUFS` : 'No loudness measurement yet'}
Recording notes: ${recordingNotes || 'Standard recording, no specific issues noted'}

Follow the dialogue cleanup chain order. Prioritise: speech intelligibility, then consistency, then comfort.
Do not overprocess. If in doubt, use less.

JSON:
{
  "loudnessNote": "...",
  "targetLUFS": ${targetLUFS},
  "loudnessPass": ${loudnessPass},
  "eqSuggestions": ["high-pass at X Hz", "..."],
  "compressionSuggestions": ["ratio X:1, threshold Y dBFS", "..."],
  "balanceNotes": ["..."],
  "stereoNotes": "mono compatibility note or stereo field note",
  "consistencyScore": 75,
  "overallReport": "Summary: priorities, main issues to address, what's already good"
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
      loudnessNote: 'Loudness analysis unavailable',
      targetLUFS,
      measuredLUFS,
      loudnessPass,
      eqSuggestions: EQ_GUIDELINES.slice(0, 3),
      compressionSuggestions: COMPRESSION_GUIDELINES.slice(0, 2),
      balanceNotes: speakerCount > 1 ? ['Ensure all speakers are at a consistent level'] : [],
      stereoNotes: isMono ? 'Mono — check for phase issues' : 'Stereo — keep dialogue centred',
      consistencyScore: 0,
      overallReport: raw.slice(0, 300),
    };
  }
}

export const mixingService = new MixingService();
