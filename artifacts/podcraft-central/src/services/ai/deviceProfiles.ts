// ─── AI Producer — Device Profiles ────────────────────────────────────────────
// Min / Gold Zone / Max starting points per microphone and interface family.
// These are NOT fixed settings. They are pre-calibration reference ranges only.
// The AI Producer MUST run a calibration pass before every session.
// Measured values always override the profile defaults.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeviceRange {
  min: string;
  gold: string;   // may be a range, e.g. "4–6 in" or "-18 to -12 dBFS"
  max: string;
  unit?: string;
}

export interface MicProfile {
  id: string;
  name: string;
  aliases: string[];               // lowercase keywords for fuzzy matching
  type: 'dynamic-xlr' | 'dynamic-usb' | 'condenser-xlr' | 'condenser-usb';
  requiresPhantomPower: boolean;
  requiresHighGain: boolean;       // dynamic mics often need 55–70 dB gain
  settings: {
    distance: DeviceRange;
    peakLevel: DeviceRange;
    inputGain?: DeviceRange;
    noiseFloor?: DeviceRange;
    hpf?: DeviceRange;
    compressionGR?: DeviceRange;
    autoLevel?: DeviceRange;
    phantomPower?: DeviceRange;
  };
  notes: string;
}

export interface InterfaceProfile {
  id: string;
  name: string;
  aliases: string[];
  type: 'audio-interface' | 'podcast-mixer' | 'portable-recorder';
  settings: {
    sampleRate?: DeviceRange;
    bitDepth?: DeviceRange;
    peakLevel: DeviceRange;
    directMonitor?: DeviceRange;
    clipGuard?: DeviceRange;
    noiseGate?: DeviceRange;
    compressor?: DeviceRange;
    recordingFormat?: DeviceRange;
  };
  notes: string;
}

export interface CalibrationSession {
  micId?: string;
  interfaceId?: string;
  measuredNoiseFloorDB?: number;
  measuredPeakDB?: number;
  measuredSpeechLevelDB?: number;
  hasSibilanceIssues?: boolean;
  hasPlosiveIssues?: boolean;
  hasRoomReflections?: boolean;
  sessionSettings?: Record<string, string>;  // overrides derived from calibration
  calibratedAt?: string;
}

// ─── Microphone Profiles ──────────────────────────────────────────────────────

export const MIC_PROFILES: MicProfile[] = [
  {
    id: 'sm7b',
    name: 'Shure SM7B',
    aliases: ['sm7b', 'sm 7b', 'sm7'],
    type: 'dynamic-xlr',
    requiresPhantomPower: false,
    requiresHighGain: true,
    settings: {
      distance:      { min: '8 in',   gold: '4–6 in',        max: '2 in'    },
      peakLevel:     { min: '-24',     gold: '-18 to -12',    max: '-6',     unit: 'dBFS' },
      inputGain:     { min: '45',      gold: '55–65',         max: '75',     unit: 'dB'   },
      noiseFloor:    { min: '-50',     gold: '-60 to -70',    max: '-45',    unit: 'dB'   },
      hpf:           { min: 'Off',     gold: '80 Hz',         max: '120 Hz'               },
      compressionGR: { min: '1',       gold: '3–6',           max: '10',     unit: 'dB'   },
    },
    notes: 'Broadcast dynamic mic. Requires significant preamp gain (55–65 dB). Proximity effect at close range adds low-end warmth — HPF recommended. No phantom power needed.',
  },
  {
    id: 'mv7',
    name: 'Shure MV7 / MV7+',
    aliases: ['mv7', 'mv 7', 'mv7+'],
    type: 'dynamic-usb',
    requiresPhantomPower: false,
    requiresHighGain: false,
    settings: {
      distance:   { min: '8 in',  gold: '4–6 in',      max: '2 in'    },
      peakLevel:  { min: '-24',   gold: '-18 to -12',  max: '-6',     unit: 'dBFS' },
      autoLevel:  { min: 'Off',   gold: 'Near Mode',   max: 'Aggressive'            },
      hpf:        { min: 'Off',   gold: '80 Hz',       max: '120 Hz'               },
    },
    notes: 'USB/XLR hybrid dynamic. Auto-level mode is a good starting point but verify peak levels in gold zone. Near Mode suited for 4–6 inch working distance.',
  },
  {
    id: 're20',
    name: 'Electro-Voice RE20',
    aliases: ['re20', 're 20', 'electro-voice', 'ev re20'],
    type: 'dynamic-xlr',
    requiresPhantomPower: false,
    requiresHighGain: true,
    settings: {
      distance:  { min: '8 in',  gold: '4–8 in',      max: '2 in'    },
      inputGain: { min: '45',    gold: '55–60',        max: '70',     unit: 'dB'   },
      peakLevel: { min: '-24',   gold: '-18 to -12',  max: '-6',     unit: 'dBFS' },
    },
    notes: 'Broadcast standard. Variable-D design reduces proximity effect vs SM7B. Works well at 4–8 in. Requires quality preamp at 55–60 dB gain.',
  },
  {
    id: 'podmic',
    name: 'Rode PodMic',
    aliases: ['podmic', 'pod mic', 'rode podmic'],
    type: 'dynamic-xlr',
    requiresPhantomPower: false,
    requiresHighGain: true,
    settings: {
      distance:  { min: '8 in',  gold: '4–6 in',      max: '2 in'    },
      inputGain: { min: '45',    gold: '55–60',        max: '70',     unit: 'dB'   },
      peakLevel: { min: '-24',   gold: '-18 to -12',  max: '-6',     unit: 'dBFS' },
    },
    notes: 'Budget broadcast dynamic. Similar gain requirements to SM7B. Built-in high-pass filter and internal shockmount. Pair with a quality interface for best results.',
  },
  {
    id: 'nt1',
    name: 'Rode NT1',
    aliases: ['nt1', 'rode nt1', 'nt-1'],
    type: 'condenser-xlr',
    requiresPhantomPower: true,
    requiresHighGain: false,
    settings: {
      distance:     { min: '12 in', gold: '6–8 in',      max: '3 in'    },
      phantomPower: { min: 'Off',   gold: '48V On',       max: 'N/A'     },
      peakLevel:    { min: '-24',   gold: '-18 to -12',  max: '-6',     unit: 'dBFS' },
    },
    notes: 'Large-diaphragm condenser. Self-noise ~4.5 dBA — excellent for quiet rooms. Requires 48V phantom power. More sensitive to room reflections than dynamic mics; treat room if possible.',
  },
  {
    id: 'at2020',
    name: 'Audio-Technica AT2020',
    aliases: ['at2020', 'at 2020', 'audio-technica', 'at2020+'],
    type: 'condenser-xlr',
    requiresPhantomPower: true,
    requiresHighGain: false,
    settings: {
      distance:     { min: '12 in', gold: '6–8 in',      max: '3 in'    },
      phantomPower: { min: 'Off',   gold: '48V On',       max: 'N/A'     },
      peakLevel:    { min: '-24',   gold: '-18 to -12',  max: '-6',     unit: 'dBFS' },
    },
    notes: 'Entry-level condenser. More room-sensitive than dynamics. Phantom power required. Pop filter strongly recommended — plosives are pronounced.',
  },
];

// ─── Audio Interface Profiles ─────────────────────────────────────────────────

export const INTERFACE_PROFILES: InterfaceProfile[] = [
  {
    id: 'scarlett',
    name: 'Focusrite Scarlett Solo / 2i2 / 4i4',
    aliases: ['scarlett', 'focusrite', 'solo', '2i2', '4i4'],
    type: 'audio-interface',
    settings: {
      sampleRate:    { min: '44.1 kHz',   gold: '48 kHz',         max: '96 kHz'   },
      bitDepth:      { min: '16-bit',     gold: '24-bit',         max: '32-bit'   },
      peakLevel:     { min: '-24',        gold: '-18 to -12',     max: '-6',      unit: 'dBFS' },
      directMonitor: { min: 'Off',        gold: 'On',             max: 'N/A'      },
    },
    notes: 'Industry-standard USB interface. Air mode on 3rd gen improves high-frequency clarity for condensers. Use Direct Monitoring to avoid latency during recording.',
  },
  {
    id: 'wave-xlr',
    name: 'Elgato Wave XLR',
    aliases: ['elgato', 'wave xlr', 'wave-xlr'],
    type: 'audio-interface',
    settings: {
      sampleRate: { min: '44.1 kHz', gold: '48 kHz',         max: '96 kHz'   },
      peakLevel:  { min: '-24',      gold: '-18 to -12',     max: '-6',      unit: 'dBFS' },
      clipGuard:  { min: 'Off',      gold: 'On',             max: 'N/A'      },
    },
    notes: 'Designed for streaming/podcasting. Clip Guard records a second channel 12 dBFS lower as a safety net. Enable it as insurance against gain spikes.',
  },
  {
    id: 'rodecaster-pro',
    name: 'RodeCaster Pro II / Duo',
    aliases: ['rodecaster', 'rode caster', 'rodecaster pro', 'rodecaster duo'],
    type: 'podcast-mixer',
    settings: {
      sampleRate:  { min: '44.1 kHz', gold: '48 kHz',         max: '96 kHz'   },
      noiseGate:   { min: 'Off',      gold: 'Light',          max: 'Aggressive' },
      compressor:  { min: 'Off',      gold: 'Moderate',       max: 'Heavy'      },
      peakLevel:   { min: '-24',      gold: '-18 to -12',     max: '-6',       unit: 'dBFS' },
    },
    notes: 'All-in-one podcast mixer. On-board EQ, compression, and noise gate are starting points — calibrate after measuring the actual voice. Avoid heavy compression in device; prefer post-processing.',
  },
  {
    id: 'zoom-podtrack',
    name: 'Zoom PodTrak P4 / P8',
    aliases: ['podtrack', 'pod track', 'p4', 'p8', 'zoom podtrack'],
    type: 'podcast-mixer',
    settings: {
      sampleRate: { min: '44.1 kHz', gold: '48 kHz',         max: '96 kHz'   },
      peakLevel:  { min: '-24',      gold: '-18 to -12',     max: '-6',      unit: 'dBFS' },
    },
    notes: 'Multi-channel podcast recorder. Records individual tracks — useful for post-production mixing. Verify each channel independently reaches the gold zone.',
  },
  {
    id: 'zoom-h-essential',
    name: 'Zoom H4essential / H6essential',
    aliases: ['h4essential', 'h6essential', 'zoom h4', 'zoom h6', 'h4 essential', 'h6 essential'],
    type: 'portable-recorder',
    settings: {
      recordingFormat: { min: 'MP3', gold: 'WAV 24-bit', max: 'WAV 32-bit Float' },
      peakLevel:       { min: '-24', gold: '-18 to -12', max: '-6',              unit: 'dBFS' },
    },
    notes: 'Portable field recorder. 32-bit float eliminates clipping — if available, use it. Otherwise use WAV 24-bit. Check peak meters during calibration — no dedicated gain control may mean adjusting mic placement.',
  },
];

// ─── Universal Recording Targets ─────────────────────────────────────────────
// Apply to every microphone and interface. Profiles refine these; they never replace them.

export const UNIVERSAL_RECORDING_TARGETS = {
  noiseFloor:            { min: '-50 dB',  gold: '-60 to -70 dB',  max: '-45 dB'  },
  peakLevel:             { min: '-24 dBFS', gold: '-18 to -12 dBFS', max: '-6 dBFS' },
  clippingEvents:        { min: '0',       gold: '0',               max: 'Any clipping = failure' },
  roomEcho:              { min: 'Mild',    gold: 'Minimal',         max: 'Obvious' },
  speechIntelligibility: { min: 'Acceptable', gold: 'Excellent',   max: 'Distorted' },
  mouthDistance:         { min: '12 in',   gold: '4–8 in',          max: '2 in'    },
} as const;

// ─── AI Producer Pre-Recording Calibration Rule ───────────────────────────────
// These 6 steps execute before every recording session.
// The calibration pass ALWAYS overrides the device profile defaults.

export const CALIBRATION_STEPS = [
  'Detect microphone — identify model or family; load appropriate profile as starting point',
  'Detect interface — identify model or family; load appropriate profile as starting point',
  'Run room analysis — measure ambient noise floor; identify HVAC, traffic, echo, and reflections',
  'Run voice calibration — have host speak naturally for 15 seconds; measure speech level and dynamics',
  'Measure: noise floor · peak levels · speech level · sibilance · plosives · room reflections',
  'Generate session-specific settings — override profile defaults with calibrated values; never assume profile is correct',
] as const;

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/** Find a mic profile by name or description (case-insensitive keyword match). */
export function matchMicProfile(description: string): MicProfile | undefined {
  const lower = description.toLowerCase();
  return MIC_PROFILES.find(p => p.aliases.some(a => lower.includes(a)));
}

/** Find an interface profile by name or description (case-insensitive keyword match). */
export function matchInterfaceProfile(description: string): InterfaceProfile | undefined {
  const lower = description.toLowerCase();
  return INTERFACE_PROFILES.find(p => p.aliases.some(a => lower.includes(a)));
}

/** Format a mic or interface profile as a table string for AI prompts. */
export function formatProfileForPrompt(
  micProfile: MicProfile | undefined,
  interfaceProfile: InterfaceProfile | undefined,
): string {
  const lines: string[] = ['DEVICE PROFILE — Starting point only. Calibration pass will override these.'];

  if (micProfile) {
    lines.push(`\nMICROPHONE: ${micProfile.name}`);
    lines.push(`Type: ${micProfile.type}${micProfile.requiresPhantomPower ? ' | Phantom Power: 48V required' : ''}${micProfile.requiresHighGain ? ' | High-gain preamp required' : ''}`);
    lines.push('| Setting        | Minimum     | ← Gold Zone →        | Maximum     |');
    lines.push('|----------------|-------------|----------------------|-------------|');
    for (const [key, r] of Object.entries(micProfile.settings)) {
      if (!r) continue;
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).padEnd(14);
      const unit = r.unit ? ` ${r.unit}` : '';
      lines.push(`| ${label} | ${String(r.min).padEnd(11)} | ${(r.gold + unit).padEnd(20)} | ${String(r.max).padEnd(11)} |`);
    }
    lines.push(`Note: ${micProfile.notes}`);
  } else {
    lines.push('\nMICROPHONE: Not identified — using universal targets');
  }

  if (interfaceProfile) {
    lines.push(`\nINTERFACE: ${interfaceProfile.name}`);
    lines.push('| Setting        | Minimum     | ← Gold Zone →        | Maximum     |');
    lines.push('|----------------|-------------|----------------------|-------------|');
    for (const [key, r] of Object.entries(interfaceProfile.settings)) {
      if (!r) continue;
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).padEnd(14);
      const unit = r.unit ? ` ${r.unit}` : '';
      lines.push(`| ${label} | ${String(r.min).padEnd(11)} | ${(r.gold + unit).padEnd(20)} | ${String(r.max).padEnd(11)} |`);
    }
    lines.push(`Note: ${interfaceProfile.notes}`);
  } else {
    lines.push('\nINTERFACE: Not identified — using universal targets');
  }

  lines.push('\nUNIVERSAL TARGETS (apply regardless of device)');
  lines.push('| Metric                | Minimum      | ← Gold Zone →        | Maximum         |');
  lines.push('|-----------------------|--------------|----------------------|-----------------|');
  for (const [key, r] of Object.entries(UNIVERSAL_RECORDING_TARGETS)) {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).padEnd(21);
    lines.push(`| ${label} | ${String(r.min).padEnd(12)} | ${r.gold.padEnd(20)} | ${String(r.max).padEnd(15)} |`);
  }

  lines.push('\nCALIBRATION STEPS (execute before every session):');
  CALIBRATION_STEPS.forEach((step, i) => lines.push(`${i + 1}. ${step}`));

  return lines.join('\n');
}
