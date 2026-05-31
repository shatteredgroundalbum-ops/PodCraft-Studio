import type { MasteringRecommendation, AIMessage } from './types';
import { chromeAIAdapter } from './chromeAIAdapter';

class MasteringAssistantService {
  getDefaultRecommendation(style: string): MasteringRecommendation {
    const presets: Record<string, MasteringRecommendation> = {
      Broadcast: {
        eq: 'High-pass at 80Hz, gentle boost at 2-4kHz for presence',
        compression: 'Ratio 4:1, attack 10ms, release 100ms, threshold -18dBFS',
        deEssing: 'Target 5-8kHz, moderate threshold',
        limiting: 'Ceiling -1dBTP, moderate limiting',
        noiseReduction: 'Light noise gate, -40dB floor',
        targetLUFS: -16,
        summary: 'Broadcast preset — loud and punchy, optimised for Spotify and Apple Podcasts.',
      },
      Natural: {
        eq: 'High-pass at 60Hz, subtle air boost at 12kHz',
        compression: 'Ratio 2:1, slow attack 30ms, release 200ms, threshold -24dBFS',
        deEssing: 'Light de-essing at 6kHz',
        limiting: 'Ceiling -1.5dBTP, transparent limiting',
        noiseReduction: 'Very light noise reduction',
        targetLUFS: -19,
        summary: 'Natural preset — preserves dynamics while meeting streaming standards.',
      },
      Warm: {
        eq: 'High-pass at 80Hz, boost at 200Hz (+2dB), cut at 4kHz (-1dB)',
        compression: 'Ratio 3:1, medium attack 15ms, release 150ms',
        deEssing: 'Moderate de-essing',
        limiting: 'Ceiling -1dBTP',
        noiseReduction: 'Standard noise reduction',
        targetLUFS: -17,
        summary: 'Warm preset — enhanced low-end for intimate interview shows.',
      },
      Clear: {
        eq: 'High-pass at 100Hz, boost at 3-5kHz (+3dB) for presence and clarity',
        compression: 'Ratio 3.5:1, fast attack 5ms, release 80ms',
        deEssing: 'Aggressive de-essing at 7kHz',
        limiting: 'Ceiling -0.5dBTP',
        noiseReduction: 'Moderate noise reduction',
        targetLUFS: -16,
        summary: 'Clear preset — crisp highs optimised for dialogue-heavy shows.',
      },
      Radio: {
        eq: 'High-pass at 120Hz, broad presence boost 2-5kHz (+4dB)',
        compression: 'Ratio 6:1, fast attack 3ms, release 60ms, heavy limiting',
        deEssing: 'Strong de-essing',
        limiting: 'Ceiling -0.5dBTP, brick-wall limiter',
        noiseReduction: 'Heavy noise reduction',
        targetLUFS: -14,
        summary: 'Radio preset — maximum loudness with classic broadcast character.',
      },
    };

    return (
      presets[style] ?? {
        eq: 'High-pass at 80Hz',
        compression: 'Light compression, ratio 2:1',
        deEssing: 'Moderate de-essing',
        limiting: 'Ceiling -1dBTP',
        noiseReduction: 'Standard',
        targetLUFS: -16,
        summary: `${style} mastering preset.`,
      }
    );
  }

  async getPersonalisedRecommendation(style: string, notes: string, onChunk?: (c: string) => void): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `I need mastering recommendations for my podcast episode.\nStyle: ${style}\nNotes about my recording: ${notes}\n\nProvide specific EQ, compression, de-essing, limiting, and noise reduction settings. Keep it practical and actionable.`,
      },
    ];
    return chromeAIAdapter.prompt(messages, { onChunk });
  }

  async analyzeMasteringReadiness(style: string): Promise<string> {
    const rec = this.getDefaultRecommendation(style);
    return `Target: ${rec.targetLUFS} LUFS\n${rec.summary}`;
  }
}

export const masteringAssistantService = new MasteringAssistantService();
