import type {
  MicReadiness, RecordingFeedback,
  RoomNoiseAssessment, MicAssessment, RecordingEnvironmentAssessment,
  RecordingReadinessScore, RecordingReadinessLevel, EnvironmentStatus,
  ReadinessMetric, AIMessage,
} from './types';
import { PROCESSING_RANGES, RECORDING_STANDARDS } from './types';
import {
  matchMicProfile, matchInterfaceProfile, formatProfileForPrompt,
  CALIBRATION_STEPS,
  type MicProfile, type InterfaceProfile, type CalibrationSession,
} from './deviceProfiles';
import { aiProviderService } from './aiProviderService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function linearToDBFS(linear: number): number {
  if (linear <= 0) return -Infinity;
  return 20 * Math.log10(Math.min(linear, 1));
}

function fmtDB(db: number): string {
  return isFinite(db) ? `${db.toFixed(1)} dBFS` : '−∞ dBFS';
}

function readinessLevelFromScore(score: number): RecordingReadinessLevel {
  if (score >= 90) return 'ready';
  if (score >= 75) return 'acceptable';
  if (score >= 60) return 'needs-improvement';
  return 'not-ready';
}

function statusFromScore(score: number): EnvironmentStatus {
  if (score >= 75) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

function statusLabelFromLevel(level: RecordingReadinessLevel): string {
  return RECORDING_STANDARDS.readinessScore[
    level === 'ready' ? 'ready' :
    level === 'acceptable' ? 'acceptable' :
    level === 'needs-improvement' ? 'needsImprovement' :
    'notReady'
  ].label;
}

function metric(status: EnvironmentStatus, note: string, recommendation?: string): ReadinessMetric {
  return { status, note, recommendation };
}

function green(note: string): ReadinessMetric { return metric('green', note); }
function yellow(note: string, rec?: string): ReadinessMetric { return metric('yellow', note, rec); }
function red(note: string, rec: string): ReadinessMetric { return metric('red', note, rec); }

// Input level range thresholds
const R = PROCESSING_RANGES.recording.inputPeakDB;
const NOISE_FAIL_DB = -50;   // above this = failing noise floor
const NOISE_WARN_DB = -60;   // above this = below gold zone

// ─── Service ──────────────────────────────────────────────────────────────────

class RecordingCoachService {

  // ── Real-time mic level analysis ─────────────────────────────────────────

  analyzeMicLevel(peak: number, rms: number): MicReadiness {
    const peakDB = linearToDBFS(peak);
    const rmsDB  = linearToDBFS(rms);

    if (peak <= 0 || !isFinite(peakDB) || peakDB < -70) {
      return { status: 'no-signal', level: 0, message: 'No signal detected', suggestion: 'Check microphone connection and input device selection.' };
    }
    if (peak >= 0.99 || peakDB >= -0.1) {
      return { status: 'clipping', level: peak, message: `Clipping (${fmtDB(peakDB)})`, suggestion: 'Lower input gain immediately. Any clipping is unrecoverable.' };
    }
    if (peakDB > R.max) {   // above −6 dBFS
      return { status: 'too-loud', level: peak, message: `Too hot (${fmtDB(peakDB)} — above ${R.max} dBFS max)`, suggestion: `Reduce gain to reach gold zone: ${R.goldLow} to ${R.goldHigh} dBFS.` };
    }
    if (peakDB > R.goldHigh) {  // −12 to −6 dBFS
      return { status: 'too-loud', level: peak, message: `Above gold zone (${fmtDB(peakDB)} — gold is ${R.goldLow} to ${R.goldHigh} dBFS)`, suggestion: 'Reduce gain slightly to leave headroom for loud moments.' };
    }
    if (peakDB >= R.goldLow) {  // −18 to −12 dBFS = gold zone
      const noisy = isFinite(rmsDB) && rmsDB > NOISE_WARN_DB;
      if (noisy) {
        return { status: 'noise-high', level: peak, message: `Level good (${fmtDB(peakDB)}) but background noise elevated`, suggestion: 'Turn off fans, HVAC, and background equipment before recording.' };
      }
      return { status: 'ready', level: peak, message: `Gold zone (${fmtDB(peakDB)}) — ready to record`, suggestion: "Levels are ideal. Headroom exists for emphasis. Hit record when ready." };
    }
    if (peakDB >= R.min) {  // −30 to −18 dBFS
      return { status: 'too-quiet', level: peak, message: `Below gold zone (${fmtDB(peakDB)} — target ${R.goldLow} to ${R.goldHigh} dBFS)`, suggestion: 'Increase gain or move closer to the microphone.' };
    }
    return { status: 'too-quiet', level: peak, message: `Signal very weak (${fmtDB(peakDB)} — below ${R.min} dBFS minimum)`, suggestion: 'Check microphone and increase gain significantly.' };
  }

  analyzeNoise(noiseFloor: number): MicReadiness {
    const noiseDB = linearToDBFS(noiseFloor);
    if (isFinite(noiseDB) && noiseDB > NOISE_FAIL_DB) {
      return { status: 'noise-high', level: noiseFloor, message: `Noise floor too high (${noiseDB.toFixed(0)} dBFS — minimum ${NOISE_FAIL_DB} dB)`, suggestion: 'Turn off fans, HVAC, and electrical equipment. Move to a quieter room or treat the space.' };
    }
    if (isFinite(noiseDB) && noiseDB > NOISE_WARN_DB) {
      return { status: 'noise-high', level: noiseFloor, message: `Noise floor above gold zone (${noiseDB.toFixed(0)} dBFS — target below ${NOISE_WARN_DB} dB)`, suggestion: 'Reduce background noise where possible. Light noise reduction in post will help.' };
    }
    return { status: 'ready', level: noiseFloor, message: `Noise floor in gold zone (${isFinite(noiseDB) ? noiseDB.toFixed(0) : '−∞'} dBFS)`, suggestion: '' };
  }

  generateLiveFeedback(peak: number, rms: number, silenceDuration: number, clipCount: number): RecordingFeedback[] {
    const feedback: RecordingFeedback[] = [];
    const now    = Date.now();
    const peakDB = linearToDBFS(peak);

    if (peak >= 0.99 || peakDB >= -0.1) {
      feedback.push({ id: `clip-${now}`, type: 'clipping', severity: 'error',   message: `Clipping (${fmtDB(peakDB)}) — lower gain immediately`,   timestamp: now });
    } else if (peakDB > R.max) {
      feedback.push({ id: `hot-${now}`,  type: 'level',    severity: 'warning', message: `Too hot (${fmtDB(peakDB)}) — reduce gain`,                 timestamp: now });
    } else if (peakDB > R.goldHigh) {
      feedback.push({ id: `hi-${now}`,   type: 'level',    severity: 'warning', message: `Level high (${fmtDB(peakDB)}) — approaching max`,           timestamp: now });
    } else if (peakDB < R.goldLow && peakDB > R.min) {
      feedback.push({ id: `lo-${now}`,   type: 'level',    severity: 'warning', message: `Level low (${fmtDB(peakDB)}) — aim for ${R.goldLow} to ${R.goldHigh} dBFS`, timestamp: now });
    }

    if (clipCount > 3) {
      feedback.push({ id: `clips-${now}`, type: 'level',   severity: 'warning', message: `${clipCount} clips — check input gain`,                     timestamp: now });
    }
    if (peak < 0.005 && silenceDuration > 5) {
      feedback.push({ id: `sil-${now}`,  type: 'silence',  severity: 'warning', message: `${Math.round(silenceDuration)}s of silence`,               timestamp: now });
    }
    const snr = peak > 0 ? peak / Math.max(rms, 0.0001) : 0;
    if (snr < 5 && peak > 0.01) {
      feedback.push({ id: `nr-${now}`,   type: 'noise',    severity: 'info',    message: 'Room noise elevated relative to voice',                     timestamp: now });
    }
    return feedback;
  }

  // ── Recording Readiness Assessment ────────────────────────────────────────

  /**
   * Full AI-driven readiness assessment.
   * Combines measured audio data with user-provided room/mic descriptions.
   * Returns Green / Yellow / Red status for room noise, mic setup, and environment,
   * plus a 0–100 readiness score with status label (Ready / Acceptable / Needs Improvement / Not Ready).
   * User can override any Yellow warning; Red blockers must be resolved or explicitly accepted.
   */
  async assessFullReadiness(input: {
    peakDB?: number;
    noiseFloorDB?: number;
    clippingEvents?: number;
    roomDescription?: string;
    micDescription?: string;
    userOverride?: boolean;
  }): Promise<RecordingReadinessScore> {

    const {
      peakDB, noiseFloorDB, clippingEvents = 0,
      roomDescription, micDescription, userOverride = false,
    } = input;

    // Build measurable sub-scores first
    const micPeakScore = this.scorePeakLevel(peakDB);
    const noiseScore   = this.scoreNoiseFloor(noiseFloorDB);
    const clippingOK   = clippingEvents === 0;

    // Use AI to assess qualitative factors if descriptions are provided
    const aiAssessment = (roomDescription || micDescription)
      ? await this.runAIReadinessAssessment(roomDescription, micDescription)
      : null;

    // Build sub-assessments
    const roomNoise   = this.buildRoomNoiseAssessment(noiseFloorDB, aiAssessment);
    const micSetup    = this.buildMicAssessment(peakDB, clippingEvents, micDescription, aiAssessment);
    const environment = this.buildEnvironmentAssessment(roomDescription, aiAssessment);

    // Calculate overall score (weighted: mic level 35%, noise 30%, environment 35%)
    const micScore  = this.statusToScore(micSetup.overallStatus);
    const roomScore = this.statusToScore(roomNoise.overallStatus);
    const envScore  = this.statusToScore(environment.overallStatus);
    let score = Math.round(micScore * 0.35 + roomScore * 0.30 + envScore * 0.35);

    // Clipping is always a hard failure
    if (!clippingOK) score = Math.min(score, 40);

    // Collect blockers and warnings
    const blockers: string[] = [
      ...(!clippingOK ? [`${clippingEvents} clipping event(s) detected — do not record until gain is reduced`] : []),
      ...roomNoise.issues.filter((_, i) => i < 2 && roomNoise.overallStatus === 'red'),
      ...micSetup.issues.filter((_, i) => i < 2 && micSetup.overallStatus === 'red'),
    ];
    const warnings: string[] = [
      ...roomNoise.recommendations.filter(() => roomNoise.overallStatus === 'yellow'),
      ...micSetup.recommendations.filter(() => micSetup.overallStatus === 'yellow'),
      ...environment.recommendations.filter(() => environment.overallStatus === 'yellow'),
    ];

    const level = readinessLevelFromScore(score);
    const overallStatus = statusFromScore(score);

    return {
      score,
      level,
      statusLabel: statusLabelFromLevel(level),
      environmentStatus: overallStatus,
      roomNoise,
      micSetup,
      environment,
      blockers,
      warnings,
      approvedByUser: userOverride,
    };
  }

  private statusToScore(status: EnvironmentStatus): number {
    return status === 'green' ? 90 : status === 'yellow' ? 70 : 45;
  }

  private scorePeakLevel(peakDB: number | undefined): EnvironmentStatus {
    if (peakDB === undefined) return 'yellow';
    if (peakDB >= 0)           return 'red';    // clipping
    if (peakDB > R.max)        return 'red';    // above −6 dBFS
    if (peakDB >= R.goldLow)   return 'green';  // −18 to −12 dBFS
    if (peakDB >= R.min)       return 'yellow'; // below gold zone
    return 'red';
  }

  private scoreNoiseFloor(noiseFloorDB: number | undefined): EnvironmentStatus {
    if (noiseFloorDB === undefined) return 'yellow';
    if (noiseFloorDB > NOISE_FAIL_DB) return 'red';
    if (noiseFloorDB > NOISE_WARN_DB) return 'yellow';
    return 'green';
  }

  private async runAIReadinessAssessment(
    roomDesc?: string,
    micDesc?: string,
  ): Promise<Record<string, string> | null> {
    const messages: AIMessage[] = [{
      role: 'system',
      content: `You are a professional audio engineer assessing recording readiness. Use the formal spec:
Room Noise: Ambient ${RECORDING_STANDARDS.roomNoise.ambientNoiseDB.min} dB min, ${RECORDING_STANDARDS.roomNoise.ambientNoiseDB.goldHigh} to ${RECORDING_STANDARDS.roomNoise.ambientNoiseDB.goldLow} dB gold zone.
HVAC/Fan: min "${RECORDING_STANDARDS.roomNoise.hvacFanNoise.min}", gold "${RECORDING_STANDARDS.roomNoise.hvacFanNoise.gold}", max "${RECORDING_STANDARDS.roomNoise.hvacFanNoise.max}"
Echo/Reverb: min "${RECORDING_STANDARDS.roomNoise.echoReverb.min}", gold "${RECORDING_STANDARDS.roomNoise.echoReverb.gold}", max "${RECORDING_STANDARDS.roomNoise.echoReverb.max}"
Mic distance: min "${RECORDING_STANDARDS.micCheck.distanceIn.min}", gold "${RECORDING_STANDARDS.micCheck.distanceIn.gold}", max "${RECORDING_STANDARDS.micCheck.distanceIn.max}"
Respond with JSON only.`,
    }, {
      role: 'user',
      content: `Assess recording readiness for:
Room: ${roomDesc ?? 'not described'}
Microphone: ${micDesc ?? 'not described'}

Identify issues and recommend corrections per the spec.
JSON:
{
  "hvacStatus": "green|yellow|red", "hvacNote": "...", "hvacRec": "...",
  "trafficStatus": "green|yellow|red", "trafficNote": "...",
  "echoStatus": "green|yellow|red", "echoNote": "...", "echoRec": "...",
  "keyboardStatus": "green|yellow|red", "keyboardNote": "...",
  "chairStatus": "green|yellow|red", "chairNote": "...",
  "petStatus": "green|yellow|red", "petNote": "...",
  "distanceStatus": "green|yellow|red", "distanceNote": "...", "distanceRec": "...",
  "popFilterStatus": "green|yellow|red", "popFilterNote": "...",
  "mouthNoiseStatus": "green|yellow|red", "mouthNoiseNote": "...",
  "reflectionsStatus": "green|yellow|red", "reflectionsNote": "...",
  "humStatus": "green|yellow|red", "humNote": "...",
  "fanStatus": "green|yellow|red", "fanNote": "...",
  "outsideStatus": "green|yellow|red", "outsideNote": "...",
  "roomEchoStatus": "green|yellow|red", "roomEchoNote": "..."
}`,
    }];

    try {
      const raw = await aiProviderService.prompt(messages);
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]) as Record<string, string>;
    } catch { /* ignore */ }
    return null;
  }

  private getStatus(ai: Record<string, string> | null, key: string): EnvironmentStatus {
    const v = ai?.[key];
    if (v === 'green' || v === 'yellow' || v === 'red') return v;
    return 'yellow';
  }

  private buildRoomNoiseAssessment(
    noiseFloorDB: number | undefined,
    ai: Record<string, string> | null,
  ): RoomNoiseAssessment {
    const ambientStatus = this.scoreNoiseFloor(noiseFloorDB);
    const items = {
      hvacFanNoise: metric(
        this.getStatus(ai, 'hvacStatus'),
        ai?.hvacNote ?? 'HVAC/fan noise not assessed',
        ai?.hvacRec,
      ),
      trafficNoise: metric(
        this.getStatus(ai, 'trafficStatus'),
        ai?.trafficNote ?? 'Traffic noise not assessed',
      ),
      echoReverb: metric(
        this.getStatus(ai, 'echoStatus'),
        ai?.echoNote ?? 'Echo/reverb not assessed',
        ai?.echoRec,
      ),
      keyboardNoise: metric(this.getStatus(ai, 'keyboardStatus'), ai?.keyboardNote ?? 'Keyboard noise not assessed'),
      chairNoise:    metric(this.getStatus(ai, 'chairStatus'),    ai?.chairNote    ?? 'Chair noise not assessed'),
      petChildNoise: metric(this.getStatus(ai, 'petStatus'),      ai?.petNote      ?? 'Pet/child noise not assessed'),
    };

    const statuses = [ambientStatus, ...Object.values(items).map(i => i.status)];
    const overallStatus: EnvironmentStatus =
      statuses.includes('red') ? 'red' :
      statuses.includes('yellow') ? 'yellow' : 'green';

    const issues = Object.values(items).filter(i => i.status !== 'green').map(i => i.note);
    const recommendations = Object.values(items).filter(i => i.recommendation).map(i => i.recommendation!);

    if (noiseFloorDB !== undefined) {
      if (noiseFloorDB > NOISE_FAIL_DB) issues.unshift(`Noise floor ${noiseFloorDB.toFixed(0)} dBFS — above ${NOISE_FAIL_DB} dB minimum`);
      else if (noiseFloorDB > NOISE_WARN_DB) issues.unshift(`Noise floor ${noiseFloorDB.toFixed(0)} dBFS — below ${NOISE_WARN_DB} dB gold zone`);
    }

    return { ambientNoiseDB: noiseFloorDB, ambientNoiseStatus: ambientStatus, ...items, overallStatus, issues, recommendations };
  }

  private buildMicAssessment(
    peakDB: number | undefined,
    clippingEvents: number,
    micDesc: string | undefined,
    ai: Record<string, string> | null,
  ): MicAssessment {
    const peakStatus = this.scorePeakLevel(peakDB);
    const items = {
      distanceEstimate: metric(this.getStatus(ai, 'distanceStatus'), ai?.distanceNote ?? (micDesc ? 'See description' : 'Distance not specified'), ai?.distanceRec),
      popFilter:        metric(this.getStatus(ai, 'popFilterStatus'), ai?.popFilterNote ?? 'Pop filter status unknown'),
      mouthNoise:       metric(this.getStatus(ai, 'mouthNoiseStatus'), ai?.mouthNoiseNote ?? 'Mouth noise not assessed'),
    };

    const statuses: EnvironmentStatus[] = [peakStatus, ...Object.values(items).map(i => i.status)];
    if (clippingEvents > 0) statuses.push('red');
    const overallStatus: EnvironmentStatus =
      statuses.includes('red') ? 'red' :
      statuses.includes('yellow') ? 'yellow' : 'green';

    const issues: string[] = [
      ...(clippingEvents > 0 ? [`${clippingEvents} clipping event(s) — reduce gain immediately`] : []),
      ...(peakDB !== undefined && peakDB > R.max ? [`Input level ${peakDB.toFixed(1)} dBFS — above ${R.max} dBFS max`] : []),
      ...(peakDB !== undefined && peakDB < R.goldLow ? [`Input level ${peakDB.toFixed(1)} dBFS — below gold zone (${R.goldLow} to ${R.goldHigh} dBFS)`] : []),
      ...Object.values(items).filter(i => i.status !== 'green').map(i => i.note),
    ];
    const recommendations = [
      ...(peakDB !== undefined && peakDB < R.goldLow ? [`Increase gain to reach ${R.goldLow} to ${R.goldHigh} dBFS gold zone`] : []),
      ...Object.values(items).filter(i => i.recommendation).map(i => i.recommendation!),
    ];

    return {
      micDetected: peakDB !== undefined && peakDB > -70,
      micName: micDesc ? micDesc.split(',')[0] : undefined,
      ...items,
      inputSignalPresent: peakDB !== undefined && peakDB > -70,
      peakLevelDB: peakDB,
      peakStatus,
      clippingEvents,
      overallStatus,
      issues,
      recommendations,
    };
  }

  private buildEnvironmentAssessment(
    roomDesc: string | undefined,
    ai: Record<string, string> | null,
  ): RecordingEnvironmentAssessment {
    const items = {
      roomEcho:        metric(this.getStatus(ai, 'roomEchoStatus'),    ai?.roomEchoNote    ?? (roomDesc ? 'See room description' : 'Room echo not assessed')),
      reflections:     metric(this.getStatus(ai, 'reflectionsStatus'), ai?.reflectionsNote ?? 'Reflections not assessed'),
      backgroundHum:   metric(this.getStatus(ai, 'humStatus'),         ai?.humNote         ?? 'Background hum not assessed'),
      computerFanNoise:metric(this.getStatus(ai, 'fanStatus'),         ai?.fanNote         ?? 'Computer fan noise not assessed'),
      outsideNoise:    metric(this.getStatus(ai, 'outsideStatus'),     ai?.outsideNote     ?? 'Outside noise not assessed'),
    };

    const statuses = Object.values(items).map(i => i.status);
    const overallStatus: EnvironmentStatus =
      statuses.includes('red') ? 'red' :
      statuses.includes('yellow') ? 'yellow' : 'green';

    const issues        = Object.values(items).filter(i => i.status !== 'green').map(i => i.note);
    const recommendations = Object.values(items).filter(i => i.recommendation).map(i => i.recommendation!);

    return { ...items, overallStatus, issues, recommendations };
  }

  // ── Device Profile + Calibration ─────────────────────────────────────────

  /** Returns the 6-step pre-recording calibration checklist. */
  getCalibrationSteps(): readonly string[] {
    return CALIBRATION_STEPS;
  }

  /** Look up mic and interface profiles from descriptions, return starting-point settings. */
  resolveDeviceProfiles(micDescription?: string, interfaceDescription?: string): {
    mic: MicProfile | undefined;
    interface: InterfaceProfile | undefined;
    profilePrompt: string;
  } {
    const mic = micDescription ? matchMicProfile(micDescription) : undefined;
    const iface = interfaceDescription ? matchInterfaceProfile(interfaceDescription) : undefined;
    return {
      mic,
      interface: iface,
      profilePrompt: formatProfileForPrompt(mic, iface),
    };
  }

  /**
   * Run a full AI-driven calibration session.
   * Loads the device profile as a starting point, then incorporates measured
   * values to produce session-specific recommended settings.
   * Calibrated values always override profile defaults.
   */
  async runCalibrationSession(input: {
    micDescription?: string;
    interfaceDescription?: string;
    measuredNoiseFloorDB?: number;
    measuredPeakDB?: number;
    measuredSpeechLevelDB?: number;
    hasSibilanceIssues?: boolean;
    hasPlosiveIssues?: boolean;
    hasRoomReflections?: boolean;
    roomDescription?: string;
    onChunk?: (c: string) => void;
  }): Promise<CalibrationSession> {
    const { mic, interface: iface, profilePrompt } = this.resolveDeviceProfiles(
      input.micDescription, input.interfaceDescription,
    );

    const measuredData = [
      input.measuredNoiseFloorDB !== undefined ? `Noise floor: ${input.measuredNoiseFloorDB} dBFS` : null,
      input.measuredPeakDB !== undefined ? `Peak level: ${input.measuredPeakDB} dBFS` : null,
      input.measuredSpeechLevelDB !== undefined ? `Speech level: ${input.measuredSpeechLevelDB} dBFS` : null,
      input.hasSibilanceIssues ? 'Sibilance issues detected' : null,
      input.hasPlosiveIssues ? 'Plosive issues detected' : null,
      input.hasRoomReflections ? 'Room reflections present' : null,
    ].filter(Boolean).join('\n');

    const messages: AIMessage[] = [{
      role: 'system',
      content: `You are a professional podcast audio engineer. 
${profilePrompt}

RULE: These profiles are starting points only. If measured values differ from the profile gold zones, 
the calibration pass overrides the profile. Never assume the default profile is correct.`,
    }, {
      role: 'user',
      content: `Generate session-specific recording settings based on this calibration data.

Room: ${input.roomDescription ?? 'not described'}
${measuredData ? `Measured values:\n${measuredData}` : 'No measurements yet — provide starting-point recommendations from the profile.'}

For each relevant parameter, state:
1. Profile starting point
2. Calibrated value (based on measurements, or "use profile default" if not measured)
3. Why the calibration overrides or confirms the profile

Then provide a concise session setup checklist.`,
    }];

    const result = await aiProviderService.prompt(messages, { onChunk: input.onChunk });

    return {
      micId: mic?.id,
      interfaceId: iface?.id,
      measuredNoiseFloorDB: input.measuredNoiseFloorDB,
      measuredPeakDB: input.measuredPeakDB,
      measuredSpeechLevelDB: input.measuredSpeechLevelDB,
      hasSibilanceIssues: input.hasSibilanceIssues,
      hasPlosiveIssues: input.hasPlosiveIssues,
      hasRoomReflections: input.hasRoomReflections,
      sessionSettings: { calibrationNotes: result },
      calibratedAt: new Date().toISOString(),
    };
  }

  async getRecordingTip(topic: string, onChunk?: (c: string) => void): Promise<string> {
    return aiProviderService.prompt(
      [{ role: 'user', content: `Give me one quick recording tip for a podcast episode about "${topic}". Focus on microphone technique, room acoustics, or level setting. Under 2 sentences.` }],
      { onChunk },
    );
  }
}

export const recordingCoachService = new RecordingCoachService();
