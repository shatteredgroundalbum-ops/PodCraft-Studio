// ─── AI Producer — Podcast Genre Profile System ───────────────────────────────
// Genre profiles shape the entire production pipeline from script to mastering.
// Every recommendation the AI makes is adjusted based on the active genre profile.
// These are professional starting points — the AI adapts them to each episode.

// ─── Types ────────────────────────────────────────────────────────────────────

export type GenreProfileId =
  | 'true-crime'
  | 'interview'
  | 'educational'
  | 'news'
  | 'narrative'
  | 'solo-host'
  | 'custom';

export interface GenreProcessingSettings {
  compression: string;      // e.g. "3:1 to 4:1"
  gainReduction: string;    // e.g. "4–6 dB"
  highPass: string;         // e.g. "70–80 Hz"
  presenceBoost: string;    // e.g. "+2 dB"
  music: string;            // Music role / level
  loudness: string;         // e.g. "-16 LUFS"
  silenceUsage?: string;
  reverb?: string;
  soundEffects?: string;
}

export interface GenreProfile {
  id: GenreProfileId;
  name: string;
  emoji: string;
  tagline: string;
  goal: string[];
  processing: GenreProcessingSettings;
  aiPriorities: string[];
  // Pipeline stage focus — what the AI emphasises at each stage
  scriptFocus: string[];
  recordingFocus: string[];
  editingFocus: string[];
  mixingFocus: string[];
  masteringFocus: string[];
  packagingFocus: string[];
}

// ─── Genre Profiles ───────────────────────────────────────────────────────────

export const GENRE_PROFILES: GenreProfile[] = [
  {
    id: 'true-crime',
    name: 'True Crime',
    emoji: '🔍',
    tagline: 'Intimate · Dark · Cinematic · Story-driven',
    goal: ['Intimate', 'Dark', 'Cinematic', 'Story-driven'],
    processing: {
      compression:  '3:1 to 4:1',
      gainReduction: '4–6 dB',
      highPass:     '70–80 Hz',
      presenceBoost: '+2 dB',
      music:        '-24 to -20 dB below voice',
      loudness:     '-16 LUFS',
      silenceUsage: 'Frequent — silence is a storytelling tool',
      reverb:       'Very subtle — adds depth without washing the voice',
    },
    aiPriorities: [
      'Dramatic pacing',
      'Tension building',
      'Music cue placement',
      'Story structure',
      'Chapter markers',
    ],
    scriptFocus: [
      'Cold open: drop the listener into the story mid-scene',
      'Story arc: setup → rising tension → revelation → aftermath',
      'End each segment on a hook or unanswered question',
      'Chapter-style markers at each story beat',
      'All factual claims sourced and verifiable — credibility is paramount',
      'Silence cues written into the script at dramatic moments',
    ],
    recordingFocus: [
      'Close-mic delivery for intimacy (4–6 in gold zone)',
      'Varied pace: slow and measured for tension, faster for urgency',
      'Pause intentionally — silence is content in this genre',
      'Avoid over-compression at source; preserve vocal dynamics for drama',
    ],
    editingFocus: [
      'Preserve dramatic pauses — do not over-clean silence',
      'Music bed entry/exit cues placed at story beats',
      'Remove distractions but keep natural room feel',
      'Pacing audit per chapter: does tension build correctly?',
    ],
    mixingFocus: [
      'Voice is intimate — sits slightly forward in the mix',
      'Music beds sit -24 to -20 dB below voice level',
      'Subtle reverb optional (+1–2 dB room on voice for atmosphere)',
      'HPF at 70–80 Hz — preserve low-end weight for cinematic feel',
      'Compression 3:1–4:1 — firm but not squashed; preserve dynamics',
    ],
    masteringFocus: [
      'Target -16 LUFS integrated — cinematic master, not a radio master',
      'Preserve dynamic range for storytelling tension',
      'Do not over-limit; peaks should breathe',
      'True peak ceiling -1 dBTP',
    ],
    packagingFocus: [
      'Title format: "[Episode X]: [Dramatic Hook] — The [Name] Case"',
      'Show notes: chronological story summary without spoilers',
      'Chapter markers at every story beat',
      'Trigger warnings if content is graphic',
      'Social copy: mystery hook, not plot summary',
    ],
  },

  {
    id: 'interview',
    name: 'Interview',
    emoji: '🎙️',
    tagline: 'Natural conversation · Comfortable · Consistent speaker balance',
    goal: ['Natural conversation', 'Comfortable listening', 'Consistent speaker balance'],
    processing: {
      compression:  '2.5:1 to 3:1',
      gainReduction: '3–5 dB',
      highPass:     '80 Hz',
      presenceBoost: '+2 dB',
      music:        'Intro/Outro only',
      loudness:     '-16 LUFS',
    },
    aiPriorities: [
      'Speaker leveling',
      'Crosstalk detection',
      'Question flow',
      'Guest introduction',
      'Topic transitions',
    ],
    scriptFocus: [
      'Guest introduction block with bio and credibility hook',
      'Anchor questions: 5–7 core questions that drive the conversation',
      'Follow-up prompts prepared for each anchor question',
      'Transition phrases between topic areas',
      'Outro: guest sign-off, where to find them, CTA to audience',
      'Balance host talk time vs. guest talk time in outline',
    ],
    recordingFocus: [
      'Verify both host and guest levels reach gold zone independently',
      'Remote guest: check platform latency and bit rate before recording',
      'Monitor for crosstalk — brief interruption patterns to coach guests on',
      'Consistent distance for both speakers throughout the session',
    ],
    editingFocus: [
      'Speaker-by-speaker level normalisation before mixing',
      'Remove crosstalk moments where both speakers talk over each other',
      'Clean up long guest pauses or repeated false starts',
      'Verify question-answer pacing feels conversational, not interrogative',
    ],
    mixingFocus: [
      'Host and guest at matched perceived loudness levels',
      'HPF at 80 Hz for both speakers',
      'Music only in intro/outro — never under conversation',
      'Compression 2.5:1–3:1 — natural, not processed',
      'Check stereo balance: host left/centre, guest right/centre',
    ],
    masteringFocus: [
      'Target -16 LUFS integrated',
      'Consistent perceived loudness between speaker turns',
      'True peak ceiling -1 dBTP',
      'Natural master — listener should feel like they are in the room',
    ],
    packagingFocus: [
      'Title format: "[Guest Name]: [Compelling Angle or Topic]"',
      'Show notes: guest bio, key timestamps, resources mentioned',
      'Chapter markers at topic transitions',
      'Social copy: guest pull quote from the episode',
      'Guest share kit: image + caption for guest to share on their channels',
    ],
  },

  {
    id: 'educational',
    name: 'Educational',
    emoji: '📚',
    tagline: 'Maximum intelligibility · Clear teaching · Minimal distractions',
    goal: ['Maximum intelligibility', 'Clear teaching', 'Minimal distractions'],
    processing: {
      compression:  '2:1 to 3:1',
      gainReduction: '2–4 dB',
      highPass:     '80 Hz',
      presenceBoost: '+3 dB',
      music:        'Minimal — short bumpers between lessons only',
      loudness:     '-16 LUFS',
    },
    aiPriorities: [
      'Clarity scoring',
      'Fact verification',
      'Source tracking',
      'Lesson structure',
      'Recap generation',
    ],
    scriptFocus: [
      'Learning objective stated in the intro: "By the end of this episode, you will know…"',
      'Lesson structure: concept → explanation → example → application',
      'Every factual claim cited with source name and confidence level',
      'Recap section summarising all key points before outro',
      'Assign a listener action or exercise at the end',
      'Avoid jargon without immediate plain-language definitions',
    ],
    recordingFocus: [
      'Prioritise speech clarity over warmth — distance can be slightly further',
      'Slow, measured delivery — listener is learning, not just listening',
      'Avoid filler words that undermine authority',
      'Consistent energy — educational content requires sustained engagement',
    ],
    editingFocus: [
      'Tighten pacing — remove long pauses that interrupt learning flow',
      'Remove filler words that reduce credibility',
      'Verify all cited facts are accurately stated before publishing',
      'Insert chapter markers at each lesson/concept boundary',
    ],
    mixingFocus: [
      'Voice clarity is the only priority — no competing elements',
      'HPF at 80 Hz — clean low end',
      'Presence boost +3 dB — maximum speech intelligibility',
      'Compression 2:1–3:1 — smooth, consistent level for extended listening',
      'Music bumpers must not overlap with content',
    ],
    masteringFocus: [
      'Target -16 LUFS integrated',
      'Smooth, consistent loudness — listeners may wear headphones for long sessions',
      'Maximise speech intelligibility over character or warmth',
      'True peak ceiling -1 dBTP',
    ],
    packagingFocus: [
      'Title format: "How to [Skill/Outcome] — [Episode Topic]"',
      'Show notes: full outline, all sources cited with links, timestamps',
      'Chapter markers at each lesson section',
      'Downloadable resource or worksheet linked if applicable',
      'Social copy: key takeaway stat or actionable tip',
    ],
  },

  {
    id: 'news',
    name: 'News',
    emoji: '📰',
    tagline: 'Broadcast delivery · Fast information transfer · Consistency',
    goal: ['Broadcast-style delivery', 'Fast information transfer', 'Consistency'],
    processing: {
      compression:  '3:1 to 4:1',
      gainReduction: '4–6 dB',
      highPass:     '80 Hz',
      presenceBoost: '+3 to +4 dB',
      music:        'Short transitions between segments only',
      loudness:     '-16 LUFS',
    },
    aiPriorities: [
      'Source verification',
      'Fact checking',
      'Segment timing',
      'Headline structure',
      'Breaking news workflow',
    ],
    scriptFocus: [
      'Cold open: headline summary — top 3 stories in 30 seconds',
      'Inverted pyramid per story: most important facts first',
      'Every claim attributed to a named source',
      'Story segments: 2–5 min each, hard time limits',
      'Transitions between stories: brief, clear, forward-moving',
      'Sign-off: next edition teaser, correction policy statement',
    ],
    recordingFocus: [
      'Broadcast-style delivery: consistent pace, authoritative tone',
      'No filler words — news requires precision delivery',
      'Read speed: slightly faster than conversational (160–180 wpm)',
      'Level consistency critical — news is often consumed in noisy environments',
    ],
    editingFocus: [
      'Strict segment timing — each story to within 15 seconds of target',
      'Remove any correction or re-reading that was not intended for broadcast',
      'Tighten transitions — no dead air between stories',
      'Verify all facts and attributions before publishing — corrections damage credibility',
    ],
    mixingFocus: [
      'Voice forward and present at all times',
      'Music transitions: -20 dB, 3–5 seconds maximum',
      'HPF at 80 Hz — clean broadcast sound',
      'Presence boost +3–4 dB — authority and clarity',
      'Compression 3:1–4:1 — consistent broadcast level',
    ],
    masteringFocus: [
      'Target -16 LUFS integrated',
      'Broadcast consistency — same perceived loudness every episode',
      'Hard limit at -1 dBTP',
      'Fast release on limiter to maintain spoken word clarity',
    ],
    packagingFocus: [
      'Title format: "[Date] — [Top Headline] + [N] More Stories"',
      'Show notes: headlines with timestamps, all sources linked',
      'Chapter markers: one per story',
      'Corrections policy linked in show notes',
      'Social copy: top headline as hook, not summary',
    ],
  },

  {
    id: 'narrative',
    name: 'Narrative',
    emoji: '🎭',
    tagline: 'Audio storytelling · Atmosphere · Immersion',
    goal: ['Audio storytelling', 'Atmosphere', 'Immersion'],
    processing: {
      compression:  '2.5:1 to 4:1',
      gainReduction: '3–5 dB',
      highPass:     '70–80 Hz',
      presenceBoost: '+2 dB',
      music:        'Frequent — music is a primary story element',
      loudness:     '-16 LUFS',
      reverb:       'Scene-appropriate — use to establish location',
      soundEffects: 'Frequent — drives atmosphere and scene changes',
    },
    aiPriorities: [
      'Scene transitions',
      'Music placement',
      'Sound effect placement',
      'Character cues',
      'Story pacing',
    ],
    scriptFocus: [
      'Scene-by-scene structure: each scene has opening, action, closing beat',
      'Character voice distinction: different cadence, vocabulary for each character',
      'Music and sound effect cues written inline: [MUSIC: soft tension bed] [SFX: door opens]',
      'Scene transitions scripted — not improvised',
      'Narrator as guide — break fourth wall strategically, not randomly',
      'Chapter markers at scene changes',
    ],
    recordingFocus: [
      'Multiple recording passes may be needed — performance quality is primary',
      'Character voices require warm-up and direction notes',
      'Close-mic delivery: 4–6 in for intimacy; adjust per scene tone',
      'Record room tone / ambient at every location for scene backgrounds',
    ],
    editingFocus: [
      'Music and SFX placement is an editorial decision — plan before editing',
      'Scene boundaries: clean in/out with music or SFX bridging',
      'Pacing review: does each scene sustain the listener?',
      'Character level consistency — same perceived distance and intimacy throughout',
    ],
    mixingFocus: [
      'Voice and music must coexist — neither overwhelming the other',
      'Music beds: dynamic level, not static (-20 to -30 dB under voice, louder in transitions)',
      'SFX: placed in stereo field to suggest scene space',
      'HPF at 70–80 Hz — some low-end weight for cinematic depth',
      'Compression 2.5:1–4:1 — adapt per scene: less for quiet intimate scenes',
    ],
    masteringFocus: [
      'Target -16 LUFS integrated',
      'Preserve the full dynamic range — narrative audio has wide dynamics intentionally',
      'Do not over-limit — quiet scenes are meant to be quiet',
      'True peak ceiling -1 dBTP',
    ],
    packagingFocus: [
      'Title format: Season/Episode numbering + story chapter title',
      'Show notes: character list, setting context, content warnings',
      'Chapter markers at every scene change',
      'Season arc description in podcast description',
      'Social copy: cinematic teaser quote, not plot summary',
    ],
  },

  {
    id: 'solo-host',
    name: 'Solo Host',
    emoji: '🎤',
    tagline: 'Personal connection · Consistent voice · Long-form comfort',
    goal: ['Personal connection', 'Consistent voice', 'Long-term listening comfort'],
    processing: {
      compression:  '2.5:1 to 3.5:1',
      gainReduction: '3–5 dB',
      highPass:     '80 Hz',
      presenceBoost: '+2 to +3 dB',
      music:        'Intro/Outro only',
      loudness:     '-16 LUFS',
    },
    aiPriorities: [
      'Filler word detection',
      'Energy monitoring',
      'Pacing analysis',
      'Segment timing',
      'Listener retention analysis',
    ],
    scriptFocus: [
      'Personal story or anecdote in the cold open — not a fact or quote',
      'Conversational language throughout — write like you speak',
      'Energy arc: build across segments, avoid flat middle sections',
      'Segment transitions: spoken, natural, never robotic',
      'Call to action integrated naturally — not tacked on at the end',
      'Run time discipline: solo hosts often over-run; script tighter',
    ],
    recordingFocus: [
      'Consistent microphone distance every session — builds brand voice',
      'Monitor for energy dips: solo recording fatigue is real',
      'Warm up voice before recording — 5 min speaking at full volume',
      'Filler word awareness: track "um", "uh", "like", "you know" per minute',
    ],
    editingFocus: [
      'Filler word pass: remove excessive ums/uhs without cutting sentence rhythm',
      'Energy monitoring: flag sections where delivery drops below baseline',
      'Pacing analysis: mark over-long tangents for tightening',
      'Segment timing review: does each section earn its run time?',
    ],
    mixingFocus: [
      'Voice is the only element — it must carry the entire episode alone',
      'Compression 2.5:1–3.5:1 — smooth, consistent, listener-friendly for long sessions',
      'Presence boost +2–3 dB — intimacy and warmth',
      'HPF at 80 Hz — clean and focused',
      'Music only in intro/outro at -20 dB under voice',
    ],
    masteringFocus: [
      'Target -16 LUFS integrated',
      'Long-form listening comfort — avoid listening fatigue',
      'Smooth limiter: fast attack, medium release — natural voice dynamics preserved',
      'True peak ceiling -1 dBTP',
    ],
    packagingFocus: [
      'Title format: "[Personal Hook or Opinion] — [Episode Topic]"',
      'Show notes: personal framing, timestamps, any resources mentioned',
      'Chapter markers at segment transitions',
      'Social copy: host perspective or opinion, not topic summary',
      'Consistent cover art — solo show brand is the host\'s face and voice',
    ],
  },

  {
    id: 'custom',
    name: 'Custom',
    emoji: '⚙️',
    tagline: 'Your own production rules',
    goal: ['User-defined goals'],
    processing: {
      compression:   'User-defined',
      gainReduction: 'User-defined',
      highPass:      'User-defined',
      presenceBoost: 'User-defined',
      music:         'User-defined',
      loudness:      '-16 LUFS',
    },
    aiPriorities: [
      'Follow user-specified production rules',
      'Use gold-zone defaults when no custom rule applies',
    ],
    scriptFocus:     ['Follow user production brief'],
    recordingFocus:  ['Follow user production brief'],
    editingFocus:    ['Follow user production brief'],
    mixingFocus:     ['Use gold-zone defaults; adapt to actual voice and room'],
    masteringFocus:  ['Target -16 LUFS; adapt all other settings to the recording'],
    packagingFocus:  ['Follow user production brief'],
  },
];

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function getGenreProfile(id: GenreProfileId): GenreProfile {
  return GENRE_PROFILES.find(g => g.id === id) ?? GENRE_PROFILES.find(g => g.id === 'solo-host')!;
}

// ─── Prompt Formatters ────────────────────────────────────────────────────────

/** Full genre context block for AI prompts (all stages). */
export function formatGenreForPrompt(genre: GenreProfile, stage?: 'script' | 'recording' | 'editing' | 'mixing' | 'mastering' | 'packaging'): string {
  const stageFocus = stage ? {
    script:     genre.scriptFocus,
    recording:  genre.recordingFocus,
    editing:    genre.editingFocus,
    mixing:     genre.mixingFocus,
    mastering:  genre.masteringFocus,
    packaging:  genre.packagingFocus,
  }[stage] : genre.aiPriorities;

  const lines = [
    `GENRE PROFILE: ${genre.emoji} ${genre.name} — ${genre.tagline}`,
    `Goal: ${genre.goal.join(' · ')}`,
    ``,
    `PROCESSING TARGETS (${genre.name} gold zones):`,
    `  Compression:     ${genre.processing.compression}`,
    `  Gain Reduction:  ${genre.processing.gainReduction}`,
    `  High Pass:       ${genre.processing.highPass}`,
    `  Presence Boost:  ${genre.processing.presenceBoost}`,
    `  Music Level:     ${genre.processing.music}`,
    `  Loudness Target: ${genre.processing.loudness}`,
  ];
  if (genre.processing.silenceUsage) lines.push(`  Silence Usage:   ${genre.processing.silenceUsage}`);
  if (genre.processing.reverb)       lines.push(`  Reverb:          ${genre.processing.reverb}`);
  if (genre.processing.soundEffects) lines.push(`  Sound Effects:   ${genre.processing.soundEffects}`);

  lines.push(``, `${stage ? stage.toUpperCase() + ' ' : ''}PRIORITIES FOR THIS GENRE:`);
  stageFocus.forEach(p => lines.push(`  • ${p}`));

  return lines.join('\n');
}

/** Compact one-line genre label for inline prompt context. */
export function genreLabel(genre: GenreProfile): string {
  return `${genre.emoji} ${genre.name} (${genre.tagline})`;
}

/** Parse loudness number from a genre loudness string like "-16 LUFS". */
export function parseGenreLoudness(genre: GenreProfile): number {
  const match = genre.processing.loudness.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : -16;
}
