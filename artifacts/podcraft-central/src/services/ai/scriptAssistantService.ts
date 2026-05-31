import type { ScriptDraft, AIMessage } from './types';
import { aiProviderService } from './aiProviderService';

// CDC guidance: spoken scripts must sound natural when read aloud
const SCRIPT_SYSTEM = `You are an expert podcast script writer. All scripts must sound completely natural when spoken aloud.

Core rules (CDC spoken-word guidance + podcast best practices):
- Write how people actually talk, not how they write
- Use short sentences — generally under 25 words
- Break up paragraphs — maximum 3-4 sentences each
- Avoid stiff, formal language
- Include natural transitions between sections
- Mark host lines as HOST: and guest questions as GUEST:
- The opening MUST hook the listener in the first 10 seconds

Never invent facts or fake sources. Separate confirmed facts from claims, allegations, theories, and speculation.`;

export interface ScriptQualityIssue {
  type: 'sentence-too-long' | 'stiff-language' | 'breathless-paragraph' | 'weak-hook' | 'missing-outro' | 'abrupt-transition' | 'unsourced-fact';
  location: string;
  suggestion: string;
}

export interface ScriptQualityCheck {
  canReadNaturally: boolean;
  hookStrength: 'strong' | 'weak' | 'missing';
  hasOutro: boolean;
  hasTransitions: boolean;
  longSentenceCount: number;
  issues: ScriptQualityIssue[];
  overallReady: boolean;
}

export type FactType = 'confirmed-fact' | 'claim' | 'allegation' | 'theory' | 'speculation';

export interface LabelledStatement {
  text: string;
  type: FactType;
  requiresSource: boolean;
  sourceNote?: string;
}

class ScriptAssistantService {
  async generateScript(
    topic: string,
    outline: string[],
    format = 'solo',
    hostName = '',
    durationMinutes = 35,
    style = 'conversational',
  ): Promise<ScriptDraft> {
    const messages: AIMessage[] = [
      { role: 'system', content: SCRIPT_SYSTEM },
      {
        role: 'user',
        content: `Write a natural-sounding podcast script for: "${topic}"
Format: ${format} | Style: ${style} | Target: ~${durationMinutes} minutes
${hostName ? `Host: ${hostName}` : ''}
Outline sections: ${outline.join(', ')}

Structure requirements:
- INTRO: strong opening hook (first 10 seconds must grab attention), introduce host and topic
- MAIN SEGMENTS: follow outline; use HOST: / GUEST: speaker labels for interview format
- TRANSITIONS: natural spoken transitions between segments (e.g. "So, moving on to..." or "Now, here's something interesting...")
- AD BREAK: include [AD BREAK] placeholder if appropriate
- OUTRO: clear, complete ending with specific CTA (subscribe, leave a review, website)

Script rules (these are non-negotiable):
- Every sentence must sound like something a person would actually say out loud
- No sentence longer than 25 words
- No paragraph longer than 4 sentences
- Avoid: "In conclusion", "It is important to note", "As previously mentioned"
- Use: contractions, natural connectors, conversational phrasing

Respond with JSON:
{
  "title": "Episode title",
  "sections": [
    {
      "type": "intro|segment|transition|ad-break|outro",
      "title": "Section name",
      "content": "HOST: Actual spoken words here...",
      "estimatedSeconds": 120
    }
  ],
  "totalEstimatedMinutes": ${durationMinutes}
}`,
      },
    ];

    const raw = await aiProviderService.prompt(messages);

    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        return {
          title: parsed.title ?? topic,
          sections: parsed.sections ?? [],
          totalEstimatedMinutes: parsed.totalEstimatedMinutes ?? durationMinutes,
        };
      }
    } catch { /* ignore */ }

    return {
      title: topic,
      sections: [{ type: 'segment', title: 'Main Content', content: raw, estimatedSeconds: durationMinutes * 60 }],
      totalEstimatedMinutes: durationMinutes,
    };
  }

  async checkScriptQuality(scriptContent: string): Promise<ScriptQualityCheck> {
    const messages: AIMessage[] = [{
      role: 'user',
      content: `Review this podcast script for natural spoken delivery quality.

Script (first 2000 chars): ${scriptContent.slice(0, 2000)}

Evaluate:
1. Can it be read aloud naturally?
2. Are there sentences over 25 words?
3. Does the opening hook the listener in 10 seconds?
4. Are transitions natural?
5. Is the ending complete with a CTA?
6. Any unsourced factual claims?

Respond with JSON:
{
  "canReadNaturally": true,
  "hookStrength": "strong|weak|missing",
  "hasOutro": true,
  "hasTransitions": true,
  "longSentenceCount": 3,
  "issues": [
    { "type": "sentence-too-long|stiff-language|breathless-paragraph|weak-hook|missing-outro|abrupt-transition|unsourced-fact", "location": "intro paragraph", "suggestion": "..." }
  ],
  "overallReady": true
}`,
    }];

    const raw = await aiProviderService.prompt(messages);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]) as ScriptQualityCheck;
    } catch { /* ignore */ }

    return {
      canReadNaturally: true,
      hookStrength: 'weak',
      hasOutro: false,
      hasTransitions: false,
      longSentenceCount: 0,
      issues: [],
      overallReady: false,
    };
  }

  async separateFactsAndClaims(content: string): Promise<LabelledStatement[]> {
    const messages: AIMessage[] = [{
      role: 'user',
      content: `Identify and label all factual statements in this podcast script content.

Content: ${content.slice(0, 1500)}

For each factual statement, classify it as one of:
- "confirmed-fact": well-established, verifiable fact
- "claim": asserted but not independently verified in the script
- "allegation": alleged by a party but not proven
- "theory": accepted theory but not absolute fact
- "speculation": opinion, guess, or unsupported conclusion

Respond with JSON:
{ "statements": [{ "text": "...", "type": "confirmed-fact|claim|allegation|theory|speculation", "requiresSource": true, "sourceNote": "..." }] }`,
    }];

    const raw = await aiProviderService.prompt(messages);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return (JSON.parse(m[0]).statements ?? []) as LabelledStatement[];
    } catch { /* ignore */ }
    return [];
  }

  async improveText(text: string, instruction: string, onChunk?: (c: string) => void): Promise<string> {
    return aiProviderService.prompt([{
      role: 'user',
      content: `Improve this podcast script section for natural spoken delivery.\nInstruction: ${instruction}\n\nOriginal:\n${text}\n\nRemember: short sentences, conversational tone, sounds natural when read aloud.`,
    }], { onChunk });
  }

  async generateIntro(topic: string, hostName?: string, showName?: string): Promise<string> {
    return aiProviderService.prompt([{
      role: 'user',
      content: `Write a 30-second podcast intro for an episode about "${topic}".
${hostName ? `Host: ${hostName}.` : ''} ${showName ? `Show: ${showName}.` : ''}
Rules: hook the listener in the first sentence; use conversational language; keep sentences short.
Just the spoken words — no stage directions.`,
    }]);
  }

  async generateOutro(topic: string, showName?: string): Promise<string> {
    return aiProviderService.prompt([{
      role: 'user',
      content: `Write a 20-second podcast outro for an episode about "${topic}".${showName ? ` Show: ${showName}.` : ''}
Include: a clear, specific CTA to subscribe and leave a review. Conversational, friendly tone. Short sentences.`,
    }]);
  }

  async rewriteForNaturalSpeech(text: string, onChunk?: (c: string) => void): Promise<string> {
    return this.improveText(
      text,
      'Rewrite completely for natural spoken delivery: short sentences, conversational language, sounds like a real person talking — not formal writing read aloud',
      onChunk,
    );
  }

  async rewriteForClarity(text: string, onChunk?: (c: string) => void): Promise<string> {
    return this.improveText(text, 'Rewrite for clarity, natural spoken delivery, and audience engagement', onChunk);
  }
}

export const scriptAssistantService = new ScriptAssistantService();
