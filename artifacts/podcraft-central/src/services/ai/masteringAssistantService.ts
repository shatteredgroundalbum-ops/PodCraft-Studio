import type { MasteringRecommendation, AIMessage } from './types';
import { PODCAST_STANDARDS } from './types';
import { aiProviderService } from './aiProviderService';

// Nine-step mastering chain (per PodCraft professional standard)
const MASTERING_CHAIN = [
  '1. Corrective EQ — remove problem frequencies; high-pass rumble below 80–100 Hz',
  '2. Noise cleanup (if needed) — reduce fan, HVAC, electrical hum without artifacts',
  '3. Compression — control dynamics, improve consistency; avoid over-compression',
  '4. De-esser (if needed) — target harsh S/SH/Z/CH only; use sparingly',
  '5. Level balancing — all speakers at consistent, comfortable listening level',
  '6. Limiter — ceiling at −1 dBTP; prevent any clipping',
  `7. Loudness normalization — target ${PODCAST_STANDARDS.stereoTargetLUFS} LUFS (stereo) or ${PODCAST_STANDARDS.monoTargetLUFS} LUFS (mono)`,
  '8. Final listen-through — verify speech clarity, naturalness, and overall comfort',
  '9. Export validation — confirm format, bitrate, sample rate, and metadata',
];

class MasteringAssistantService {
  /** Standard mastering presets — all true peak ceilings at −1 dBTP per spec */
  getDefaultRecommendation(style: string, isMono = false): MasteringRecommendation {
    const stereoLUFS = PODCAST_STANDARDS.stereoTargetLUFS;   // −16
    const monoLUFS   = PODCAST_STANDARDS.monoTargetLUFS;     // −19
    const tp         = PODCAST_STANDARDS.truePeakCeiling;    // −1

    const presets: Record<string, MasteringRecommendation> = {
      Broadcast: {
        eq: 'High-pass at 80 Hz; gentle presence boost at 2–4 kHz for intelligibility',
        compression: 'Ratio 4:1, attack 10 ms, release 100 ms, threshold −18 dBFS',
        deEssing: 'Target 5–8 kHz, moderate threshold — use only if sibilance is harsh',
        limiting: `Ceiling ${tp} dBTP, moderate limiting`,
        noiseReduction: 'Light noise gate, −40 dB floor',
        targetLUFS: isMono ? monoLUFS : stereoLUFS,
        summary: `Broadcast — standard spoken-word podcast delivery. Target ${isMono ? monoLUFS : stereoLUFS} LUFS / ${tp} dBTP.`,
      },
      Natural: {
        eq: 'High-pass at 60 Hz; subtle air shelf at 12 kHz; preserve warmth',
        compression: 'Ratio 2:1, slow attack 30 ms, release 200 ms, threshold −24 dBFS',
        deEssing: 'Light de-essing at 6 kHz only if needed',
        limiting: `Ceiling ${tp} dBTP, transparent limiting`,
        noiseReduction: 'Very light noise reduction — preserve room character',
        targetLUFS: isMono ? monoLUFS : stereoLUFS,
        summary: `Natural — preserves dynamics; comfortable for long-form listening. Target ${isMono ? monoLUFS : stereoLUFS} LUFS / ${tp} dBTP.`,
      },
      Warm: {
        eq: 'High-pass at 80 Hz; low-mid boost at 200 Hz (+2 dB); gentle cut at 4 kHz',
        compression: 'Ratio 3:1, attack 15 ms, release 150 ms',
        deEssing: 'Moderate de-essing — check for lisp artifacts after',
        limiting: `Ceiling ${tp} dBTP`,
        noiseReduction: 'Standard noise reduction',
        targetLUFS: isMono ? monoLUFS : stereoLUFS,
        summary: `Warm — intimate interview feel; enhanced low-end. Target ${isMono ? monoLUFS : stereoLUFS} LUFS / ${tp} dBTP.`,
      },
      Clear: {
        eq: 'High-pass at 100 Hz; presence boost at 3–5 kHz (+2–3 dB) for clarity',
        compression: 'Ratio 3.5:1, fast attack 5 ms, release 80 ms',
        deEssing: 'Moderate de-essing at 6–7 kHz — check naturalness afterward',
        limiting: `Ceiling ${tp} dBTP`,
        noiseReduction: 'Moderate noise reduction',
        targetLUFS: isMono ? monoLUFS : stereoLUFS,
        summary: `Clear — crisp highs for dialogue-heavy shows. Target ${isMono ? monoLUFS : stereoLUFS} LUFS / ${tp} dBTP.`,
      },
      // Note: −14 LUFS is only appropriate for music-heavy / streaming-music adjacent content
      // Standard spoken-word podcasts should use −16 / −19 LUFS for listener comfort
      MusicHeavy: {
        eq: 'High-pass at 80 Hz; broad presence boost 2–5 kHz (+3 dB)',
        compression: 'Ratio 4:1, attack 8 ms, release 80 ms',
        deEssing: 'Strong de-essing — music-heavy mix benefits from controlled sibilance',
        limiting: `Ceiling ${tp} dBTP, firm limiting`,
        noiseReduction: 'Standard noise reduction',
        targetLUFS: PODCAST_STANDARDS.musicPlatformLUFS,
        summary: `Music-Heavy — ${PODCAST_STANDARDS.musicPlatformLUFS} LUFS / ${tp} dBTP. Use only when music is a primary element, not for pure spoken-word podcasts.`,
      },
    };

    return presets[style] ?? {
      eq: 'High-pass at 80 Hz; corrective EQ as needed',
      compression: 'Ratio 2:1–4:1, conservative settings',
      deEssing: 'Light de-essing only if sibilance is problematic',
      limiting: `Ceiling ${tp} dBTP`,
      noiseReduction: 'Standard noise reduction',
      targetLUFS: isMono ? monoLUFS : stereoLUFS,
      summary: `${style} mastering preset. Target ${isMono ? monoLUFS : stereoLUFS} LUFS / ${tp} dBTP.`,
    };
  }

  getMasteringChain(): string[] {
    return MASTERING_CHAIN;
  }

  async getPersonalisedRecommendation(style: string, notes: string, isMono = false, onChunk?: (c: string) => void): Promise<string> {
    const targetLUFS = isMono ? PODCAST_STANDARDS.monoTargetLUFS : PODCAST_STANDARDS.stereoTargetLUFS;
    const messages: AIMessage[] = [{
      role: 'user',
      content: `Provide specific mastering recommendations for a ${style}-style podcast episode.
Recording notes: ${notes}
Target: ${targetLUFS} LUFS integrated loudness, ${PODCAST_STANDARDS.truePeakCeiling} dBTP true peak ceiling
Channel: ${isMono ? 'Mono' : 'Stereo'}

Cover EQ, compression, de-essing, limiting, and noise reduction. Follow the mastering chain order:
corrective EQ → noise cleanup → compression → de-esser → level balancing → limiter → loudness normalization.
Prioritise speech clarity and listener comfort. Do not chase loudness.`,
    }];
    return aiProviderService.prompt(messages, { onChunk });
  }

  checkLoudnessCompliance(measuredLUFS: number, isMono = false): {
    pass: boolean;
    target: number;
    difference: number;
    verdict: string;
  } {
    const target = isMono ? PODCAST_STANDARDS.monoTargetLUFS : PODCAST_STANDARDS.stereoTargetLUFS;
    const diff = measuredLUFS - target;
    const pass = Math.abs(diff) <= 1.5;
    return {
      pass,
      target,
      difference: diff,
      verdict: pass
        ? `Compliant: ${measuredLUFS} LUFS is within range of ${target} LUFS target`
        : `Non-compliant: ${measuredLUFS} LUFS is ${Math.abs(diff).toFixed(1)} LU ${diff > 0 ? 'above' : 'below'} the ${target} LUFS target`,
    };
  }
}

export const masteringAssistantService = new MasteringAssistantService();
