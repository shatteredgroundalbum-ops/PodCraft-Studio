import type {
  QualityScorecard, QualityCategoryScore, QualityStatus, AIMessage,
  MasteringRecommendation, EditRecommendation, EpisodePackage, MixRecommendation,
  ExportFormat,
} from './types';
import { PODCAST_STANDARDS } from './types';
import { aiProviderService } from './aiProviderService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gradeFromScore(score: number): QualityCategoryScore['grade'] {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function statusFromScore(score: number): QualityStatus {
  if (score >= 75) return 'pass';
  if (score >= 50) return 'needs-review';
  return 'fail';
}

function cat(score: number, feedback: string, improvements: string[] = []): QualityCategoryScore {
  return {
    status: statusFromScore(score),
    score,
    grade: gradeFromScore(score),
    pass: score >= 70,
    feedback,
    improvements,
  };
}

// ─── Input type ───────────────────────────────────────────────────────────────

export interface ScorecardInput {
  topic?: string;
  durationMinutes?: number;
  recordingNotes?: string;
  hasScript?: boolean;
  hasOutline?: boolean;
  hasResearch?: boolean;
  hasSources?: boolean;
  speakerCount?: number;
  hasMusicTrack?: boolean;
  hasEffectsTrack?: boolean;
  truePeakDB?: number;
  isStereo?: boolean;
  exportFormat?: ExportFormat;
  editRec?: EditRecommendation;
  mixRec?: MixRecommendation;
  masteringRec?: MasteringRecommendation;
  episodePackage?: EpisodePackage;
  measuredLUFS?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class QualityScorecardService {
  async generateScorecard(input: ScorecardInput): Promise<QualityScorecard> {
    const targetLUFS = input.isStereo === false
      ? PODCAST_STANDARDS.monoTargetLUFS
      : PODCAST_STANDARDS.stereoTargetLUFS;

    const ctx = {
      topic: input.topic,
      duration: input.durationMinutes,
      hasScript: input.hasScript ?? false,
      hasOutline: input.hasOutline ?? false,
      hasResearch: input.hasResearch ?? false,
      hasSources: input.hasSources ?? false,
      speakerCount: input.speakerCount ?? 1,
      hasMusicTrack: input.hasMusicTrack ?? false,
      hasEffectsTrack: input.hasEffectsTrack ?? false,
      truePeakDB: input.truePeakDB,
      truePeakCeiling: PODCAST_STANDARDS.truePeakCeiling,
      exportFormat: input.exportFormat,
      fillerWordCount: input.editRec?.fillerWordEstimate,
      editSavingsMinutes: input.editRec?.estimatedEditSavingsMinutes,
      measuredLUFS: input.measuredLUFS ?? input.mixRec?.measuredLUFS,
      targetLUFS,
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
        content: 'You are a professional podcast quality analyst. Score episodes 0–100 per category. Use Pass (≥75), Needs Review (50–74), Fail (<50). Be honest and constructive. Respond with valid JSON only.',
      },
      {
        role: 'user',
        content: `Score this podcast episode across 13 professional quality categories.
Available data: ${JSON.stringify(ctx, null, 2)}

Professional standards applied:
- Loudness: ${targetLUFS} LUFS integrated target
- True peak: ${PODCAST_STANDARDS.truePeakCeiling} dBTP ceiling (never exceed 0 dBFS)
- Script: must sound natural when read aloud (CDC spoken-word guidance)
- Music: must never overpower speech

Respond with this exact JSON structure:
{
  "categories": {
    "scriptQuality":         { "score": 70, "feedback": "...", "improvements": ["..."] },
    "sourceCompleteness":    { "score": 70, "feedback": "...", "improvements": ["..."] },
    "recordingQuality":      { "score": 70, "feedback": "...", "improvements": ["..."] },
    "noiseLevel":            { "score": 70, "feedback": "...", "improvements": ["..."] },
    "speechClarity":         { "score": 70, "feedback": "...", "improvements": ["..."] },
    "speakerBalance":        { "score": 70, "feedback": "...", "improvements": ["..."] },
    "musicBalance":          { "score": 70, "feedback": "...", "improvements": ["..."] },
    "effectsBalance":        { "score": 70, "feedback": "...", "improvements": ["..."] },
    "loudnessCompliance":    { "score": 70, "feedback": "...", "improvements": ["..."] },
    "truePeakCompliance":    { "score": 70, "feedback": "...", "improvements": ["..."] },
    "metadataCompleteness":  { "score": 70, "feedback": "...", "improvements": ["..."] },
    "exportReadiness":       { "score": 70, "feedback": "...", "improvements": ["..."] },
    "distributionReadiness": { "score": 70, "feedback": "...", "improvements": ["..."] }
  },
  "blockers": ["critical issue that must be resolved before export — omit array entry if none"],
  "recommendations": ["top priority 1", "priority 2", "priority 3"]
}`,
      },
    ];

    try {
      const raw = await aiProviderService.prompt(messages);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        const c = parsed.categories;
        const categories = this.buildCategories(c);
        const scores = Object.values(categories).map(x => x.score);
        const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const blockers = ((parsed.blockers ?? []) as string[]).filter(Boolean);
        return {
          overallScore,
          overallGrade: gradeFromScore(overallScore),
          overallStatus: statusFromScore(overallScore),
          readyForExport: overallScore >= 70 && blockers.length === 0,
          categories,
          blockers,
          recommendations: (parsed.recommendations ?? []) as string[],
          generatedAt: new Date().toISOString(),
        };
      }
    } catch { /* ignore */ }

    return this.fallbackScorecard(input, targetLUFS);
  }

  private buildCategories(c: Record<string, { score?: number; feedback?: string; improvements?: string[] }>): QualityScorecard['categories'] {
    const mk = (key: string, fallback = 60) => cat(
      c[key]?.score ?? fallback,
      c[key]?.feedback ?? '',
      c[key]?.improvements ?? [],
    );
    return {
      scriptQuality:         mk('scriptQuality'),
      sourceCompleteness:    mk('sourceCompleteness'),
      recordingQuality:      mk('recordingQuality'),
      noiseLevel:            mk('noiseLevel'),
      speechClarity:         mk('speechClarity'),
      speakerBalance:        mk('speakerBalance', 65),
      musicBalance:          mk('musicBalance', 65),
      effectsBalance:        mk('effectsBalance', 65),
      loudnessCompliance:    mk('loudnessCompliance', 55),
      truePeakCompliance:    mk('truePeakCompliance', 55),
      metadataCompleteness:  mk('metadataCompleteness', 40),
      exportReadiness:       mk('exportReadiness', 40),
      distributionReadiness: mk('distributionReadiness', 35),
    };
  }

  private fallbackScorecard(input: ScorecardInput, targetLUFS: number): QualityScorecard {
    const lufsOk = input.measuredLUFS !== undefined && Math.abs(input.measuredLUFS - targetLUFS) <= 1.5;
    const tpOk = input.truePeakDB !== undefined && input.truePeakDB <= PODCAST_STANDARDS.truePeakCeiling;
    const hasMeta = Boolean(input.episodePackage?.metadata.title && input.episodePackage?.metadata.description);
    const hasNotes = Boolean(input.episodePackage?.showNotes);
    const hasKeywords = (input.episodePackage?.metadata.keywords.length ?? 0) >= 5;
    const hasExportFormat = Boolean(input.exportFormat);

    const categories: QualityScorecard['categories'] = {
      scriptQuality:         cat(input.hasScript ? 75 : input.hasOutline ? 60 : 40, input.hasScript ? 'Script available for review' : input.hasOutline ? 'Outline available, no final script' : 'No script or outline generated', input.hasScript ? [] : ['Complete the script in Pre-Production stage']),
      sourceCompleteness:    cat(input.hasSources ? 75 : input.hasResearch ? 60 : 35, input.hasSources ? 'Sources collected' : input.hasResearch ? 'Research done, sources not verified' : 'No research package generated', input.hasSources ? [] : ['Generate research package and verify sources']),
      recordingQuality:      cat(input.editRec ? 72 : 55, input.editRec ? 'Post-production edit analysis complete' : 'No post-production analysis yet', input.editRec ? [] : ['Run edit recommendations in Post-Production stage']),
      noiseLevel:            cat(65, 'Noise level not directly measured — verify in editing', ['Check recording notes for noise mentions', 'Run noise analysis in Post-Production']),
      speechClarity:         cat(input.editRec ? 70 : 55, input.editRec ? `Est. ${input.editRec.fillerWordEstimate} filler words detected` : 'Speech clarity not yet analysed', ['Review filler word count', 'Check pacing in Post-Production']),
      speakerBalance:        cat((input.speakerCount ?? 1) > 1 ? 60 : 75, (input.speakerCount ?? 1) > 1 ? 'Multi-speaker — verify level balance in mix' : 'Single speaker — balance check not required', []),
      musicBalance:          cat(input.hasMusicTrack ? 60 : 80, input.hasMusicTrack ? 'Music present — verify it does not overpower speech' : 'No music track — speech is the sole focus', input.hasMusicTrack ? ['Confirm speech remains fully intelligible with music'] : []),
      effectsBalance:        cat(input.hasEffectsTrack ? 65 : 80, input.hasEffectsTrack ? 'Sound effects present — verify they support, not distract' : 'No effects track detected', []),
      loudnessCompliance:    cat(lufsOk ? 85 : input.measuredLUFS !== undefined ? 45 : 40, lufsOk ? `Compliant: within range of ${targetLUFS} LUFS target` : input.measuredLUFS !== undefined ? `Non-compliant: ${input.measuredLUFS} LUFS measured vs ${targetLUFS} LUFS target` : `Loudness not measured — target is ${targetLUFS} LUFS`, lufsOk ? [] : [`Measure integrated loudness`, `Adjust gain to reach ${targetLUFS} LUFS`]),
      truePeakCompliance:    cat(tpOk ? 90 : input.truePeakDB !== undefined ? 30 : 45, tpOk ? `True peak compliant: ${input.truePeakDB} dBTP ≤ ${PODCAST_STANDARDS.truePeakCeiling} dBTP ceiling` : input.truePeakDB !== undefined ? `TRUE PEAK VIOLATION: ${input.truePeakDB} dBTP exceeds ${PODCAST_STANDARDS.truePeakCeiling} dBTP ceiling` : 'True peak not measured', tpOk ? [] : [`Set limiter ceiling to ${PODCAST_STANDARDS.truePeakCeiling} dBTP`, 'Measure true peak before export']),
      metadataCompleteness:  cat(hasMeta && hasNotes && hasKeywords ? 85 : hasMeta ? 60 : 25, hasMeta ? `Title and description present${hasKeywords ? ', keywords ready' : ' — add keywords'}` : 'Metadata not generated', hasMeta ? (hasKeywords ? [] : ['Add episode keywords']) : ['Complete Packaging stage to generate metadata']),
      exportReadiness:       cat(hasExportFormat && hasMeta ? 78 : hasMeta ? 55 : 30, hasExportFormat ? `Export format selected: ${input.exportFormat?.toUpperCase()}` : 'Export format not selected', hasExportFormat ? [] : ['Select export format (MP3 for distribution, WAV for archive)']),
      distributionReadiness: cat(hasMeta && hasNotes ? 72 : hasMeta ? 55 : 25, hasMeta && hasNotes ? 'Metadata and show notes ready for platform upload' : 'Distribution preparation incomplete', ['Verify platform-specific requirements', 'Check all metadata fields are filled']),
    };

    const scores = Object.values(categories).map(x => x.score);
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const blockers = [
      ...(tpOk === false && input.truePeakDB !== undefined ? [`True peak violation: ${input.truePeakDB} dBTP exceeds ${PODCAST_STANDARDS.truePeakCeiling} dBTP ceiling — fix before export`] : []),
      ...(!hasMeta ? ['Metadata not complete — finish Packaging stage before distribution'] : []),
    ];

    return {
      overallScore,
      overallGrade: gradeFromScore(overallScore),
      overallStatus: statusFromScore(overallScore),
      readyForExport: overallScore >= 70 && blockers.length === 0,
      categories,
      blockers,
      recommendations: [
        ...(!input.hasScript ? ['Write and review episode script in Pre-Production'] : []),
        ...(!input.hasSources ? ['Collect and verify research sources'] : []),
        ...(!lufsOk ? [`Adjust loudness to ${targetLUFS} LUFS target`] : []),
        ...(!hasMeta ? ['Complete Packaging stage'] : []),
      ].filter(Boolean),
      generatedAt: new Date().toISOString(),
    };
  }
}

export const qualityScorecardService = new QualityScorecardService();
