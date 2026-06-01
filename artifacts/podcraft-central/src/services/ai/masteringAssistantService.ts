import type { MasteringRecommendation, AIMessage } from './types';
import { PROCESSING_RANGES, QUALITY_OUTCOMES, evaluateRange } from './types';
import { formatGenreForPrompt, parseGenreLoudness } from './genreProfiles';
import type { GenreProfile } from './genreProfiles';
import { aiProviderService } from './aiProviderService';

const R = PROCESSING_RANGES;

// ─── 9-step mastering chain ───────────────────────────────────────────────────

const MASTERING_CHAIN = [
  '1. Corrective EQ — HPF in gold zone (70–90 Hz); fix any resonances; do not colour the voice',
  '2. Noise cleanup (if needed) — aim for 3–8 dB noise reduction gold zone; stop if artifacts appear',
  '3. Compression — ratio in gold zone (2.5:1–4:1); adapt to voice character; no squashing',
  '4. De-esser (if needed) — 2–5 dB gold zone reduction; check for lisping after',
  '5. Level balancing — all speakers at consistent perceived level',
  '6. Limiter — ceiling at −1 dBTP (gold zone); never allow true peaks above 0 dBFS',
  '7. Loudness normalisation — target −16 LUFS stereo / −19 LUFS mono',
  '8. Final listen-through — verify speech clarity, naturalness, and comfort at normal listening volume',
  '9. Export validation — confirm format, bitrate, sample rate, and metadata',
];

const MASTERING_RANGE_PROMPT = `
MASTERING RANGES — aim for the gold zone; adapt to the specific recording.

LOUDNESS TARGETS
| Channel | Min      | ← Gold Zone → | Max      |
|---------|----------|----------------|----------|
| Stereo  | ${R.loudness.stereoLUFS.min} LUFS | ${R.loudness.stereoLUFS.goldLow} LUFS          | ${R.loudness.stereoLUFS.max} LUFS    |
| Mono    | ${R.loudness.monoLUFS.min} LUFS | ${R.loudness.monoLUFS.goldLow} LUFS          | ${R.loudness.monoLUFS.max} LUFS    |

LIMITER CEILING
| Min      | ← Gold Zone → | Max       |
|----------|----------------|-----------|
| ${R.limiter.ceilingDBTP.min} dBTP | ${R.limiter.ceilingDBTP.goldLow} dBTP (target)   | ${R.limiter.ceilingDBTP.max} dBTP |

QUALITY OUTCOMES
| Category    | Fail (under)                        | Gold Zone                    | Overprocessed           |
|-------------|-------------------------------------|------------------------------|-------------------------|
| Loudness    | ${QUALITY_OUTCOMES.loudness.fail} | ${QUALITY_OUTCOMES.loudness.gold} | ${QUALITY_OUTCOMES.loudness.over} |
| Compression | ${QUALITY_OUTCOMES.compression.fail} | ${QUALITY_OUTCOMES.compression.gold} | ${QUALITY_OUTCOMES.compression.over} |
| EQ          | ${QUALITY_OUTCOMES.eq.fail}          | ${QUALITY_OUTCOMES.eq.gold}          | ${QUALITY_OUTCOMES.eq.over}         |

Key principle: Do NOT chase loudness. A podcast at −16 LUFS that is clear and natural will
always outperform one at −14 LUFS that sounds squashed or fatiguing.
`;

class MasteringAssistantService {
  /** Starting-point presets — ranges, not fixed values. The AI will adapt. */
  getDefaultRecommendation(style: string, isMono = false, genreProfile?: GenreProfile): MasteringRecommendation {
    const stereo = R.loudness.stereoLUFS.goldLow;   // −16
    const mono   = R.loudness.monoLUFS.goldLow;     // −19
    const tp     = R.limiter.ceilingDBTP.goldLow;   // −1

    // Genre loudness overrides the default target when specified
    const genreLUFS = genreProfile ? parseGenreLoudness(genreProfile) : null;
    const targetLUFS = genreLUFS ?? (isMono ? mono : stereo);

    const presets: Record<string, MasteringRecommendation> = {
      Broadcast: {
        eq: `HPF in gold zone (${R.eq.hpfHz.goldLow}–${R.eq.hpfHz.goldHigh} Hz); gentle presence boost (+${R.eq.presenceBoostDB.goldLow}–+${R.eq.presenceBoostDB.goldHigh} dB) if voice lacks clarity`,
        compression: `Ratio in gold zone (2.5:1–4:1 depending on voice dynamics); gain reduction in gold zone (${R.compression.gainReductionDB.goldLow}–${R.compression.gainReductionDB.goldHigh} dB)`,
        deEssing: `De-esser if sibilance is harsh; reduction in gold zone (${R.deEsser.reductionDB.goldLow}–${R.deEsser.reductionDB.goldHigh} dB)`,
        limiting: `Ceiling at ${tp} dBTP (gold zone)`,
        noiseReduction: `Noise reduction in gold zone (${R.noiseReduction.reductionDB.goldLow}–${R.noiseReduction.reductionDB.goldHigh} dB) only if background noise is present`,
        targetLUFS,
        summary: `Broadcast — standard spoken-word delivery. Gold zone: ${targetLUFS} LUFS / ${tp} dBTP. Adapt all settings to the specific voice.`,
      },
      Natural: {
        eq: `HPF at low end of gold zone (${R.eq.hpfHz.goldLow} Hz); avoid boosting; preserve natural air`,
        compression: `Light ratio (${R.compression.ratio.goldLow}:1); slow attack (${R.compression.attackMS.goldHigh} ms) to let transients breathe`,
        deEssing: `De-esser only if voice has harsh sibilance; minimal reduction (${R.deEsser.reductionDB.goldLow}–${R.deEsser.reductionDB.goldLow + 1} dB)`,
        limiting: `Ceiling at ${tp} dBTP; transparent limiting`,
        noiseReduction: `Very light — use only if clearly needed; avoid artifacts`,
        targetLUFS,
        summary: `Natural — preserves dynamics and expression. Gold zone target ${targetLUFS} LUFS / ${tp} dBTP.`,
      },
      Warm: {
        eq: `HPF at gold zone midpoint (~${Math.round((R.eq.hpfHz.goldLow + R.eq.hpfHz.goldHigh) / 2)} Hz); gentle low-mid body if voice is thin`,
        compression: `Moderate ratio (3:1); medium attack to preserve warmth; release in gold zone`,
        deEssing: `Moderate de-essing only if needed; check for lisp after`,
        limiting: `Ceiling at ${tp} dBTP`,
        noiseReduction: `Standard — gold zone reduction (${R.noiseReduction.reductionDB.goldLow}–${R.noiseReduction.reductionDB.goldHigh} dB)`,
        targetLUFS,
        summary: `Warm — intimate, conversational feel. Gold zone target ${targetLUFS} LUFS / ${tp} dBTP.`,
      },
      Clear: {
        eq: `HPF at ${R.eq.hpfHz.goldHigh} Hz; presence boost in gold zone (+${R.eq.presenceBoostDB.goldLow}–+${R.eq.presenceBoostDB.goldHigh} dB) for dialogue clarity`,
        compression: `Ratio up to high end of gold zone (4:1) for consistency; faster attack for busy speech`,
        deEssing: `Moderate de-essing — clarity preset may boost frequencies where sibilance lives; check carefully`,
        limiting: `Ceiling at ${tp} dBTP`,
        noiseReduction: `Moderate noise reduction; stop before metallic artifacts`,
        targetLUFS,
        summary: `Clear — optimised for intelligibility. Gold zone target ${targetLUFS} LUFS / ${tp} dBTP.`,
      },
      MusicHeavy: {
        eq: `Standard HPF; presence boost as needed for voice to cut through music`,
        compression: `Moderate-to-firm ratio (3.5:1–4:1); consistent output level essential when music is present`,
        deEssing: `May need firmer de-essing — brightness of music can make sibilance more noticeable`,
        limiting: `Ceiling at ${tp} dBTP`,
        noiseReduction: `Standard`,
        targetLUFS: R.loudness.stereoLUFS.max,  // −14 LUFS — music-heavy only
        summary: `Music-Heavy — ${R.loudness.stereoLUFS.max} LUFS / ${tp} dBTP. Use only when music is a primary element. Verify voice always remains intelligible.`,
      },
    };

    return presets[style] ?? {
      eq: `HPF in gold zone (${R.eq.hpfHz.goldLow}–${R.eq.hpfHz.goldHigh} Hz); corrective EQ as needed`,
      compression: `Ratio in gold zone; adapt to voice`,
      deEssing: `De-esser only if sibilance is harsh`,
      limiting: `Ceiling at ${tp} dBTP`,
      noiseReduction: `Gold zone noise reduction (${R.noiseReduction.reductionDB.goldLow}–${R.noiseReduction.reductionDB.goldHigh} dB) if needed`,
      targetLUFS,
      summary: `${style} preset. Gold zone target: ${targetLUFS} LUFS / ${tp} dBTP.`,
    };
  }

  getMasteringChain(): string[] { return MASTERING_CHAIN; }

  checkLoudnessCompliance(measuredLUFS: number, isMono = false): {
    position: string;
    pass: boolean;
    target: number;
    verdict: string;
  } {
    const range = isMono ? R.loudness.monoLUFS : R.loudness.stereoLUFS;
    const pos = evaluateRange(measuredLUFS, range);
    const target = range.goldLow;
    const diff = measuredLUFS - target;

    const verdicts: Record<string, string> = {
      'below-min':  `Too quiet: ${measuredLUFS} LUFS is ${Math.abs(diff).toFixed(1)} LU below the ${range.min} LUFS minimum`,
      'below-gold': `Below gold zone: ${measuredLUFS} LUFS — target is ${target} LUFS`,
      'gold':       `Gold zone: ${measuredLUFS} LUFS ≈ ${target} LUFS target ✓`,
      'above-gold': `Above gold zone: ${measuredLUFS} LUFS — max is ${range.max} LUFS`,
      'above-max':  `Too loud: ${measuredLUFS} LUFS exceeds ${range.max} LUFS maximum — risk of listener fatigue`,
    };

    return {
      position: pos,
      pass: pos === 'gold' || pos === 'below-gold' || pos === 'above-gold',
      target,
      verdict: verdicts[pos],
    };
  }

  async getPersonalisedRecommendation(
    style: string,
    notes: string,
    isMono = false,
    voiceCharacter = '',
    micType = '',
    genreProfile?: GenreProfile,
    onChunk?: (c: string) => void,
  ): Promise<string> {
    const defaultLUFS = isMono ? R.loudness.monoLUFS.goldLow : R.loudness.stereoLUFS.goldLow;
    const targetLUFS = genreProfile ? parseGenreLoudness(genreProfile) : defaultLUFS;
    const genreBlock = genreProfile ? `\n${formatGenreForPrompt(genreProfile, 'mastering')}\n` : '';

    const messages: AIMessage[] = [{
      role: 'user',
      content: `Provide personalised mastering recommendations for a ${style}-style ${isMono ? 'mono' : 'stereo'} podcast.

CONTEXT
Recording notes: ${notes}
Voice character: ${voiceCharacter || 'not specified'}
Microphone: ${micType || 'not specified'}
${genreBlock}
${MASTERING_RANGE_PROMPT}

Adapt all settings to this specific voice, recording, and genre profile. When a genre profile is present, its mastering priorities take precedence over style defaults. Explain why each setting suits this context.
Target: ${targetLUFS} LUFS integrated loudness, ${R.limiter.ceilingDBTP.goldLow} dBTP true peak ceiling.`,
    }];
    return aiProviderService.prompt(messages, { onChunk });
  }
}

export const masteringAssistantService = new MasteringAssistantService();
