import type { MicReadiness, RecordingFeedback } from './types';
import { PROCESSING_RANGES } from './types';
import { aiProviderService } from './aiProviderService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function linearToDBFS(linear: number): number {
  if (linear <= 0) return -Infinity;
  return 20 * Math.log10(Math.min(linear, 1));
}

function fmtDB(db: number): string {
  return isFinite(db) ? `${db.toFixed(1)} dBFS` : '−∞ dBFS';
}

// Range thresholds (derived from PROCESSING_RANGES)
const R = PROCESSING_RANGES.recording.inputPeakDB;
// R.min = -30, R.goldLow = -18, R.goldHigh = -12, R.max = -6

// Noise floor thresholds (inverted: lower = better)
const NOISE_FAIL_DB    = -50;  // above this = too noisy (fail)
const NOISE_WARN_DB    = -60;  // above this = below gold zone
// below -60 dB = gold zone; below -80 dB = excellent

class RecordingCoachService {
  /**
   * Analyse a raw linear peak value (0–1 from Web Audio) against the
   * Min / Gold Zone / Max input level ranges.
   */
  analyzeMicLevel(peak: number, rms: number): MicReadiness {
    const peakDB = linearToDBFS(peak);
    const rmsDB  = linearToDBFS(rms);

    // ── No signal ──
    if (peak <= 0 || !isFinite(peakDB) || peakDB < -70) {
      return {
        status: 'no-signal',
        level: 0,
        message: 'No signal detected',
        suggestion: 'Check your microphone is connected and selected as the input device.',
      };
    }

    // ── Clipping — always a failure ──
    if (peak >= 0.99 || peakDB >= -0.1) {
      return {
        status: 'clipping',
        level: peak,
        message: `Clipping detected (${fmtDB(peakDB)})`,
        suggestion: 'Lower your input gain immediately. Any clipping is unrecoverable in post-production.',
      };
    }

    // ── Above max (−6 dBFS) — danger zone ──
    if (peakDB > R.max) {
      return {
        status: 'too-loud',
        level: peak,
        message: `Input too hot (${fmtDB(peakDB)} — above −${Math.abs(R.max)} dBFS max)`,
        suggestion: `Reduce gain until speech peaks land in the gold zone: ${R.goldLow} to ${R.goldHigh} dBFS. Loud moments (laughter, emphasis) will clip if you are already hitting ${R.max} dBFS.`,
      };
    }

    // ── Between gold zone top and max (−12 to −6 dBFS) — usable but pushing it ──
    if (peakDB > R.goldHigh) {
      return {
        status: 'too-loud',
        level: peak,
        message: `Input above gold zone (${fmtDB(peakDB)} — gold zone is ${R.goldLow} to ${R.goldHigh} dBFS)`,
        suggestion: 'Reduce gain slightly. Leave more headroom for louder moments.',
      };
    }

    // ── Gold zone (−18 to −12 dBFS) ──
    if (peakDB >= R.goldLow) {
      const noiseDB = linearToDBFS(rms);
      if (isFinite(noiseDB) && noiseDB > NOISE_WARN_DB) {
        return {
          status: 'noise-high',
          level: peak,
          message: `Level is good (${fmtDB(peakDB)}) but background noise is elevated`,
          suggestion: 'Turn off fans, HVAC, and other background sources before recording.',
        };
      }
      return {
        status: 'ready',
        level: peak,
        message: `Input in gold zone (${fmtDB(peakDB)}) — ready to record`,
        suggestion: "Levels look great. You have headroom for emphasis and laughter. Hit record when ready.",
      };
    }

    // ── Below gold zone but above min (−30 to −18 dBFS) ──
    if (peakDB >= R.min) {
      return {
        status: 'too-quiet',
        level: peak,
        message: `Input below gold zone (${fmtDB(peakDB)} — target ${R.goldLow} to ${R.goldHigh} dBFS)`,
        suggestion: 'Increase gain or move closer to the microphone until peaks reach the gold zone.',
      };
    }

    // ── Below minimum (below −30 dBFS) ──
    return {
      status: 'too-quiet',
      level: peak,
      message: `Signal very weak (${fmtDB(peakDB)} — below ${R.min} dBFS minimum)`,
      suggestion: 'Check your microphone and input selection. Increase gain significantly or move much closer to the mic.',
    };
  }

  /**
   * Analyse the room noise floor.
   * `noiseFloor` is a linear amplitude value (0–1) from Web Audio.
   * Lower noise floor = better.
   */
  analyzeNoise(noiseFloor: number): MicReadiness {
    const noiseDB = linearToDBFS(noiseFloor);

    if (isFinite(noiseDB) && noiseDB > NOISE_FAIL_DB) {
      return {
        status: 'noise-high',
        level: noiseFloor,
        message: `Noise floor too high (${noiseDB.toFixed(0)} dBFS — minimum is ${NOISE_FAIL_DB} dB)`,
        suggestion: 'Turn off fans, air conditioning, computers, and other sources. Consider acoustic treatment or moving to a quieter room.',
      };
    }
    if (isFinite(noiseDB) && noiseDB > NOISE_WARN_DB) {
      return {
        status: 'noise-high',
        level: noiseFloor,
        message: `Noise floor above gold zone (${noiseDB.toFixed(0)} dBFS — gold is below ${NOISE_WARN_DB} dB)`,
        suggestion: 'Reduce background noise if possible. Light noise reduction in post can help, but avoid over-processing.',
      };
    }
    return {
      status: 'ready',
      level: noiseFloor,
      message: `Noise floor in gold zone (${isFinite(noiseDB) ? noiseDB.toFixed(0) : '−∞'} dBFS)`,
      suggestion: '',
    };
  }

  /**
   * Live recording feedback — non-intrusive, shown in the Studio panel.
   * All thresholds are derived from the Min/Gold Zone/Max ranges.
   */
  generateLiveFeedback(peak: number, rms: number, silenceDuration: number, clipCount: number): RecordingFeedback[] {
    const feedback: RecordingFeedback[] = [];
    const now   = Date.now();
    const peakDB = linearToDBFS(peak);

    // Clipping — always an error
    if (peak >= 0.99 || peakDB >= -0.1) {
      feedback.push({ id: `clip-${now}`, type: 'clipping', severity: 'error', message: `Clipping (${fmtDB(peakDB)}) — lower gain now`, timestamp: now });
    }
    // Above max
    else if (peakDB > R.max) {
      feedback.push({ id: `hot-${now}`, type: 'level', severity: 'warning', message: `Input too hot (${fmtDB(peakDB)}) — reduce gain`, timestamp: now });
    }
    // Above gold zone top
    else if (peakDB > R.goldHigh) {
      feedback.push({ id: `high-${now}`, type: 'level', severity: 'warning', message: `Level high (${fmtDB(peakDB)}) — approaching max`, timestamp: now });
    }
    // Below gold zone (and signal present)
    else if (peakDB < R.goldLow && peakDB > R.min) {
      feedback.push({ id: `low-${now}`, type: 'level', severity: 'warning', message: `Level low (${fmtDB(peakDB)}) — aim for ${R.goldLow} to ${R.goldHigh} dBFS`, timestamp: now });
    }

    // Multiple clips
    if (clipCount > 3) {
      feedback.push({ id: `clips-${now}`, type: 'level', severity: 'warning', message: `${clipCount} clips detected — check input gain`, timestamp: now });
    }

    // Long silence
    if (peak < 0.005 && silenceDuration > 5) {
      feedback.push({ id: `silence-${now}`, type: 'silence', severity: 'warning', message: `${Math.round(silenceDuration)}s of silence`, timestamp: now });
    }

    // Noise floor concern (RMS too high relative to peak suggests background noise)
    const snr = peak > 0 ? peak / Math.max(rms, 0.0001) : 0;
    if (snr < 5 && peak > 0.01) {
      feedback.push({ id: `noise-${now}`, type: 'level', severity: 'info', message: 'Room noise elevated relative to voice', timestamp: now });
    }

    return feedback;
  }

  async getRecordingTip(topic: string, onChunk?: (c: string) => void): Promise<string> {
    return aiProviderService.prompt(
      [{ role: 'user', content: `Give me one quick recording tip for a podcast episode about "${topic}". Focus on microphone technique, room acoustics, or level setting. Under 2 sentences.` }],
      { onChunk },
    );
  }
}

export const recordingCoachService = new RecordingCoachService();
