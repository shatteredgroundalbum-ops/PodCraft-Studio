import type { MicReadiness, RecordingFeedback } from './types';
import { chromeAIAdapter } from './chromeAIAdapter';

class RecordingCoachService {
  analyzeMicLevel(peak: number, rms: number): MicReadiness {
    if (peak < 0.01) {
      return { status: 'no-signal', level: 0, message: 'No signal detected', suggestion: 'Check your microphone is connected and selected as the input device.' };
    }
    if (peak > 0.95) {
      return { status: 'clipping', level: peak, message: 'Input is clipping!', suggestion: 'Lower your microphone gain or move further from the mic.' };
    }
    if (peak > 0.75) {
      return { status: 'too-loud', level: peak, message: 'Input level is very high', suggestion: 'Consider reducing gain slightly to leave headroom.' };
    }
    if (rms < 0.03) {
      return { status: 'noise-high', level: peak, message: 'High noise floor detected', suggestion: 'Move to a quieter room or use a pop filter/noise gate.' };
    }
    if (peak < 0.15) {
      return { status: 'too-quiet', level: peak, message: 'Input level is too low', suggestion: 'Move closer to the microphone or increase your input gain.' };
    }
    return { status: 'ready', level: peak, message: 'Audio levels look great!', suggestion: 'You\'re ready to record. Hit record when ready.' };
  }

  analyzeNoise(noiseFloor: number): MicReadiness {
    if (noiseFloor > 0.2) {
      return { status: 'noise-high', level: noiseFloor, message: 'Background noise is high', suggestion: 'Turn off fans, air conditioning, or move to a quieter space.' };
    }
    return { status: 'ready', level: noiseFloor, message: 'Room noise is acceptable', suggestion: '' };
  }

  generateLiveFeedback(peak: number, _rms: number, silenceDuration: number, clipCount: number): RecordingFeedback[] {
    const feedback: RecordingFeedback[] = [];
    const now = Date.now();

    if (peak > 0.95) {
      feedback.push({ id: `clip-${now}`, type: 'clipping', severity: 'error', message: 'Clipping detected — lower your gain', timestamp: now });
    }
    if (peak < 0.05 && silenceDuration > 5) {
      feedback.push({ id: `silence-${now}`, type: 'silence', severity: 'warning', message: `${Math.round(silenceDuration)}s of silence detected`, timestamp: now });
    }
    if (clipCount > 3) {
      feedback.push({ id: `clips-${now}`, type: 'level', severity: 'warning', message: 'Multiple clips detected — check your input level', timestamp: now });
    }

    return feedback;
  }

  async getRecordingTip(topic: string, onChunk?: (c: string) => void): Promise<string> {
    return chromeAIAdapter.prompt(
      [{ role: 'user', content: `Give me one quick recording tip for a podcast episode about "${topic}". Keep it under 2 sentences.` }],
      { onChunk }
    );
  }
}

export const recordingCoachService = new RecordingCoachService();
