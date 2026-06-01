import type { MixRecommendation, AIMessage } from '../types';
import { PROCESSING_RANGES, QUALITY_OUTCOMES, evaluateRange } from '../types';
import { formatGenreForPrompt } from '../genreProfiles';
import type { GenreProfile } from '../genreProfiles';
import { aiProviderService } from '../aiProviderService';

// ─── Range tables formatted for AI prompts ────────────────────────────────────

const R = PROCESSING_RANGES;

const RANGE_PROMPT = `
PROCESSING RANGES — aim for the gold zone; adapt to actual voice/mic/room.
There is no single correct setting. These are professional reference ranges.

COMPRESSION
| Parameter      | Min     | ← Gold Zone →   | Max      |
|----------------|---------|-----------------|----------|
| Ratio          | 1.5:1   | 2.5:1 – 4:1     | 8:1      |
| Gain Reduction | 1 dB    | 3 – 6 dB        | 10+ dB   |
| Attack         | 1 ms    | 10 – 30 ms      | 100 ms   |
| Release        | 25 ms   | 50 – 150 ms     | 500 ms   |

Adapt compression by voice character:
• Deep, resonant voice → ratio at lower end (2.5:1), slower attack (20–30 ms) to preserve natural weight
• High-energy, loud speaker → higher ratio (4:1), faster attack (5–10 ms) to control peaks
• Quiet, intimate speaker → light ratio (2:1), adjust gain to keep voice in gold zone
• Dynamic storyteller → avoid over-compression; preserve expression with moderate ratio

EQ
| Parameter        | Min   | ← Gold Zone → | Max    |
|-----------------|-------|----------------|--------|
| HPF cutoff       | 40 Hz | 70 – 90 Hz     | 120 Hz |
| Presence boost   | 0 dB  | +2 – +4 dB     | +8 dB  |
| Mud reduction    | 0 dB  | −2 – −4 dB     | −8 dB  |

Adapt EQ by voice character:
• Close-mic'ed deep voice → HPF higher (90–100 Hz), minimal presence boost
• USB mic or webcam → more presence boost may be needed (+3–4 dB)
• Treated room → little or no mud reduction needed
• Small/untreated room → more mud reduction; possibly higher HPF

DE-ESSER (only if sibilance is actually harsh)
| Parameter   | Min  | ← Gold Zone → | Max   |
|-------------|------|----------------|-------|
| Reduction   | 1 dB | 2 – 5 dB       | 8 dB  |

Adapt de-esser:
• Female voice or bright condenser mic → more likely to need de-essing
• Male voice with dynamic mic (SM7B, etc.) → often no de-essing needed
• Always check: after de-essing, consonants must still sound crisp, not lispy

NOISE REDUCTION
| Parameter   | Min  | ← Gold Zone → | Max   |
|-------------|------|----------------|-------|
| Reduction   | 0 dB | 3 – 8 dB       | 15 dB |

Adapt noise reduction:
• Treated room with low noise floor → 0 dB (no reduction needed)
• Light background hum → 3–5 dB is usually enough
• Noisy room → 6–8 dB, check for artifacts after; if metallic/watery, reduce
• Never exceed the gold zone maximum to chase a cleaner sound

QUALITY OUTCOMES (what each extreme sounds like to the listener)
| Category        | Fail (under)               | Gold Zone             | Overprocessed          |
|-----------------|----------------------------|-----------------------|------------------------|
| Noise Reduction | ${QUALITY_OUTCOMES.noiseReduction.fail} | ${QUALITY_OUTCOMES.noiseReduction.gold} | ${QUALITY_OUTCOMES.noiseReduction.over} |
| EQ              | ${QUALITY_OUTCOMES.eq.fail}             | ${QUALITY_OUTCOMES.eq.gold}             | ${QUALITY_OUTCOMES.eq.over}             |
| Compression     | ${QUALITY_OUTCOMES.compression.fail}    | ${QUALITY_OUTCOMES.compression.gold}    | ${QUALITY_OUTCOMES.compression.over}    |
| De-Esser        | ${QUALITY_OUTCOMES.deEsser.fail}        | ${QUALITY_OUTCOMES.deEsser.gold}        | ${QUALITY_OUTCOMES.deEsser.over}        |
`;

// ─── 10-step cleanup chain ────────────────────────────────────────────────────

const DIALOGUE_CLEANUP_CHAIN = [
  '1. Remove obvious mistakes — false starts, repeated lines, flubbed words',
  '2. Trim long silence — remove dead air longer than 2–3 seconds',
  '3. Reduce background noise — aim for gold zone (3–8 dB reduction); check for artifacts at each step',
  '4. Remove hum/buzz if present — notch filter at 50/60 Hz or nearby harmonics',
  '5. Apply EQ — HPF in gold zone (70–90 Hz); correct muddiness or harshness; presence boost only if voice lacks clarity',
  '6. Apply compression — ratio in gold zone (2.5:1–4:1); adapt to voice character; avoid over-compression',
  '7. Apply de-esser if needed — only if sibilance is genuinely harsh; aim for 2–5 dB reduction',
  '8. Balance speaker levels — all voices at consistent, comfortable listening level',
  '9. Add music/sound effects — music in gold zone (−24 to −18 dB below voice)',
  '10. Master final mix — limiter at −1 dBTP (gold); target −16 LUFS stereo / −19 LUFS mono',
];

class MixingService {
  getDialogueCleanupChain(): string[] { return DIALOGUE_CLEANUP_CHAIN; }

  getProcessingRanges() { return PROCESSING_RANGES; }

  getQualityOutcomes() { return QUALITY_OUTCOMES; }

  /**
   * Evaluate loudness compliance using the stereo/mono gold zones.
   * Returns position within the Min/Gold/Max range.
   */
  evaluateLoudness(measuredLUFS: number, isMono = false): {
    position: string;
    pass: boolean;
    target: number;
    note: string;
    adjustment: string;
  } {
    const range = isMono ? R.loudness.monoLUFS : R.loudness.stereoLUFS;
    const pos = evaluateRange(measuredLUFS, range);
    const target = range.goldLow;
    const diff = measuredLUFS - target;

    const notes: Record<string, string> = {
      'below-min':  `Too quiet (${measuredLUFS} LUFS — below ${range.min} LUFS minimum)`,
      'below-gold': `Below gold zone (${measuredLUFS} LUFS — target is ${target} LUFS)`,
      'gold':       `In gold zone (${measuredLUFS} LUFS ≈ ${target} LUFS target) ✓`,
      'above-gold': `Above gold zone (${measuredLUFS} LUFS — upper limit is ${range.max} LUFS)`,
      'above-max':  `Too loud (${measuredLUFS} LUFS — above ${range.max} LUFS max; risk of listener fatigue)`,
    };

    const adjustments: Record<string, string> = {
      'below-min':  `Increase output gain by ~${Math.abs(diff).toFixed(1)} LU`,
      'below-gold': `Increase output gain by ~${Math.abs(diff).toFixed(1)} LU`,
      'gold':       'No adjustment needed',
      'above-gold': `Reduce output gain by ~${Math.abs(diff).toFixed(1)} LU`,
      'above-max':  `Reduce output gain by ~${Math.abs(diff).toFixed(1)} LU`,
    };

    return {
      position: pos,
      pass: pos === 'gold' || pos === 'above-gold',
      target,
      note: notes[pos],
      adjustment: adjustments[pos],
    };
  }

  async generateMixRecommendations(
    style: string,
    recordingNotes: string,
    measuredLUFS?: number,
    isMono = false,
    speakerCount = 1,
    voiceCharacter = '',
    micType = '',
    roomCondition = '',
    genreProfile?: GenreProfile,
  ): Promise<MixRecommendation> {
    const loudnessRange = isMono ? R.loudness.monoLUFS : R.loudness.stereoLUFS;
    const targetLUFS = loudnessRange.goldLow;
    const loudnessEval = measuredLUFS !== undefined ? this.evaluateLoudness(measuredLUFS, isMono) : null;

    const genreBlock = genreProfile
      ? `\n${formatGenreForPrompt(genreProfile, 'mixing')}\n`
      : '';

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a professional podcast mix engineer. Aim for the gold zone in every parameter. Adapt all settings to the actual voice, microphone, room conditions, and genre profile. Never hard-code fixed values when context requires different settings. Respond with valid JSON only.`,
      },
      {
        role: 'user',
        content: `Provide adaptive mixing recommendations for this podcast episode.

CONTEXT
Style: ${style} | Channel: ${isMono ? 'Mono' : 'Stereo'} | Speakers: ${speakerCount}
Voice character: ${voiceCharacter || 'not specified — use balanced gold-zone defaults'}
Microphone: ${micType || 'not specified — use balanced gold-zone defaults'}
Room: ${roomCondition || 'not specified — assume some treatment needed'}
Recording notes: ${recordingNotes || 'none'}
${measuredLUFS !== undefined ? `Measured loudness: ${measuredLUFS} LUFS (${loudnessEval?.note ?? ''})` : 'Loudness: not yet measured'}
${genreBlock}
${RANGE_PROMPT}

Provide specific settings that are adapted to this voice/mic/room and genre profile, staying within the gold zones unless context requires adjustment. When a genre profile is present, use its processing targets as the primary guide. Explain each choice.

JSON:
{
  "loudnessNote": "current loudness assessment and recommendation",
  "targetLUFS": ${targetLUFS},
  "loudnessPass": ${loudnessEval?.pass ?? false},
  "eqSuggestions": ["HPF at X Hz because... (adapted to voice/room)", "..."],
  "compressionSuggestions": ["ratio X:1 because this voice... attack Y ms because...", "..."],
  "balanceNotes": ["speaker balance note"],
  "stereoNotes": "mono/stereo note",
  "consistencyScore": 75,
  "overallReport": "Adaptive summary: what settings suit this specific voice/mic/room and why"
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

    // Fallback — return gold-zone defaults with context note
    return {
      loudnessNote: loudnessEval?.note ?? `Target: ${targetLUFS} LUFS (not yet measured)`,
      targetLUFS,
      measuredLUFS,
      loudnessPass: loudnessEval?.pass ?? false,
      eqSuggestions: [
        `HPF at ${R.eq.hpfHz.goldLow}–${R.eq.hpfHz.goldHigh} Hz (adapt higher for close-mic'ed deep voice)`,
        `Presence boost in gold zone (+${R.eq.presenceBoostDB.goldLow} to +${R.eq.presenceBoostDB.goldHigh} dB) only if voice lacks clarity`,
        `Mud reduction cut in gold zone (${R.eq.mudReductionDB.goldLow}–${R.eq.mudReductionDB.goldHigh} dB) if voice sounds boxy`,
      ],
      compressionSuggestions: [
        `Ratio in gold zone (${R.compression.ratio.goldLow}:1 to ${R.compression.ratio.goldHigh}:1) — adapt to voice energy`,
        `Attack ${R.compression.attackMS.goldLow}–${R.compression.attackMS.goldHigh} ms — slower for deliberate speech, faster for energetic`,
        `Release ${R.compression.releaseMS.goldLow}–${R.compression.releaseMS.goldHigh} ms — shorter for fast talkers`,
        `Target gain reduction in gold zone (${R.compression.gainReductionDB.goldLow}–${R.compression.gainReductionDB.goldHigh} dB)`,
      ],
      balanceNotes: speakerCount > 1 ? ['Match all speakers to same perceived level'] : [],
      stereoNotes: isMono ? 'Mono — check for any phase anomalies' : 'Stereo — keep dialogue centre; music and effects in stereo field',
      consistencyScore: 0,
      overallReport: `Context-adapted mix starting point. Adjust within gold zones based on the specific voice character and room conditions.`,
    };
  }
}

export const mixingService = new MixingService();
