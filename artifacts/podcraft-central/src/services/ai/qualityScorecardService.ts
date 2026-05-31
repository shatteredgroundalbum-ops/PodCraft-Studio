import type {
  QualityScorecard, QualityCategoryScore, AIMessage,
  MasteringRecommendation, EditRecommendation, EpisodePackage, MixRecommendation,
} from './types';
import { aiProviderService } from './aiProviderService';

function gradeFromScore(score: number): QualityCategoryScore['grade'] {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function cat(score: number, feedback: string, improvements: string[] = []): QualityCategoryScore {
  return { score, grade: gradeFromScore(score), pass: score >= 70, feedback, improvements };
}

export interface ScorecardInput {
  topic?: string;
  durationMinutes?: number;
  recordingNotes?: string;
  hasScript?: boolean;
  hasOutline?: boolean;
  hasResearch?: boolean;
  editRec?: EditRecommendation;
  mixRec?: MixRecommendation;
  masteringRec?: MasteringRecommendation;
  episodePackage?: EpisodePackage;
  measuredLUFS?: number;
}

class QualityScorecardService {
  async generateScorecard(input: ScorecardInput): Promise<QualityScorecard> {
    const context = {
      topic: input.topic,
      duration: input.durationMinutes,
      hasScript: input.hasScript ?? false,
      hasOutline: input.hasOutline ?? false,
      hasResearch: input.hasResearch ?? false,
      fillerWords: input.editRec?.fillerWordEstimate,
      editSavingsMinutes: input.editRec?.estimatedEditSavingsMinutes,
      measuredLUFS: input.measuredLUFS ?? input.mixRec?.measuredLUFS,
      targetLUFS: input.masteringRec?.targetLUFS ?? -16,
      mixConsistency: input.mixRec?.consistencyScore,
      hasTitle: Boolean(input.episodePackage?.metadata.title),
      hasDescription: Boolean(input.episodePackage?.metadata.description),
      hasShowNotes: Boolean(input.episodePackage?.showNotes),
      keywordCount: input.episodePackage?.metadata.keywords.length ?? 0,
      chapterCount: input.episodePackage?.chapters.length ?? 0,
      hasSocialCopy: Boolean(input.episodePackage?.socialCopy.twitter),
      recordingNotes: input.recordingNotes,
    };

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are a podcast quality analyst. Score episodes 0-100 per category, honestly and constructively. Respond with valid JSON only.',
      },
      {
        role: 'user',
        content: `Score this podcast episode using available data:
${JSON.stringify(context, null, 2)}

Respond with this exact JSON structure:
{
  "categories": {
    "audioQuality": { "score": 75, "feedback": "...", "improvements": ["..."] },
    "noiseLevel": { "score": 80, "feedback": "...", "improvements": ["..."] },
    "loudnessCompliance": { "score": 85, "feedback": "...", "improvements": ["..."] },
    "scriptStructure": { "score": 70, "feedback": "...", "improvements": ["..."] },
    "pacing": { "score": 72, "feedback": "...", "improvements": ["..."] },
    "introQuality": { "score": 78, "feedback": "...", "improvements": ["..."] },
    "outroQuality": { "score": 68, "feedback": "...", "improvements": ["..."] },
    "metadataCompleteness": { "score": 65, "feedback": "...", "improvements": ["..."] },
    "distributionReadiness": { "score": 60, "feedback": "...", "improvements": ["..."] }
  },
  "blockers": ["critical issue if any — omit if none"],
  "recommendations": ["priority 1", "priority 2", "..."]
}`,
      },
    ];

    try {
      const raw = await aiProviderService.prompt(messages);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        const c = parsed.categories;
        const categories: QualityScorecard['categories'] = {
          audioQuality: cat(c.audioQuality?.score ?? 65, c.audioQuality?.feedback ?? '', c.audioQuality?.improvements ?? []),
          noiseLevel: cat(c.noiseLevel?.score ?? 65, c.noiseLevel?.feedback ?? '', c.noiseLevel?.improvements ?? []),
          loudnessCompliance: cat(c.loudnessCompliance?.score ?? 65, c.loudnessCompliance?.feedback ?? '', c.loudnessCompliance?.improvements ?? []),
          scriptStructure: cat(c.scriptStructure?.score ?? 65, c.scriptStructure?.feedback ?? '', c.scriptStructure?.improvements ?? []),
          pacing: cat(c.pacing?.score ?? 65, c.pacing?.feedback ?? '', c.pacing?.improvements ?? []),
          introQuality: cat(c.introQuality?.score ?? 65, c.introQuality?.feedback ?? '', c.introQuality?.improvements ?? []),
          outroQuality: cat(c.outroQuality?.score ?? 65, c.outroQuality?.feedback ?? '', c.outroQuality?.improvements ?? []),
          metadataCompleteness: cat(c.metadataCompleteness?.score ?? 50, c.metadataCompleteness?.feedback ?? '', c.metadataCompleteness?.improvements ?? []),
          distributionReadiness: cat(c.distributionReadiness?.score ?? 50, c.distributionReadiness?.feedback ?? '', c.distributionReadiness?.improvements ?? []),
        };
        const scores = Object.values(categories).map(x => x.score);
        const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        return {
          overallScore,
          overallGrade: gradeFromScore(overallScore),
          readyForExport: overallScore >= 70 && (parsed.blockers ?? []).length === 0,
          categories,
          blockers: (parsed.blockers ?? []) as string[],
          recommendations: (parsed.recommendations ?? []) as string[],
          generatedAt: new Date().toISOString(),
        };
      }
    } catch { /* ignore */ }

    return this.fallbackScorecard(input);
  }

  private fallbackScorecard(input: ScorecardInput): QualityScorecard {
    const lufsOk = input.measuredLUFS !== undefined
      && Math.abs(input.measuredLUFS - (input.masteringRec?.targetLUFS ?? -16)) < 3;
    const hasMeta = Boolean(input.episodePackage?.metadata.title);
    const hasNotes = Boolean(input.episodePackage?.showNotes);
    const categories: QualityScorecard['categories'] = {
      audioQuality: cat(input.editRec ? 70 : 55, input.editRec ? 'Post-production complete' : 'No post-production data', []),
      noiseLevel: cat(65, 'No noise measurements available', ['Run through noise analysis in post-production']),
      loudnessCompliance: cat(lufsOk ? 85 : 55, lufsOk ? 'Loudness within target' : 'Loudness not verified', lufsOk ? [] : ['Measure export loudness', 'Target −16 LUFS']),
      scriptStructure: cat(input.hasScript ? 80 : input.hasOutline ? 70 : 55, input.hasScript ? 'Script available' : input.hasOutline ? 'Outline available' : 'No script/outline found', []),
      pacing: cat(65, 'Pacing requires playback review', ['Listen at 1.25× to identify pace issues']),
      introQuality: cat(60, 'Intro not evaluated', ['Review intro hook strength']),
      outroQuality: cat(60, 'Outro not evaluated', ['Confirm CTA is clear and specific']),
      metadataCompleteness: cat(hasMeta && hasNotes ? 80 : hasMeta ? 60 : 30, hasMeta ? 'Core metadata generated' : 'Metadata missing', hasMeta ? [] : ['Complete the Packaging stage']),
      distributionReadiness: cat(hasMeta ? 65 : 35, hasMeta ? 'Metadata ready — verify platforms' : 'Not ready for distribution', ['Complete packaging and distribution stages']),
    };
    const scores = Object.values(categories).map(x => x.score);
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return {
      overallScore,
      overallGrade: gradeFromScore(overallScore),
      readyForExport: overallScore >= 70,
      categories,
      blockers: overallScore < 60 ? ['Complete all production stages before export'] : [],
      recommendations: ['Review all stage outputs', 'Run quality check before distribution'],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const qualityScorecardService = new QualityScorecardService();
