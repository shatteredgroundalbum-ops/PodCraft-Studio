import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, Check, Loader2, Sparkles, ClipboardList,
  FolderOpen, Mic, Calendar, FileText, Music, Zap, Info, AlertTriangle,
  UploadCloud, X, BookOpen,
} from 'lucide-react';
import { useAuth } from '../../store/AuthStore';
import { useAIModel } from '../../store/AIModelStore';
import { createProject } from '../../services/projectService';
import { createTask } from '../../services/taskService';
import { createEvent } from '../../services/calendarService';
import { createEpisode } from '../../services/episodeService';

/* ── Constants ────────────────────────────────────────────────── */
const LAST_PROFILE_KEY = 'podcraft_last_room_profile_v2';

const PROJECT_TYPES = ['Podcast', 'Voiceover', 'Audiobook', 'Interview', 'Music / Audio Project', 'Custom'];
const EPISODE_TYPES = ['Single episode', 'Series', 'Mini-series', 'Trailer', 'Bonus episode'];
const LENGTH_OPTIONS = ['5 min', '15 min', '30 min', '45 min', '60 min', '90 min', '2 hours', 'Custom'];
const PLATFORMS = ['Spotify', 'Apple Podcasts', 'YouTube', 'DistroKid', 'RSS feed', 'Website', 'Other'];
const TONES = ['Conversational', 'Educational', 'Storytelling / Narrative', 'Interview / Q&A', 'Scripted / Scripted Drama', 'Comedy', 'Documentary'];

const VIRTUAL_FOLDERS = [
  'Audio/', 'Audio/Raw Recordings/', 'Audio/Mixdowns/', 'Audio/Masters/',
  'Music/', 'SFX/', 'Bumpers/', 'Scripts/', 'Notes/', 'Exports/',
];

const STANDARD_TASKS = [
  { name: 'Prepare or review script',          type: 'Pre-Production', priority: 'High' },
  { name: 'Import or assign music beds',        type: 'Pre-Production', priority: 'Medium' },
  { name: 'Import or assign sound effects',     type: 'Pre-Production', priority: 'Medium' },
  { name: 'Record episode',                     type: 'Production',     priority: 'High' },
  { name: 'Edit episode',                       type: 'Post-Production',priority: 'High' },
  { name: 'Mix episode',                        type: 'Post-Production',priority: 'High' },
  { name: 'Master episode',                     type: 'Post-Production',priority: 'Medium' },
  { name: 'Export final audio file',            type: 'Post-Production',priority: 'Medium' },
  { name: 'Review final file',                  type: 'QA',             priority: 'High' },
  { name: 'Upload and distribute episode',      type: 'Distribution',   priority: 'High' },
  { name: 'Publish on all platforms',           type: 'Distribution',   priority: 'High' },
  { name: 'Confirm release on all platforms',   type: 'Distribution',   priority: 'Medium' },
];

const AI_EXTRA_TASKS = [
  { name: 'Generate or refine AI script',       type: 'Pre-Production', priority: 'High' },
  { name: 'Research topic and gather sources',  type: 'Pre-Production', priority: 'High' },
  { name: 'Review and cite all references',     type: 'Pre-Production', priority: 'Medium' },
  { name: 'Create show notes and episode art',  type: 'Post-Production',priority: 'Medium' },
];

/* ── Recording capability detection ──────────────────────────── */
interface RecordingCaps {
  sampleRates: number[];
  defaultSampleRate: number;
  bitDepths: string[];
  defaultBitDepth: string;
  containers: string[];
  defaultContainer: string;
  channels: string[];
}

async function detectCapabilities(): Promise<RecordingCaps> {
  const ratesToTest = [48000, 44100, 96000, 88200, 22050];
  const found = new Set<number>();
  for (const rate of ratesToTest) {
    try {
      const ctx = new AudioContext({ sampleRate: rate });
      found.add(ctx.sampleRate);
      await ctx.close();
    } catch { /* skip unsupported */ }
  }
  if (found.size === 0) found.add(44100);

  const containerMap: [string, string][] = [
    ['audio/webm;codecs=opus', 'WebM / Opus'],
    ['audio/webm', 'WebM'],
    ['audio/ogg;codecs=opus', 'OGG / Opus'],
    ['audio/ogg', 'OGG'],
    ['audio/mp4', 'MP4'],
  ];
  const containers: string[] = [];
  for (const [mime, label] of containerMap) {
    try { if (MediaRecorder.isTypeSupported(mime)) containers.push(label); } catch { /* ignore */ }
  }
  if (containers.length === 0) containers.push('WebM / Opus');

  return {
    sampleRates: [...found].sort((a, b) => b - a),
    defaultSampleRate: found.has(48000) ? 48000 : [...found][0],
    bitDepths: ['32-bit float (AudioWorklet)', '24-bit', '16-bit'],
    defaultBitDepth: '32-bit float (AudioWorklet)',
    containers,
    defaultContainer: containers[0],
    channels: ['Stereo', 'Mono'],
  };
}

/* ── Stored audio profile ─────────────────────────────────────── */
function loadAudioProfile(): { audioInterface: string; microphone: string; roomType: string } {
  try {
    const stored = localStorage.getItem(LAST_PROFILE_KEY);
    if (stored) {
      const p = JSON.parse(stored);
      return { audioInterface: p.audioInterface ?? '', microphone: p.microphone ?? '', roomType: p.roomType ?? '' };
    }
  } catch { /* ignore */ }
  return { audioInterface: '', microphone: '', roomType: '' };
}

/* ── Workspace creation ───────────────────────────────────────── */
interface WizardData {
  projectName: string;
  projectType: string;
  showName: string;
  episodeTitle: string;
  episodeType: string;
  estimatedLength: string;
  recordingDate: string;
  releaseDate: string;
  platforms: string[];
  hasScript: boolean;
  scriptText: string;
  sampleRate: number;
  bitDepth: string;
  container: string;
  channel: string;
  isAIProducer: boolean;
  aiNotes: string;
  topic: string;
  targetAudience: string;
  tone: string;
  needsMusic: boolean;
  needsSFX: boolean;
  needsVoiceover: boolean;
  needsResearch: boolean;
}

function buildRecordingNotes(data: WizardData, audioProfile: ReturnType<typeof loadAudioProfile>): string {
  const folders = VIRTUAL_FOLDERS.map(f => `  ${f}`).join('\n');
  const checklist = STANDARD_TASKS.map(t => `[ ] ${t.name}`).join('\n');
  const aiExtras = data.isAIProducer ? AI_EXTRA_TASKS.map(t => `[ ] ${t.name}`).join('\n') : '';

  return [
    `== Project: ${data.projectName} ==`,
    data.showName  ? `Show: ${data.showName}` : '',
    data.episodeTitle ? `Episode: ${data.episodeTitle} (${data.episodeType})` : '',
    `Type: ${data.projectType}`,
    data.platforms.length ? `Platforms: ${data.platforms.join(', ')}` : '',
    data.recordingDate ? `Recording Date: ${data.recordingDate}` : '',
    data.releaseDate  ? `Release Date: ${data.releaseDate}`  : '',
    '',
    '== Audio Setup ==',
    audioProfile.audioInterface ? `Interface: ${audioProfile.audioInterface}` : '',
    audioProfile.microphone     ? `Microphone: ${audioProfile.microphone}`     : '',
    audioProfile.roomType       ? `Room: ${audioProfile.roomType}`              : '',
    `Recording Format: ${data.sampleRate} Hz · ${data.bitDepth} · ${data.channel}`,
    `Container: ${data.container}`,
    '',
    '== Virtual Folder Structure ==',
    folders,
    '',
    '== Production Checklist ==',
    checklist,
    aiExtras ? '\n== AI Producer Additional Tasks ==\n' + aiExtras : '',
    '',
    '== Licensing Reminder ==',
    'Confirm you have the rights to use all music, SFX, generated voices, and third-party assets before release.',
    data.platforms.length
      ? `\n== Platform Notes ==\nScheduled release via: ${data.platforms.join(', ')}`
      : '',
    data.aiNotes ? `\n== AI Producer Notes ==\n${data.aiNotes}` : '',
  ].filter(Boolean).join('\n');
}

async function createWorkspace(userId: number, data: WizardData): Promise<string> {
  const audioProfile = loadAudioProfile();
  const notes = buildRecordingNotes(data, audioProfile);

  const project = await createProject(userId, {
    name: data.projectName,
    description: [
      data.showName ? `Show: ${data.showName}` : '',
      data.episodeTitle ? `Episode: ${data.episodeTitle}` : '',
      data.projectType,
      data.topic || '',
      data.targetAudience ? `Audience: ${data.targetAudience}` : '',
    ].filter(Boolean).join(' · '),
    status: 'Planning',
    season: 'Season 1',
    duration: data.estimatedLength,
    lastSaved: new Date().toISOString(),
    microphone: audioProfile.microphone,
    audioInterface: audioProfile.audioInterface,
    sampleRate: `${data.sampleRate} Hz`,
    bitDepth: data.bitDepth,
    recordingNotes: notes,
  });

  /* Script storage */
  if (data.hasScript && data.scriptText) {
    try {
      localStorage.setItem(`podcraft_script_${project.id}`, data.scriptText);
    } catch { /* storage error ignored */ }
  }

  /* Episode */
  if (data.episodeTitle) {
    await createEpisode(userId, {
      projectId: project.id,
      title: data.episodeTitle,
      status: 'Planned',
      duration: data.estimatedLength,
      publishDate: data.releaseDate || '',
    });
  }

  /* Tasks */
  const taskList = [...STANDARD_TASKS, ...(data.isAIProducer ? AI_EXTRA_TASKS : [])];
  for (let i = 0; i < taskList.length; i++) {
    const t = taskList[i];
    await createTask(userId, {
      name: t.name,
      description: '',
      projectId: project.id,
      assignedTo: '',
      dueDate: data.releaseDate || '',
      startDate: data.recordingDate || '',
      status: 'To Do',
      priority: t.priority,
      type: t.type,
      tags: [t.type],
      estimatedTime: '',
    });
  }

  /* Calendar events */
  if (data.recordingDate) {
    await createEvent(userId, {
      title: `Record: ${data.projectName}`,
      type: 'custom',
      date: data.recordingDate,
      relatedId: project.id,
      notes: `Recording session — ${audioProfile.roomType || 'Studio'}`,
    });
  }
  if (data.releaseDate) {
    await createEvent(userId, {
      title: `Release: ${data.episodeTitle || data.projectName}`,
      type: 'episode',
      date: data.releaseDate,
      relatedId: project.id,
      notes: data.platforms.length ? `Releasing on: ${data.platforms.join(', ')}` : '',
    });
  }

  return project.id;
}

/* ══════════════════════════════════════════════════════════════════
   Top-level wizard
══════════════════════════════════════════════════════════════════ */
export function ProjectSetupWizard({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [mode, setMode] = useState<'choice' | 'manual' | 'ai'>('choice');

  return (
    <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[580px] max-h-[92vh] flex flex-col overflow-hidden">
        {mode === 'choice' && (
          <ModeChoice
            onManual={() => setMode('manual')}
            onAI={() => setMode('ai')}
            onSkip={onSkip}
          />
        )}
        {mode === 'manual' && (
          <ManualWizard onDone={onDone} onBack={() => setMode('choice')} isAI={false} />
        )}
        {mode === 'ai' && (
          <ManualWizard onDone={onDone} onBack={() => setMode('choice')} isAI={true} />
        )}
      </div>
    </div>
  );
}

/* ── Mode Choice screen ───────────────────────────────────────── */
function ModeChoice({ onManual, onAI, onSkip }: { onManual: () => void; onAI: () => void; onSkip: () => void }) {
  return (
    <>
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5 shrink-0">
        <h2 className="text-lg font-bold text-white">Project Setup</h2>
        <p className="text-violet-200 text-sm mt-0.5">Set up your recording project workspace.</p>
      </div>
      <div className="p-6 space-y-3 flex-1 overflow-y-auto">
        <button onClick={onManual}
          className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-violet-400 hover:bg-violet-50/40 text-left transition-all group">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
            <ClipboardList className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">Manual Setup</div>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Fill in project details, recording format, and schedule. Creates the full workspace structure.</p>
          </div>
        </button>

        <button onClick={onAI}
          className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-violet-400 hover:bg-violet-50/40 text-left transition-all group">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">AI Producer Pipeline</div>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Let AI guide production planning, generate a script outline, and build your full production pipeline.</p>
          </div>
        </button>
      </div>
      <div className="px-6 pb-5 shrink-0">
        <button onClick={onSkip} className="w-full text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
          Skip for now — set up project later from Projects
        </button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Manual / AI Producer wizard (shared 4-step flow)
══════════════════════════════════════════════════════════════════ */
type ManualStep = 'info' | 'format' | 'preview' | 'creating' | 'done';

function ManualWizard({ onDone, onBack, isAI }: { onDone: () => void; onBack: () => void; isAI: boolean }) {
  const { user } = useAuth();
  const { sendMessage, isModuleActive } = useAIModel();
  const userId = user?.userId ?? 0;

  /* Form state — core */
  const [projectName,    setProjectName]    = useState('');
  const [projectType,    setProjectType]    = useState('Podcast');
  const [showName,       setShowName]       = useState('');
  const [episodeTitle,   setEpisodeTitle]   = useState('');
  const [episodeType,    setEpisodeType]    = useState('Single episode');
  const [estimatedLength,setEstimatedLength]= useState('30 min');
  const [recordingDate,  setRecordingDate]  = useState(new Date().toISOString().slice(0, 10));
  const [releaseDate,    setReleaseDate]    = useState('');
  const [platforms,      setPlatforms]      = useState<string[]>(['Spotify', 'Apple Podcasts']);
  const [hasScript,      setHasScript]      = useState(false);
  const [scriptText,     setScriptText]     = useState('');
  const [scriptFileName, setScriptFileName] = useState('');

  /* AI Producer extras */
  const [topic,          setTopic]          = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone,           setTone]           = useState('Conversational');
  const [needsMusic,     setNeedsMusic]     = useState(true);
  const [needsSFX,       setNeedsSFX]       = useState(true);
  const [needsVoiceover, setNeedsVoiceover] = useState(false);
  const [needsResearch,  setNeedsResearch]  = useState(false);
  const [aiGenerating,   setAiGenerating]   = useState(false);
  const [aiNotes,        setAiNotes]        = useState('');
  const [aiError,        setAiError]        = useState('');

  /* Recording format */
  const [caps,           setCaps]           = useState<RecordingCaps | null>(null);
  const [sampleRate,     setSampleRate]     = useState(48000);
  const [bitDepth,       setBitDepth]       = useState('32-bit float (AudioWorklet)');
  const [container,      setContainer]      = useState('');
  const [channel,        setChannel]        = useState('Stereo');

  /* Flow state */
  const [step,           setStep]           = useState<ManualStep>('info');
  const [creating,       setCreating]       = useState(false);
  const [createError,    setCreateError]    = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Load capabilities when reaching format step */
  useEffect(() => {
    if (step === 'format' && !caps) {
      detectCapabilities().then(c => {
        setCaps(c);
        setSampleRate(c.defaultSampleRate);
        setBitDepth(c.defaultBitDepth);
        setContainer(c.defaultContainer);
        setChannel(c.channels[0]);
      });
    }
  }, [step, caps]);

  /* Script file import */
  const handleScriptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScriptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setScriptText(reader.result as string);
    reader.readAsText(file);
  };

  /* AI generation */
  const handleAIGenerate = async () => {
    if (!isModuleActive('pipeline')) {
      setAiError('No AI model is configured. Connect an AI provider from User Menu → AI, then return to set up your project.');
      return;
    }
    setAiGenerating(true);
    setAiError('');
    const brief = [
      `Project: "${projectName}"`,
      showName ? `Show: ${showName}` : '',
      episodeTitle ? `Episode: "${episodeTitle}" (${episodeType})` : '',
      `Type: ${projectType}`,
      topic ? `Topic: ${topic}` : '',
      targetAudience ? `Target Audience: ${targetAudience}` : '',
      `Tone/Style: ${tone}`,
      `Estimated Length: ${estimatedLength}`,
      `Recording Date: ${recordingDate || 'TBD'}`,
      `Release Date: ${releaseDate || 'TBD'}`,
      `Platform: ${platforms.join(', ') || 'TBD'}`,
      hasScript ? 'Script: Provided (will be imported)' : 'Script: None — please suggest a structure',
      needsResearch  ? 'Research required.' : '',
      needsMusic     ? 'Music beds/intro needed.' : '',
      needsSFX       ? 'Sound effects needed.' : '',
      needsVoiceover ? 'Voiceover assets needed.' : '',
    ].filter(Boolean).join('\n');

    try {
      const result = await sendMessage('pipeline', [
        { role: 'user', content: `You are an expert podcast producer. Create a production plan and script outline for this project:\n\n${brief}\n\nProvide: 1) Project summary 2) Script outline with segments, cues, timing 3) Asset checklist (music, SFX) 4) Production timeline 5) Source citations if research was requested (do not invent sources). Keep it practical and actionable.` },
      ]);
      setAiNotes(result);
    } catch (e: any) {
      setAiError(e?.message ?? 'AI generation failed. Check AI configuration and try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  /* Project creation */
  const handleCreate = async () => {
    setCreating(true);
    setCreateError('');
    try {
      const data: WizardData = {
        projectName, projectType, showName, episodeTitle, episodeType,
        estimatedLength, recordingDate, releaseDate, platforms,
        hasScript, scriptText, sampleRate, bitDepth, container, channel,
        isAIProducer: isAI, aiNotes, topic, targetAudience, tone,
        needsMusic, needsSFX, needsVoiceover, needsResearch,
      };
      await createWorkspace(userId, data);
      setStep('done');
    } catch (e: any) {
      setCreateError(e?.message ?? 'Project creation failed. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const stepNum = step === 'info' ? 1 : step === 'format' ? 2 : step === 'preview' ? 3 : 4;
  const totalSteps = 4;

  /* ── Header ───────────────────────────────────────────────── */
  return (
    <>
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isAI ? 'AI Producer Setup' : 'Project Setup'}
            </h2>
            <p className="text-violet-200 text-sm mt-0.5">
              {step === 'info'    ? 'Step 1 — Project information'    : ''}
              {step === 'format'  ? 'Step 2 — Recording format'        : ''}
              {step === 'preview' ? 'Step 3 — Review before creating'  : ''}
              {step === 'creating'? 'Creating your workspace…'         : ''}
              {step === 'done'    ? 'Project created!'                 : ''}
            </p>
          </div>
          {step !== 'creating' && step !== 'done' && (
            <span className="text-violet-300 text-xs font-medium">{stepNum} / {totalSteps}</span>
          )}
        </div>
        {step !== 'creating' && step !== 'done' && (
          <div className="flex gap-1.5 mt-3">
            {['info', 'format', 'preview', 'finish'].map((s, i) => (
              <div key={s} className={`flex-1 h-1 rounded-full ${i < stepNum ? 'bg-white' : 'bg-white/25'}`} />
            ))}
          </div>
        )}
      </div>

      {/* ── Step content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        {step === 'info' && (
          <InfoStep
            isAI={isAI}
            projectName={projectName} setProjectName={setProjectName}
            projectType={projectType} setProjectType={setProjectType}
            showName={showName} setShowName={setShowName}
            episodeTitle={episodeTitle} setEpisodeTitle={setEpisodeTitle}
            episodeType={episodeType} setEpisodeType={setEpisodeType}
            estimatedLength={estimatedLength} setEstimatedLength={setEstimatedLength}
            recordingDate={recordingDate} setRecordingDate={setRecordingDate}
            releaseDate={releaseDate} setReleaseDate={setReleaseDate}
            platforms={platforms} setPlatforms={setPlatforms}
            hasScript={hasScript} setHasScript={setHasScript}
            scriptFileName={scriptFileName}
            onScriptFile={handleScriptFile}
            fileInputRef={fileInputRef}
            topic={topic} setTopic={setTopic}
            targetAudience={targetAudience} setTargetAudience={setTargetAudience}
            tone={tone} setTone={setTone}
            needsMusic={needsMusic} setNeedsMusic={setNeedsMusic}
            needsSFX={needsSFX} setNeedsSFX={setNeedsSFX}
            needsVoiceover={needsVoiceover} setNeedsVoiceover={setNeedsVoiceover}
            needsResearch={needsResearch} setNeedsResearch={setNeedsResearch}
            aiGenerating={aiGenerating} aiNotes={aiNotes} aiError={aiError}
            onAIGenerate={handleAIGenerate}
            isAIActive={isModuleActive('pipeline')}
          />
        )}

        {step === 'format' && (
          <FormatStep
            caps={caps}
            sampleRate={sampleRate} setSampleRate={setSampleRate}
            bitDepth={bitDepth} setBitDepth={setBitDepth}
            container={container} setContainer={setContainer}
            channel={channel} setChannel={setChannel}
          />
        )}

        {step === 'preview' && (
          <PreviewStep
            projectName={projectName} projectType={projectType}
            showName={showName} episodeTitle={episodeTitle}
            episodeType={episodeType} estimatedLength={estimatedLength}
            recordingDate={recordingDate} releaseDate={releaseDate}
            platforms={platforms} hasScript={hasScript} scriptFileName={scriptFileName}
            sampleRate={sampleRate} bitDepth={bitDepth}
            container={container} channel={channel}
            isAI={isAI} aiNotes={aiNotes}
            setAiNotes={setAiNotes}
          />
        )}

        {(step === 'creating') && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
            <p className="text-sm font-medium text-gray-700">Creating your project workspace…</p>
            <p className="text-xs text-gray-400">Setting up project, tasks, calendar, and folder structure</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{projectName} is ready</h3>
              <p className="text-sm text-gray-500 mt-1">
                Project, {STANDARD_TASKS.length + (isAI ? AI_EXTRA_TASKS.length : 0)} tasks, calendar events, and notes created.
              </p>
            </div>
            {createError && (
              <p className="text-xs text-red-500 mt-1">{createError}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      {step !== 'creating' && (
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            {step === 'info' && (
              <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {(step === 'format' || step === 'preview') && (
              <button onClick={() => setStep(step === 'format' ? 'info' : 'format')}
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {createError && step !== 'done' && (
              <p className="text-xs text-red-500 max-w-48">{createError}</p>
            )}

            {step === 'done' ? (
              <button onClick={onDone}
                className="flex items-center gap-1.5 px-6 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700">
                Open Studio <ChevronRight className="w-4 h-4" />
              </button>
            ) : step === 'preview' ? (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-1.5 px-6 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Finish
              </button>
            ) : (
              <button
                onClick={() => setStep(step === 'info' ? 'format' : 'preview')}
                disabled={step === 'info' && !projectName.trim()}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Step components
══════════════════════════════════════════════════════════════════ */
interface InfoStepProps {
  isAI: boolean;
  projectName: string; setProjectName: (v: string) => void;
  projectType: string; setProjectType: (v: string) => void;
  showName: string; setShowName: (v: string) => void;
  episodeTitle: string; setEpisodeTitle: (v: string) => void;
  episodeType: string; setEpisodeType: (v: string) => void;
  estimatedLength: string; setEstimatedLength: (v: string) => void;
  recordingDate: string; setRecordingDate: (v: string) => void;
  releaseDate: string; setReleaseDate: (v: string) => void;
  platforms: string[]; setPlatforms: (v: string[]) => void;
  hasScript: boolean; setHasScript: (v: boolean) => void;
  scriptFileName: string;
  onScriptFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  topic: string; setTopic: (v: string) => void;
  targetAudience: string; setTargetAudience: (v: string) => void;
  tone: string; setTone: (v: string) => void;
  needsMusic: boolean; setNeedsMusic: (v: boolean) => void;
  needsSFX: boolean; setNeedsSFX: (v: boolean) => void;
  needsVoiceover: boolean; setNeedsVoiceover: (v: boolean) => void;
  needsResearch: boolean; setNeedsResearch: (v: boolean) => void;
  aiGenerating: boolean;
  aiNotes: string;
  aiError: string;
  onAIGenerate: () => void;
  isAIActive: boolean;
}

function InfoStep(p: InfoStepProps) {
  const showShow = p.projectType === 'Podcast' || p.projectType === 'Interview';
  const togglePlatform = (pl: string) =>
    p.setPlatforms(p.platforms.includes(pl) ? p.platforms.filter(x => x !== pl) : [...p.platforms, pl]);

  return (
    <div className="space-y-4">
      <Field label="Project Name *">
        <input value={p.projectName} onChange={e => p.setProjectName(e.target.value)}
          placeholder="My Episode" autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
      </Field>

      <Field label="Project Type">
        <select value={p.projectType} onChange={e => p.setProjectType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white">
          {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>

      {showShow && (
        <Field label="Show / Podcast Name">
          <input value={p.showName} onChange={e => p.setShowName(e.target.value)}
            placeholder="The PodCraft Show"
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Episode Title">
          <input value={p.episodeTitle} onChange={e => p.setEpisodeTitle(e.target.value)}
            placeholder="Episode 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
        </Field>
        <Field label="Episode Type">
          <select value={p.episodeType} onChange={e => p.setEpisodeType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white">
            {EPISODE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Estimated Length">
          <select value={p.estimatedLength} onChange={e => p.setEstimatedLength(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white">
            {LENGTH_OPTIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Recording Date">
          <input type="date" value={p.recordingDate} onChange={e => p.setRecordingDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Scheduled Release Date">
          <input type="date" value={p.releaseDate} onChange={e => p.setReleaseDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white" />
        </Field>
        <div />
      </div>

      <Field label="Release Platform(s)">
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(pl => (
            <button key={pl} type="button" onClick={() => togglePlatform(pl)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${p.platforms.includes(pl) ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400'}`}>
              {pl}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Do you already have a script?">
        <div className="flex gap-2">
          {[true, false].map(v => (
            <button key={String(v)} type="button" onClick={() => p.setHasScript(v)}
              className={`flex-1 py-2 text-sm rounded-xl border font-medium transition-colors ${p.hasScript === v ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400'}`}>
              {v ? 'Yes — I have a script' : 'No — not yet'}
            </button>
          ))}
        </div>
        {p.hasScript && (
          <div className="mt-2">
            <input ref={p.fileInputRef} type="file" accept=".txt,.md,.rtf" className="hidden" onChange={p.onScriptFile} />
            <button type="button" onClick={() => p.fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 w-full justify-center transition-colors">
              <UploadCloud className="w-4 h-4" />
              {p.scriptFileName ? p.scriptFileName : 'Import script (.txt, .md, .rtf)'}
            </button>
          </div>
        )}
      </Field>

      {/* AI Producer extra fields */}
      {p.isAI && (
        <>
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> AI Producer Details
            </div>
          </div>

          <Field label="Topic / Description">
            <textarea value={p.topic} onChange={e => p.setTopic(e.target.value)}
              placeholder="What is this episode about?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400 resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Target Audience">
              <input value={p.targetAudience} onChange={e => p.setTargetAudience(e.target.value)}
                placeholder="e.g. Indie podcasters"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
            </Field>
            <Field label="Tone / Style">
              <select value={p.tone} onChange={e => p.setTone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white">
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Production Assets">
            <div className="grid grid-cols-2 gap-2">
              {([
                ['Music beds / intro needed', p.needsMusic, p.setNeedsMusic, <Music className="w-3.5 h-3.5" />],
                ['Sound effects needed', p.needsSFX, p.setNeedsSFX, <Zap className="w-3.5 h-3.5" />],
                ['Voiceover assets needed', p.needsVoiceover, p.setNeedsVoiceover, <Mic className="w-3.5 h-3.5" />],
                ['Research / sources needed', p.needsResearch, p.setNeedsResearch, <BookOpen className="w-3.5 h-3.5" />],
              ] as [string, boolean, (v: boolean) => void, React.ReactNode][]).map(([label, val, set, icon]) => (
                <button key={label} type="button" onClick={() => set(!val)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${val ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </Field>

          {/* AI Generation */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            {!p.isAIActive && (
              <div className="flex items-start gap-2 mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                No AI model configured — connect a provider from User Menu → AI. You can still create the project manually.
              </div>
            )}
            <button onClick={p.onAIGenerate} disabled={p.aiGenerating || !p.projectName.trim() || !p.isAIActive}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed">
              {p.aiGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate AI Production Plan</>}
            </button>
            {p.aiError && <p className="text-xs text-red-500 mt-2">{p.aiError}</p>}
            {p.aiNotes && !p.aiGenerating && (
              <div className="mt-3 bg-white rounded-lg border border-purple-200 p-3">
                <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1.5">AI Production Plan</div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{p.aiNotes}</pre>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Licensing reminder:</strong> Confirm you have the rights to use all music, SFX, generated voices, and third-party assets before release. No assets will be generated without a connected provider.</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Format Step ─────────────────────────────────────────────── */
function FormatStep({ caps, sampleRate, setSampleRate, bitDepth, setBitDepth, container, setContainer, channel, setChannel }: {
  caps: RecordingCaps | null;
  sampleRate: number; setSampleRate: (v: number) => void;
  bitDepth: string; setBitDepth: (v: string) => void;
  container: string; setContainer: (v: string) => void;
  channel: string; setChannel: (v: string) => void;
}) {
  if (!caps) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        <span className="text-sm text-gray-500">Detecting recording capabilities…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        Options shown are detected from your browser&apos;s real audio capabilities. Recording remains at the highest supported quality. Mixdown and mastering export settings are configured separately in the Studio.
      </div>

      <Field label={`Sample Rate (${caps.sampleRates.length} detected)`}>
        <select value={sampleRate} onChange={e => setSampleRate(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white">
          {caps.sampleRates.map(r => (
            <option key={r} value={r}>{r.toLocaleString()} Hz{r === 48000 ? ' (recommended)' : r === 44100 ? ' (CD quality)' : ''}</option>
          ))}
        </select>
      </Field>

      <Field label="Bit Depth / Format">
        <div className="space-y-2">
          {caps.bitDepths.map(b => (
            <button key={b} type="button" onClick={() => setBitDepth(b)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${bitDepth === b ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${bitDepth === b ? 'border-violet-500' : 'border-gray-300'}`}>
                {bitDepth === b && <div className="w-2 h-2 bg-violet-500 rounded-full" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{b}</div>
                <div className="text-[11px] text-gray-500">
                  {b.includes('float') ? 'Highest quality — captures via AudioWorklet at Web Audio API native precision. Recommended.' :
                   b === '24-bit'       ? 'Professional studio standard — high dynamic range, widely compatible.' :
                                          'CD quality standard — universal compatibility, smallest file size.'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Channel Mode">
          <select value={channel} onChange={e => setChannel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white">
            {caps.channels.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <Field label={`Recording Container (${caps.containers.length} supported)`}>
          <select value={container} onChange={e => setContainer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white">
            {caps.containers.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 text-xs text-gray-500">
        <strong className="text-gray-700">Note:</strong> Recording quality stays at your selected settings. Mixdown/export format (MP3, WAV, FLAC) is configured separately from the Studio mastering controls.
      </div>
    </div>
  );
}

/* ── Preview Step ────────────────────────────────────────────── */
function PreviewStep(p: {
  projectName: string; projectType: string; showName: string;
  episodeTitle: string; episodeType: string; estimatedLength: string;
  recordingDate: string; releaseDate: string; platforms: string[];
  hasScript: boolean; scriptFileName: string;
  sampleRate: number; bitDepth: string; container: string; channel: string;
  isAI: boolean; aiNotes: string; setAiNotes: (v: string) => void;
}) {
  const taskCount = STANDARD_TASKS.length + (p.isAI ? AI_EXTRA_TASKS.length : 0);
  const calCount = [p.recordingDate, p.releaseDate].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Section title="Project Details" icon={<FolderOpen className="w-4 h-4" />}>
        <Row label="Name"           value={p.projectName || '—'} />
        <Row label="Type"           value={p.projectType} />
        {p.showName    && <Row label="Show"     value={p.showName} />}
        {p.episodeTitle && <Row label="Episode" value={`${p.episodeTitle} (${p.episodeType})`} />}
        <Row label="Est. Length"    value={p.estimatedLength} />
        {p.recordingDate && <Row label="Recording Date" value={p.recordingDate} />}
        {p.releaseDate   && <Row label="Release Date"   value={p.releaseDate} />}
        {p.platforms.length > 0 && <Row label="Platforms" value={p.platforms.join(', ')} />}
        <Row label="Script" value={p.hasScript ? (p.scriptFileName || 'Provided') : 'None yet'} />
      </Section>

      <Section title="Recording Format" icon={<Mic className="w-4 h-4" />}>
        <Row label="Sample Rate"  value={`${p.sampleRate.toLocaleString()} Hz`} />
        <Row label="Bit Depth"    value={p.bitDepth} />
        <Row label="Channel"      value={p.channel} />
        <Row label="Container"    value={p.container} />
        <div className="text-[10px] text-gray-400 mt-1">Mixdown/export settings are separate — configured from Studio mastering controls.</div>
      </Section>

      <Section title="Workspace to be created" icon={<ClipboardList className="w-4 h-4" />}>
        <Row label="Tasks"          value={`${taskCount} production tasks`} />
        <Row label="Calendar events" value={calCount > 0 ? `${calCount} event${calCount > 1 ? 's' : ''}` : 'None (no dates set)'} />
        <Row label="Folder structure" value="Audio, Music, SFX, Bumpers, Scripts, Notes, Exports" />
        <Row label="Project notes"  value="Setup notes, checklist, licensing reminder" />
        {p.hasScript && p.scriptFileName && <Row label="Imported script" value={p.scriptFileName} />}
      </Section>

      {p.isAI && p.aiNotes && (
        <Section title="AI Production Plan" icon={<Sparkles className="w-4 h-4 text-purple-500" />}>
          <textarea
            value={p.aiNotes}
            onChange={e => p.setAiNotes(e.target.value)}
            rows={6}
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:border-violet-400 font-mono"
          />
          <p className="text-[10px] text-gray-400 mt-1">You can edit the AI plan before saving — it will be stored in your project notes.</p>
        </Section>
      )}

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        Confirm you have the rights to use all music, SFX, generated voices, and third-party assets before release.
      </div>
    </div>
  );
}

/* ── Small shared components ──────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
        {icon} {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}
