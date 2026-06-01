import type {
  DistributionPackage, PlatformRequirement, EpisodePackage,
  DistributionPlatform, ExportFormat, AIMessage,
} from '../types';
import { aiProducerService } from '../aiProducerService';

const PLATFORM_DATA: Record<DistributionPlatform, Omit<PlatformRequirement, 'ready'>> = {
  spotify: {
    platform: 'spotify',
    label: 'Spotify',
    formatRecommendation: 'MP3, 192 kbps minimum, −14 LUFS target',
    metadataRequired: ['title', 'description', 'categories', 'explicit flag'],
    notes: 'Submit via Spotify for Podcasters or RSS feed',
  },
  'apple-podcasts': {
    platform: 'apple-podcasts',
    label: 'Apple Podcasts',
    formatRecommendation: 'MP3 or AAC, 128 kbps+, −16 LUFS, artwork 3000×3000 PNG',
    metadataRequired: ['title', 'description', 'categories', 'explicit flag', 'artwork'],
    notes: 'Submit via Apple Podcasts Connect — strict metadata requirements',
  },
  youtube: {
    platform: 'youtube',
    label: 'YouTube Podcasts',
    formatRecommendation: 'MP4/AAC video or audio-only with static art, −14 LUFS',
    metadataRequired: ['title', 'description', 'thumbnail', 'tags'],
    notes: 'Use chapter timestamps in description for YouTube chapters',
  },
  rss: {
    platform: 'rss',
    label: 'RSS Feed',
    formatRecommendation: 'MP3, 128 kbps+ recommended',
    metadataRequired: ['title', 'description', 'publish date', 'duration', 'enclosure URL'],
    notes: 'Standard RSS 2.0 + iTunes namespace; required by all podcast aggregators',
  },
  'google-podcasts': {
    platform: 'google-podcasts',
    label: 'Google Podcasts',
    formatRecommendation: 'MP3 via standard RSS feed',
    metadataRequired: ['title', 'description', 'RSS feed URL'],
    notes: 'Submit RSS feed to Google Podcasts Manager',
  },
};

class DistributionService {
  getPlatformRequirements(platform: DistributionPlatform, pkg?: EpisodePackage): PlatformRequirement {
    const base = PLATFORM_DATA[platform];
    const ready = pkg
      ? Boolean(pkg.metadata.title && pkg.metadata.description && pkg.metadata.categories.length > 0)
      : false;
    return { ...base, ready };
  }

  recommendExportFormat(platforms: DistributionPlatform[]): { format: ExportFormat; bitrate: string; targetLUFS: number } {
    return {
      format: platforms.includes('youtube') ? 'aac' : 'mp3',
      bitrate: platforms.includes('apple-podcasts') ? '256kbps' : '192kbps',
      targetLUFS: platforms.includes('spotify') ? -14 : -16,
    };
  }

  async generateDistributionPackage(
    pkg: EpisodePackage,
    platforms: DistributionPlatform[] = ['spotify', 'apple-podcasts', 'rss'],
  ): Promise<DistributionPackage> {
    const { format, bitrate, targetLUFS } = this.recommendExportFormat(platforms);
    const platformReqs = platforms.map(p => this.getPlatformRequirements(p, pkg));

    const messages: AIMessage[] = [{
      role: 'user',
      content: `Generate a publishing checklist for episode "${pkg.metadata.title}" targeting: ${platforms.join(', ')}.
Format: ${format} at ${bitrate} | Loudness: ${targetLUFS} LUFS
JSON: { "checklist": ["step 1", ...], "notes": "..." }
Provide 8-10 specific steps.`,
    }];

    let checklist: string[] = [];
    let distributionNotes = '';

    try {
      const raw = await aiProducerService.runTask('distribution', messages);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const p = JSON.parse(m[0]);
        checklist = (p.checklist ?? []) as string[];
        distributionNotes = (p.notes ?? '') as string;
      }
    } catch { /* ignore */ }

    if (!checklist.length) {
      checklist = [
        `Export master as ${format.toUpperCase()} at ${bitrate}`,
        `Verify integrated loudness: ${targetLUFS} LUFS`,
        'Confirm title and description are final',
        'Add episode artwork (3000×3000 PNG)',
        'Add chapter markers if supported',
        'Set publish date and time',
        'Upload to hosting platform',
        'Post social media copy after going live',
      ];
    }

    return {
      recommendedFormat: format,
      recommendedBitrate: bitrate,
      targetLUFS,
      platforms: platformReqs,
      exportChecklist: checklist,
      publishingMetadata: pkg.metadata,
      approvalRequired: true,
      distributionNotes,
    };
  }
}

export const distributionService = new DistributionService();
