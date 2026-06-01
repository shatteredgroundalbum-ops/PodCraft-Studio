import type { EpisodePackage, SocialCopySet, AIMessage, EpisodeOutline } from '../types';
import { aiProducerService } from '../aiProducerService';

const SYS = 'You are an expert podcast content strategist and copywriter specializing in SEO-optimized podcast distribution. Respond with valid JSON when requested.';

class PackagingService {
  async generateCompletePackage(
    topic: string,
    angle = '',
    keyPoints: string[] = [],
    outline?: EpisodeOutline,
    durationMinutes?: number,
    showName = '',
  ): Promise<EpisodePackage> {
    const messages: AIMessage[] = [
      { role: 'system', content: SYS },
      {
        role: 'user',
        content: `Generate a complete episode distribution package.
Topic: "${topic}" | Show: "${showName || 'podcast'}" | Angle: "${angle || 'general exploration'}"
Key points: ${keyPoints.length ? keyPoints.join('; ') : 'standard episode content'}
${durationMinutes ? `Duration: ~${durationMinutes} min` : ''}
${outline ? `Sections: ${outline.sections.map(s => s.title).join(', ')}` : ''}

Respond with JSON:
{
  "metadata": {
    "title": "compelling title (max 60 chars)",
    "description": "2-3 sentence description for podcast directories",
    "explicit": false, "language": "en",
    "categories": ["category1", "category2"],
    "keywords": ["keyword1", ...]
  },
  "showNotes": "Full show notes in markdown: timestamps, topics covered, resources, links, bio, CTA",
  "chapters": [{ "timestampSeconds": 0, "title": "Intro", "description": "..." }],
  "socialCopy": {
    "twitter": "tweet (max 280 chars) with hashtags",
    "linkedin": "professional LinkedIn post",
    "instagram": "engaging caption with emojis and hashtags",
    "newsletter": "email excerpt (2-3 sentences)"
  }
}
Generate 5-8 chapters and 8-12 keywords.`,
      },
    ];

    const raw = await aiProducerService.runTask('packaging', messages);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]) as EpisodePackage;
    } catch { /* ignore */ }

    return {
      metadata: { title: topic, description: '', explicit: false, language: 'en', categories: [], keywords: [] },
      showNotes: raw,
      chapters: [],
      socialCopy: { twitter: '', linkedin: '', instagram: '', newsletter: '' },
    };
  }

  async generateSocialCopy(title: string, description: string, highlights: string[] = []): Promise<SocialCopySet> {
    const raw = await aiProducerService.runTask('packaging', [{
      role: 'user',
      content: `Create social media copy for podcast episode: "${title}"
Description: ${description}
Highlights: ${highlights.join(', ') || 'none'}
JSON: { "twitter": "...", "linkedin": "...", "instagram": "...", "newsletter": "..." }`,
    }]);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]) as SocialCopySet;
    } catch { /* ignore */ }
    return { twitter: raw.slice(0, 280), linkedin: '', instagram: '', newsletter: '' };
  }

  async generateShowNotes(topic: string, keyPoints: string[], guestName = '', onChunk?: (c: string) => void): Promise<string> {
    return aiProducerService.runTask('packaging', [{
      role: 'user',
      content: `Write detailed show notes for a podcast episode about "${topic}".
${guestName ? `Guest: ${guestName}` : ''}
Key points: ${keyPoints.join(', ')}
Include: episode summary, timestamp placeholders, key topics, resources/links section, bio (if guest), CTA. Use markdown.`,
    }], { onChunk });
  }

  async generateKeywords(title: string, description: string, topic: string): Promise<string[]> {
    const raw = await aiProducerService.runTask('packaging', [{
      role: 'user',
      content: `Generate 15 SEO keywords for a podcast episode.
Title: "${title}" | Topic: "${topic}" | Description: "${description}"
Include: broad keywords, specific terms, question-based keywords.
JSON: { "keywords": ["..."] }`,
    }]);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return (JSON.parse(m[0]).keywords ?? []) as string[];
    } catch { /* ignore */ }
    return raw.split(',').map(k => k.trim()).filter(Boolean).slice(0, 15);
  }
}

export const packagingService = new PackagingService();
