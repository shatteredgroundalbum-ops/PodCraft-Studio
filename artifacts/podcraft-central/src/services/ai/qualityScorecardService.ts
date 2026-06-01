import type {
  QualityScorecard, QualityCategoryScore, QualityStatus, AIMessage,
  MasteringRecommendation, EditRecommendation, EpisodePackage, MixRecommendation,
  ExportFormat,
} from './types';
import { PROCESSING_RANGES, QUALITY_OUTCOMES, PODCAST_STANDARDS, evaluateRange } from './types';
import { aiProducerService } from './aiProducerService';

const R = PROCESSING_RANGES;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return { status: statusFromScore(score), score, grade: gradeFromScore(score), pass: score >= 70, feedback, improvements };
}

function loudnessScore(measuredLUFS: number | undefined, isMono: boolean): QualityCategoryScore {
  const range = isMono ? R.loudness.monoLUFS : R.loudness.stereoLUFS;
  if (measuredLUFS === undefined) {
    return cat(40, `Loudness not measured — gold zone target is ${range.goldLow} LUFS`, [`Measure integrated loudness`, `Adjust to reach ${range.goldLow} LUFS`]);
  }
  const pos = evaluateRange(measuredLUFS, range);
  const target = range.goldLow;
  const diff = Math.abs(measuredLUFS - target);
  const scores: Record<string, number> = { 'below-min': 20, 'below-gold': 55, 'gold': 90, 'above-gold': 65, 'above-max': 25 };
  const feedback: Record<string, string> = {
    'below-min':  `${QUALITY_OUTCOMES.loudness.fail} (${measuredLUFS} LUFS — below ${range.min} LUFS minimum)`,
    'below-gold': `Below gold zone (${measuredLUFS} LUFS — target is ${target} LUFS)`,
    'gold':       `${QUALITY_OUTCOMES.loudness.gold} (${measuredLUFS} LUFS — in gold zone)`,
    'above-gold': `Above gold zone but acceptable (${measuredLUFS} LUFS — max ${range.max} LUFS)`,
    'above-max':  `${QUALITY_OUTCOMES.loudness.over} (${measuredLUFS} LUFS — above ${range.max} LUFS max)`,
  };
  const improvements: Record<string, string[]> = {
    'below-min':  [`Increase output gain by ${diff.toFixed(1)} LU`, `Re-check after adjusting limiter`],
    'below-gold': [`Increase output gain by ~${diff.toFixed(1)} LU`],
    'gold':       [],
    'above-gold': [`Reduce output gain by ~${diff.toFixed(1)} LU if comfortable listening is a priority`],
    'above-max':  [`Reduce output gain by ${diff.toFixed(1)} LU`, `Risk of listener fatigue — do not release at this level`],
  };
  return cat(scores[pos], feedback[pos], improvements[pos]);
}

function truePeakScore(truePeakDB: number | undefined): QualityCategoryScore {
  const range = R.limiter.ceilingDBTP;
  if (truePeakDB === undefined) {
    return cat(45, `True peak not measured — ceiling must be ${range.goldLow} dBTP`, [`Measure true peak before export`, `Set limiter ceiling to ${range.goldLow} dBTP`]);
  }
  if (truePeakDB > 0) {
    return cat(0, `CLIPPING: true peak ${truePeakDB} dBTP exceeds 0 dBTP — unrecoverable distortion`, [`Reduce output gain`, `Set limiter to ceiling ${range.goldLow} dBTP`, `Re-export; do not distribute a clipped file`]);
  }
  const pos = evaluateRange(truePeakDB, range);
  const scores: Record<string, number> = { 'below-min': 80, 'below-gold': 85, 'gold': 95, 'above-gold': 70, 'above-max': 15 };
  const feedbacks: Record<string, string> = {
    'below-min':  `True peak very conservative (${truePeakDB} dBTP — below ${range.min} dBTP) — some dynamic headroom lost`,
    'below-gold': `True peak safe (${truePeakDB} dBTP — between ${range.min} and ${range.goldLow} dBTP)`,
    'gold':       `True peak in gold zone (${truePeakDB} dBTP) ✓`,
    'above-gold': `True peak above gold zone (${truePeakDB} dBTP — limit is ${range.max} dBTP)`,
    'above-max':  `TRUE PEAK VIOLATION (${truePeakDB} dBTP — above ${range.max} dBTP ceiling; clips on many decoders)`,
  };
  return cat(scores[pos], feedbacks[pos], pos === 'above-max' ? [`Set limiter ceiling to ${range.goldLow} dBTP and re-export`] : []);
}

// ─── Input ────────────────────────────────────────────────────────────────────

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
    const isMono = input.isStereo === false;
    const targetLUFS = isMono ? PODCAST_STANDARDS.monoTargetLUFS : PODCAST_STANDARDS.stereoTargetLUFS;
    const measuredLUFS = input.measuredLUFS ?? input.mixRec?.measuredLUFS;

    // Build data context for AI
    const ctx = {
      topic: input.topic, duration: input.durationMinutes,
      hasScript: input.hasScript ?? false, hasOutline: input.hasOutline ?? false,
      hasResearch: input.hasResearch ?? false, hasSources: input.hasSources ?? false,
      speakerCount: input.speakerCount ?? 1,
      hasMusicTrack: input.hasMusicTrack ?? false, hasEffectsTrack: input.hasEffectsTrack ?? false,
      truePeakDB: input.truePeakDB, exportFormat: input.exportFormat,
      fillerWordCount: input.editRec?.fillerWordEstimate,
      measuredLUFS, targetLUFS,
      mixConsistency: input.mixRec?.consistencyScore,
      hasTitle: Boolean(input.episodePackage?.metadata.title),
      hasDescription: Boolean(input.episodePackage?.metadata.description),
      hasShowNotes: Boolean(input.episodePackage?.showNotes),
      keywordCount: input.episodePackage?.metadata.keywords.length ?? 0,
      hasSocialCopy: Boolean(input.episodePackage?.socialCopy.twitter),
      recordingNotes: input.recordingNotes,
    };

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a professional podcast quality analyst. Score 0–100. Use ranges: Pass (≥75), Needs Review (50–74), Fail (<50).
Quality outcomes:
- Noise Reduction: Fail="${QUALITY_OUTCOMES.noiseReduction.fail}" | Gold="${QUALITY_OUTCOMES.noiseReduction.gold}" | Over="${QUALITY_OUTCOMES.noiseReduction.over}"
- EQ: Fail="${QUALITY_OUTCOMES.eq.fail}" | Gold="${QUALITY_OUTCOMES.eq.gold}" | Over="${QUALITY_OUTCOMES.eq.over}"
- Compression: Fail="${QUALITY_OUTCOMES.compression.fail}" | Gold="${QUALITY_OUTCOMES.compression.gold}" | Over="${QUALITY_OUTCOMES.compression.over}"
- Loudness: Fail="${QUALITY_OUTCOMES.loudness.fail}" | Gold="${QUALITY_OUTCOMES.loudness.gold}" | Over="${QUALITY_OUTCOMES.loudness.over}"
- Music Balance: Fail="${QUALITY_OUTCOMES.musicBalance.fail}" | Gold="${QUALITY_OUTCOMES.musicBalance.gold}" | Over="${QUALITY_OUTCOMES.musicBalance.over}"
Respond with valid JSON only.`,
      },
      {
        role: 'user',
        content: `Score this podcast episode across 13 quality categories.
Data: ${JSON.stringify(ctx, null, 2)}

Standards: ${targetLUFS} LUFS target (${isMono ? 'mono' : 'stereo'}), ${PODCAST_STANDARDS.truePeakCeiling} dBTP ceiling, music at −24 to −18 dB below voice gold zone.

JSON:
{
  "categories": {
    "scriptQuality":         { "score": 70, "feedback": "...", "improvements": ["..."] },
    "sourceCompleteness":    { "score": 70, "feedback": "...", "improvements": [] },
    "recordingQuality":      { "score": 70, "feedback": "...", "improvements": [] },
    "noiseLevel":            { "score": 70, "feedback": "...", "improvements": [] },
    "speechClarity":         { "score": 70, "feedback": "...", "improvements": [] },
    "speakerBalance":        { "score": 70, "feedback": "...", "improvements": [] },
    "musicBalance":          { "score": 70, "feedback": "...", "improvements": [] },
    "effectsBalance":        { "score": 70, "feedback": "...", "improvements": [] },
    "loudnessCompliance":    { "score": 70, "feedback": "...", "improvements": [] },
    "truePeakCompliance":    { "score": 70, "feedback": "...", "improvements": [] },
    "metadataCompleteness":  { "score": 70, "feedback": "...", "improvements": [] },
    "exportReadiness":       { "score": 70, "feedback": "...", "improvements": [] },
    "distributionReadiness": { "score": 70, "feedback": "...", "improvements": [] }
  },
  "blockers": [],
  "recommendations": ["priority 1", "priority 2", "priority 3"]
}`,
      },
    ];

    try {
      const raw = await aiProducerService.runTask('quality-check', messages);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        const c = parsed.categories;
        const categories = this.buildAICategories(c, measuredLUFS, isMono, input);
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
    } catch { /* fall through */ }

    return this.fallbackScorecard(input, measuredLUFS, isMono);
  }

  private buildAICategories(
    c: Record<string, { score?: number; feedback?: string; improvements?: string[] }>,
    measuredLUFS: number | undefined,
    isMono: boolean,
    input: ScorecardInput,
  ): QualityScorecard['categories'] {
    const mk = (key: string, fallback = 60) => cat(
      c[key]?.score ?? fallback,
      c[key]?.feedback ?? '',
      c[key]?.improvements ?? [],
    );
    // Override AI scores for loudness and true peak with range-based evaluation
    return {
      scriptQuality:         mk('scriptQuality'),
      sourceCompleteness:    mk('sourceCompleteness'),
      recordingQuality:      mk('recordingQuality'),
      noiseLevel:            mk('noiseLevel'),
      speechClarity:         mk('speechClarity'),
      speakerBalance:        mk('speakerBalance', 65),
      musicBalance:          mk('musicBalance', 65),
      effectsBalance:        mk('effectsBalance', 65),
      loudnessCompliance:    loudnessScore(measuredLUFS, isMono),
      truePeakCompliance:    truePeakScore(input.truePeakDB),
      metadataCompleteness:  mk('metadataCompleteness', 40),
      exportReadiness:       mk('exportReadiness', 40),
      distributionReadiness: mk('distributionReadiness', 35),
    };
  }

  private fallbackScorecard(input: ScorecardInput, measuredLUFS: number | undefined, isMono: boolean): QualityScorecard {
    const hasMeta = Boolean(input.episodePackage?.metadata.title && input.episodePackage?.metadata.description);
    const hasNotes = Boolean(input.episodePackage?.showNotes);
    const hasKeywords = (input.episodePackage?.metadata.keywords.length ?? 0) >= 5;

    const categories: QualityScorecard['categories'] = {
      scriptQuality:         cat(input.hasScript ? 75 : input.hasOutline ? 60 : 40, input.hasScript ? 'Script available' : input.hasOutline ? 'Outline available — no final script' : 'No script generated', input.hasScript ? [] : ['Complete script writing in Pre-Production']),
      sourceCompleteness:    cat(input.hasSources ? 75 : input.hasResearch ? 60 : 35, input.hasSources ? 'Sources collected' : input.hasResearch ? 'Research done, sources not verified' : 'No research package', input.hasSources ? [] : ['Generate research package']),
      recordingQuality:      cat(input.editRec ? 72 : 55, input.editRec ? 'Edit analysis complete' : 'No edit analysis yet', input.editRec ? [] : ['Run Post-Production edit analysis']),
      noiseLevel:            cat(65, `Noise level not directly measured — check recording notes`, ['Review recording for background noise', 'Apply noise reduction in gold zone (3–8 dB) if needed']),
      speechClarity:         cat(input.editRec ? 70 : 55, input.editRec ? `~${input.editRec.fillerWordEstimate} filler words detected` : 'Speech clarity not analysed', ['Review filler words and pacing']),
      speakerBalance:        cat((input.speakerCount ?? 1) > 1 ? 60 : 80, (input.speakerCount ?? 1) > 1 ? 'Multi-speaker — verify levels match' : 'Single speaker', []),
      musicBalance:          cat(input.hasMusicTrack ? 60 : 80, input.hasMusicTrack ? `Music present — gold zone: −24 to −18 dB below voice` : 'No music track', input.hasMusicTrack ? ['Verify music is in gold zone (−24 to −18 dB below voice)'] : []),
      effectsBalance:        cat(input.hasEffectsTrack ? 65 : 80, input.hasEffectsTrack ? 'Effects present — verify they support speech' : 'No effects track', []),
      loudnessCompliance:    loudnessScore(measuredLUFS, isMono),
      truePeakCompliance:    truePeakScore(input.truePeakDB),
      metadataCompleteness:  cat(hasMeta && hasNotes && hasKeywords ? 85 : hasMeta ? 60 : 25, hasMeta ? 'Title and description ready' : 'Metadata not generated', hasMeta ? [] : ['Complete Packaging stage']),
      exportReadiness:       cat(Boolean(input.exportFormat) && hasMeta ? 78 : hasMeta ? 55 : 30, input.exportFormat ? `Export format: ${input.exportFormat.toUpperCase()}` : 'Export format not selected', Boolean(input.exportFormat) ? [] : ['Select export format (MP3 for distribution, WAV for archive)']),
      distributionReadiness: cat(hasMeta && hasNotes ? 72 : hasMeta ? 55 : 25, hasMeta && hasNotes ? 'Metadata and show notes ready' : 'Distribution preparation incomplete', ['Verify all platform-specific metadata fields']),
    };

    const scores = Object.values(categories).map(x => x.score);
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const blockers = [
      ...(input.truePeakDB !== undefined && input.truePeakDB > 0 ? [`CLIPPING: true peak ${input.truePeakDB} dBTP — do not distribute`] : []),
      ...(!hasMeta ? ['Metadata incomplete — finish Packaging before distribution'] : []),
    ];

    return {
      overallScore,
      overallGrade: gradeFromScore(overallScore),
      overallStatus: statusFromScore(overallScore),
      readyForExport: overallScore >= 70 && blockers.length === 0,
      categories,
      blockers,
      recommendations: [
        ...(!input.hasScript ? ['Write episode script in Pre-Production'] : []),
        ...(!input.hasSources ? ['Collect and verify research sources'] : []),
        ...(measuredLUFS === undefined ? [`Measure integrated loudness (target ${isMono ? PODCAST_STANDARDS.monoTargetLUFS : PODCAST_STANDARDS.stereoTargetLUFS} LUFS)`] : []),
        ...(!hasMeta ? ['Complete Packaging stage'] : []),
      ].filter(Boolean),
      generatedAt: new Date().toISOString(),
    };
  }
}

export const qualityScorecardService = new QualityScorecardService();
