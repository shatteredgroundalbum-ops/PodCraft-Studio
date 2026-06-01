import type { ScriptDraft, AIMessage, FinalScriptQuality, ScriptDimensionScore, ScriptQualityStatus } from './types';
import { SCRIPT_TIMING, estimateRuntimeMinutes } from './types';
import { aiProviderService } from './aiProviderService';

// ─── Formal Specification ─────────────────────────────────────────────────────
// All script generation and quality checks operate against this spec.

const SCRIPT_SPEC = `
PODCAST SCRIPT FORMAL SPECIFICATION
=====================================

SECTION STRUCTURE — Every professional podcast script contains:
1. METADATA      — episode title, number, recording date, estimated runtime, host, guests, topic
2. COLD OPEN     — 15–60 seconds; grab attention immediately (fact, question, quote, story hook) [optional]
3. INTRO         — 30–90 seconds; show name, host intro, episode topic, why listener should care
4. MAIN SEGMENTS — 3–7 segments; each has: objective, talking points, supporting facts, transitions
5. GUEST SECTION — guest introduction, questions, follow-up prompts, transition back to host [if applicable]
6. SPONSOR / AD  — sponsor message, CTA, transition back to content; clearly marked [AD BREAK]
7. RECAP         — summarize major points, conclusions, lessons learned
8. OUTRO         — CTA, subscribe reminder, review reminder, website links, social links, next episode tease

WRITING RULES (non-negotiable):
Opening Hook Rule    : Within first 30 seconds, answer "Why should I listen?" and "Why does this matter?"
Segment Rule         : Each segment must have purpose, beginning, middle, ending — and lead naturally into the next
Speaking Rule        : Write for speech, not reading — short sentences (≤25 words), no complex grammar,
                       no legal or academic language unless required, must sound conversational
Listener Retention   : Every 2–5 minutes, insert a new insight, question, story, fact, or transition
                       Purpose: prevent listener fatigue
Research Rule        : Every factual statement must be sourced, tracked, and verifiable
                       Store source name, URL, and confidence level. No invented facts.

TIMING REFERENCE (150 words per minute spoken pace):
  150 words ≈ 1 min  |  750 words ≈ 5 min  |  1,500 words ≈ 10 min
  3,000 words ≈ 20 min  |  4,500 words ≈ 30 min  |  9,000 words ≈ 60 min

SPEAKER LABELS: Use HOST: and GUEST: prefixes on every line of dialogue.

QUALITY GATE — Script must pass all 7 dimensions before proceeding to recording:
1. Hook Quality         — opening hook answers "why listen?" within 30 seconds
2. Clarity              — short sentences, no stiff language, no jargon
3. Flow                 — each segment has beginning/middle/end, leads naturally to next
4. Research Quality     — all factual claims sourced and tracked
5. Listener Engagement  — retention hooks inserted every 2–5 minutes
6. Segment Balance      — 3–7 major segments, each with clear purpose
7. Outro Quality        — complete CTA with subscribe, review, links, next episode tease

APPROVAL GATE: The script must not proceed to recording until the user explicitly approves it.
`;

const SCRIPT_SYSTEM = `You are a professional podcast script writer operating to formal specification.
${SCRIPT_SPEC}
Never invent facts. Separate confirmed facts from claims, allegations, theories, and speculation.
Respond with valid JSON only when JSON is requested.`;

// ─── Legacy quality check interfaces (kept for backward compatibility) ────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToStatus(score: number): ScriptQualityStatus {
  if (score >= 75) return 'pass';
  if (score >= 50) return 'needs-review';
  return 'fail';
}

function dim(score: number, feedback: string, improvements: string[] = []): ScriptDimensionScore {
  return { score, status: scoreToStatus(score), feedback, improvements };
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class ScriptAssistantService {

  /** Estimate spoken runtime from word count (150 wpm standard). */
  estimateRuntime(words: number): number {
    return estimateRuntimeMinutes(words);
  }

  /** Reference timing table. */
  get timingTable() { return SCRIPT_TIMING; }

  // ── Script Generation ─────────────────────────────────────────────────────

  async generateScript(
    topic: string,
    outline: string[],
    format = 'solo',
    hostName = '',
    durationMinutes = 35,
    style = 'conversational',
    episodeNumber?: number,
    guests?: string[],
  ): Promise<ScriptDraft> {
    const targetWords = durationMinutes * 150;
    const messages: AIMessage[] = [
      { role: 'system', content: SCRIPT_SYSTEM },
      {
        role: 'user',
        content: `Write a professional podcast script following the formal specification above.

EPISODE
Topic: ${topic}
Format: ${format} | Style: ${style}
Duration target: ~${durationMinutes} minutes (~${targetWords} words at 150 wpm)
${hostName ? `Host: ${hostName}` : ''}
${guests?.length ? `Guests: ${guests.join(', ')}` : ''}
${episodeNumber ? `Episode: #${episodeNumber}` : ''}
Content outline: ${outline.join(', ')}

REQUIRED SECTIONS (in order):
1. COLD OPEN   (15–60 sec) — hook that demands the listener keep listening
2. INTRO       (30–90 sec) — show name, host, topic, why it matters to the listener TODAY
3. MAIN SEGMENTS (3–7)     — follow the outline; each segment has objective + retention hook
4. RECAP       (60–90 sec) — 3 major takeaways
5. OUTRO       (30–60 sec) — subscribe CTA, review ask, social links, next episode tease

WRITING RULES:
- Every sentence ≤25 words; sounds natural spoken aloud
- Every 2–5 minutes: insert a retention hook [RETENTION HOOK: ...]
- All factual claims: label source inline [SOURCE: ...]
- Speaker labels: HOST: / GUEST: on every dialogue line
- No sentence starting with "In conclusion", "It is important to note", "As previously mentioned"

Respond with JSON:
{
  "title": "Episode title",
  "episodeNumber": ${episodeNumber ?? null},
  "host": "${hostName}",
  "guests": ${JSON.stringify(guests ?? [])},
  "topic": "${topic}",
  "sections": [
    {
      "type": "cold-open|intro|segment|guest-section|sponsor|recap|outro",
      "title": "Section name",
      "objective": "What this section accomplishes",
      "content": "HOST: Spoken words here...",
      "talkingPoints": ["point 1", "point 2"],
      "retentionHook": "Hook used to maintain listener attention",
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
        const p = JSON.parse(m[0]);
        const sections = (p.sections ?? []) as ScriptDraft['sections'];
        const totalWords = sections.reduce((acc, s) => acc + wordCount(s.content), 0);
        return {
          title:                  p.title ?? topic,
          episodeNumber:          p.episodeNumber ?? episodeNumber,
          recordingDate:          new Date().toISOString().split('T')[0],
          host:                   p.host ?? hostName,
          guests:                 p.guests ?? guests ?? [],
          topic:                  p.topic ?? topic,
          wordCount:              totalWords,
          sections,
          totalEstimatedMinutes:  p.totalEstimatedMinutes ?? durationMinutes,
          approvedForRecording:   false,
        };
      }
    } catch { /* ignore */ }

    return {
      title: topic,
      topic,
      wordCount: wordCount(raw),
      sections: [{ type: 'segment', title: 'Main Content', content: raw, estimatedSeconds: durationMinutes * 60 }],
      totalEstimatedMinutes: durationMinutes,
      approvedForRecording: false,
    };
  }

  // ── Final Script Quality Check (7 dimensions) ─────────────────────────────

  /**
   * Formal 7-dimension quality gate.
   * Script MUST NOT proceed to recording until this passes and user approves.
   */
  async checkFinalScriptQuality(
    scriptContent: string,
    wordCountOverride?: number,
  ): Promise<FinalScriptQuality> {
    const wc = wordCountOverride ?? wordCount(scriptContent);
    const estimatedMinutes = estimateRuntimeMinutes(wc);

    const messages: AIMessage[] = [{
      role: 'system',
      content: SCRIPT_SYSTEM,
    }, {
      role: 'user',
      content: `Evaluate this podcast script against the formal 7-dimension quality gate.

Word count: ${wc} (~${estimatedMinutes} minutes at 150 wpm)

Script (up to 3000 chars): ${scriptContent.slice(0, 3000)}

Score each dimension 0–100. Status: pass (≥75) / needs-review (50–74) / fail (<50).

DIMENSIONS:
1. Hook Quality         — Does the opening (first 30 sec) answer "why listen?" and "why now?"
2. Clarity              — Short sentences, conversational, no jargon or stiff language
3. Flow                 — Each segment has beginning/middle/end; leads naturally to next
4. Research Quality     — All factual claims sourced; no invented facts
5. Listener Engagement  — Retention hooks every 2–5 minutes
6. Segment Balance      — 3–7 major segments, each with clear purpose
7. Outro Quality        — Complete CTA: subscribe, review, links, next episode tease

JSON:
{
  "hookQuality":        { "score": 80, "feedback": "...", "improvements": ["..."] },
  "clarity":            { "score": 80, "feedback": "...", "improvements": ["..."] },
  "flow":               { "score": 80, "feedback": "...", "improvements": ["..."] },
  "researchQuality":    { "score": 80, "feedback": "...", "improvements": ["..."] },
  "listenerEngagement": { "score": 80, "feedback": "...", "improvements": ["..."] },
  "segmentBalance":     { "score": 80, "feedback": "...", "improvements": ["..."] },
  "outroQuality":       { "score": 80, "feedback": "...", "improvements": ["..."] }
}`,
    }];

    try {
      const raw = await aiProviderService.prompt(messages);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const p = JSON.parse(m[0]);
        const dims = {
          hookQuality:        dim(p.hookQuality?.score ?? 50,        p.hookQuality?.feedback ?? '',        p.hookQuality?.improvements ?? []),
          clarity:            dim(p.clarity?.score ?? 50,            p.clarity?.feedback ?? '',            p.clarity?.improvements ?? []),
          flow:               dim(p.flow?.score ?? 50,               p.flow?.feedback ?? '',               p.flow?.improvements ?? []),
          researchQuality:    dim(p.researchQuality?.score ?? 50,    p.researchQuality?.feedback ?? '',    p.researchQuality?.improvements ?? []),
          listenerEngagement: dim(p.listenerEngagement?.score ?? 50, p.listenerEngagement?.feedback ?? '', p.listenerEngagement?.improvements ?? []),
          segmentBalance:     dim(p.segmentBalance?.score ?? 50,     p.segmentBalance?.feedback ?? '',     p.segmentBalance?.improvements ?? []),
          outroQuality:       dim(p.outroQuality?.score ?? 50,       p.outroQuality?.feedback ?? '',       p.outroQuality?.improvements ?? []),
        };
        const scores = Object.values(dims).map(d => d.score);
        const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        return {
          ...dims,
          overallScore,
          overallStatus: scoreToStatus(overallScore),
          requiresUserApproval: true,
          approvedForRecording: false,
        };
      }
    } catch { /* fall through */ }

    return this.fallbackQuality();
  }

  private fallbackQuality(): FinalScriptQuality {
    const pending = dim(0, 'Quality check pending — run check once AI is available', ['Re-run quality check']);
    return {
      hookQuality:        pending,
      clarity:            pending,
      flow:               pending,
      researchQuality:    pending,
      listenerEngagement: pending,
      segmentBalance:     pending,
      outroQuality:       pending,
      overallScore:       0,
      overallStatus:      'fail',
      requiresUserApproval: true,
      approvedForRecording: false,
    };
  }

  // ── Legacy quality check (kept for backward compatibility) ────────────────

  async checkScriptQuality(scriptContent: string): Promise<ScriptQualityCheck> {
    const messages: AIMessage[] = [{
      role: 'user',
      content: `Review this podcast script for natural spoken delivery quality.
Script: ${scriptContent.slice(0, 2000)}
Evaluate: naturalness, sentences over 25 words, hook strength, transitions, outro with CTA, unsourced facts.
JSON: { "canReadNaturally": true, "hookStrength": "strong|weak|missing", "hasOutro": true, "hasTransitions": true, "longSentenceCount": 3, "issues": [], "overallReady": true }`,
    }];
    const raw = await aiProviderService.prompt(messages);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]) as ScriptQualityCheck;
    } catch { /* ignore */ }
    return { canReadNaturally: true, hookStrength: 'weak', hasOutro: false, hasTransitions: false, longSentenceCount: 0, issues: [], overallReady: false };
  }

  async separateFactsAndClaims(content: string): Promise<LabelledStatement[]> {
    const messages: AIMessage[] = [{
      role: 'user',
      content: `Identify and label all factual statements in this podcast script. Classify as: confirmed-fact, claim, allegation, theory, or speculation.
Content: ${content.slice(0, 1500)}
JSON: { "statements": [{ "text": "...", "type": "confirmed-fact|claim|allegation|theory|speculation", "requiresSource": true, "sourceNote": "..." }] }`,
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
      content: `Improve this podcast script section.\nInstruction: ${instruction}\n\nOriginal:\n${text}\n\nRules: short sentences (≤25 words), conversational, sounds natural when spoken aloud.`,
    }], { onChunk });
  }

  async generateIntro(topic: string, hostName?: string, showName?: string): Promise<string> {
    return aiProviderService.prompt([{
      role: 'user',
      content: `Write a 30–90 second podcast intro for an episode about "${topic}".
${hostName ? `Host: ${hostName}.` : ''} ${showName ? `Show: ${showName}.` : ''}
Opening Hook Rule: answer "Why should I listen?" and "Why does this matter?" within 30 seconds.
Short sentences. Conversational. Just the spoken words — no stage directions.`,
    }]);
  }

  async generateOutro(topic: string, showName?: string): Promise<string> {
    return aiProviderService.prompt([{
      role: 'user',
      content: `Write a 30–60 second podcast outro for an episode about "${topic}".${showName ? ` Show: ${showName}.` : ''}
Include ALL of: specific subscribe CTA, review reminder, website/social links, next episode tease.
Conversational, friendly tone. Short sentences.`,
    }]);
  }

  async rewriteForNaturalSpeech(text: string, onChunk?: (c: string) => void): Promise<string> {
    return this.improveText(text, 'Rewrite completely for natural spoken delivery. Short sentences (≤25 words). Conversational language. Sounds like a real person talking — not formal writing read aloud.', onChunk);
  }

  async rewriteForClarity(text: string, onChunk?: (c: string) => void): Promise<string> {
    return this.improveText(text, 'Rewrite for clarity, natural spoken delivery, and audience engagement', onChunk);
  }
}

export const scriptAssistantService = new ScriptAssistantService();
