import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ApprovalGate } from '../components/ApprovalGate';
import { useAIConfig } from '../store/AIConfigStore';
import {
  ListIcon, SearchIcon, MicIcon, ScissorsIcon, SlidersHorizontalIcon,
  ZapIcon, PackageIcon, SendIcon, SparklesIcon, CheckCircle2Icon,
  CircleIcon, LoaderIcon, AlertCircleIcon, ChevronDownIcon, ChevronRightIcon,
  CopyIcon, StarIcon, ExternalLinkIcon, RefreshCwIcon, SettingsIcon,
} from 'lucide-react';
import { planningService } from '../services/ai/stages/planningService';
import { preProductionService } from '../services/ai/stages/preProductionService';
import { postProductionService } from '../services/ai/stages/postProductionService';
import { mixingService } from '../services/ai/stages/mixingService';
import { packagingService } from '../services/ai/stages/packagingService';
import { distributionService } from '../services/ai/stages/distributionService';
import { masteringAssistantService } from '../services/ai/masteringAssistantService';
import { recordingCoachService } from '../services/ai/recordingCoachService';
import { qualityScorecardService } from '../services/ai/qualityScorecardService';
import type {
  ProductionStage, EpisodeConcept, EpisodeBlueprint, ResearchPackage,
  EpisodeOutline, EditRecommendation, MixRecommendation, MasteringRecommendation,
  EpisodePackage, DistributionPackage, QualityScorecard, QualityCategoryScore,
  ApprovalRequest, DistributionPlatform,
} from '../services/ai/types';

// ─── Stage config ────────────────────────────────────────────────────────────

const STAGES: { id: ProductionStage; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'planning',        label: 'Planning',        icon: ListIcon,               desc: 'Topic, concept, blueprint & checklist' },
  { id: 'pre-production',  label: 'Pre-Production',  icon: SearchIcon,             desc: 'Research, outline & interview prep' },
  { id: 'production',      label: 'Production',      icon: MicIcon,                desc: 'Recording readiness & coaching' },
  { id: 'post-production', label: 'Post-Production', icon: ScissorsIcon,           desc: 'Edit suggestions & cleanup plan' },
  { id: 'mixing',          label: 'Mixing',          icon: SlidersHorizontalIcon,  desc: 'Loudness, EQ & balance analysis' },
  { id: 'mastering',       label: 'Mastering',       icon: ZapIcon,                desc: 'Final loudness & delivery readiness' },
  { id: 'packaging',       label: 'Packaging',       icon: PackageIcon,            desc: 'Titles, show notes, social copy' },
  { id: 'distribution',    label: 'Distribution',    icon: SendIcon,               desc: 'Export formats & platform checklist' },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function Spinner() { return <LoaderIcon className="w-4 h-4 animate-spin" />; }

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); };
  return (
    <button onClick={copy} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Copy">
      {copied ? <CheckCircle2Icon className="w-3.5 h-3.5 text-green-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
    </button>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left text-sm font-semibold text-gray-700">
        {title}
        {open ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
      </button>
      {open && <div className="p-4 space-y-2 text-sm text-gray-700">{children}</div>}
    </div>
  );
}

function StringList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-gray-400 italic text-xs">None</p>;
  return <ul className="space-y-1">{items.map((i, k) => <li key={k} className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">•</span>{i}</li>)}</ul>;
}

function RunBtn({ onClick, loading, label, disabled }: { onClick: () => void; loading: boolean; label: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
      {loading ? <Spinner /> : <SparklesIcon className="w-4 h-4" />} {loading ? 'Running AI…' : label}
    </button>
  );
}

function GradeChip({ grade }: { grade: 'A' | 'B' | 'C' | 'D' | 'F' }) {
  const colors = { A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-yellow-100 text-yellow-700', D: 'bg-orange-100 text-orange-700', F: 'bg-red-100 text-red-700' };
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[grade]}`}>{grade}</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AIProducer() {
  const { config } = useAIConfig();

  // Episode context
  const [topic, setTopic]               = useState('');
  const [showName, setShowName]         = useState('');
  const [hostName, setHostName]         = useState('');
  const [audience, setAudience]         = useState('');
  const [format, setFormat]             = useState<EpisodeConcept['format']>('solo');
  const [duration, setDuration]         = useState(40);

  // Navigation
  const [activeStage, setActiveStage]   = useState<ProductionStage>('planning');
  const [doneStages, setDoneStages]     = useState<Set<ProductionStage>>(new Set());

  // Outputs
  const [topicIdeas,     setTopicIdeas]     = useState<string[]>([]);
  const [blueprint,      setBlueprint]      = useState<EpisodeBlueprint | null>(null);
  const [research,       setResearch]       = useState<ResearchPackage | null>(null);
  const [outline,        setOutline]        = useState<EpisodeOutline | null>(null);
  const [interviewQs,    setInterviewQs]    = useState<string[]>([]);
  const [guestName,      setGuestName]      = useState('');
  const [recordingNotes, setRecordingNotes] = useState('');
  const [recordingTip,   setRecordingTip]   = useState('');
  const [editRec,        setEditRec]        = useState<EditRecommendation | null>(null);
  const [cleanupPlan,    setCleanupPlan]    = useState('');
  const [mixStyle,       setMixStyle]       = useState('Broadcast');
  const [measuredLUFS,   setMeasuredLUFS]   = useState('');
  const [mixRec,         setMixRec]         = useState<MixRecommendation | null>(null);
  const [masteringRec,   setMasteringRec]   = useState<MasteringRecommendation | null>(null);
  const [episodePkg,     setEpisodePkg]     = useState<EpisodePackage | null>(null);
  const [distribution,   setDistribution]   = useState<DistributionPackage | null>(null);
  const [platforms,      setPlatforms]      = useState<DistributionPlatform[]>(['spotify', 'apple-podcasts', 'rss']);
  const [scorecard,      setScorecard]      = useState<QualityScorecard | null>(null);
  const [showScorecard,  setShowScorecard]  = useState(false);
  const [approval,       setApproval]       = useState<ApprovalRequest | null>(null);

  // Loading / error per key
  const [loading, setLoad] = useState<Record<string, boolean>>({});
  const [errors,  setErr]  = useState<Record<string, string>>({});
  const run = (key: string, fn: () => Promise<void>) => {
    setLoad(l => ({ ...l, [key]: true }));
    setErr(e => ({ ...e, [key]: '' }));
    fn()
      .then(() => setDoneStages(s => new Set(s).add(activeStage)))
      .catch(e => setErr(er => ({ ...er, [key]: e instanceof Error ? e.message : 'Error' })))
      .finally(() => setLoad(l => ({ ...l, [key]: false })));
  };

  const isAIReady = config.mode !== 'none' && config.setupComplete;

  // ─── Stage panels ─────────────────────────────────────────────────────────

  function PlanningPanel() {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <RunBtn label="Generate Topic Ideas" loading={!!loading.topicIdeas} disabled={!showName && !topic}
            onClick={() => run('topicIdeas', async () => setTopicIdeas(await planningService.generateTopicIdeas(showName || topic || 'podcast', [], 6)))} />
          <RunBtn label="Build Episode Blueprint" loading={!!loading.blueprint} disabled={!topic}
            onClick={() => run('blueprint', async () => setBlueprint(await planningService.generateBlueprint(topic, audience, format, showName)))} />
        </div>
        {errors.blueprint && <p className="text-red-600 text-xs">{errors.blueprint}</p>}

        {topicIdeas.length > 0 && (
          <Section title={`💡 Topic Ideas (${topicIdeas.length})`}>
            <div className="space-y-1">
              {topicIdeas.map((idea, i) => (
                <button key={i} onClick={() => setTopic(idea)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-sm transition-colors">
                  {idea}
                </button>
              ))}
            </div>
          </Section>
        )}

        {blueprint && (
          <>
            <Section title="📋 Episode Blueprint">
              <div className="space-y-1">
                <p><strong>Title:</strong> {blueprint.plan.concept.title}</p>
                <p><strong>Premise:</strong> {blueprint.plan.concept.premise}</p>
                <p><strong>Angle:</strong> {blueprint.plan.concept.uniqueAngle}</p>
                <p><strong>Duration:</strong> {blueprint.plan.concept.estimatedDuration}</p>
                <p><strong>Est. Production:</strong> {blueprint.estimatedProductionHours}h</p>
              </div>
            </Section>
            <Section title={`🎬 Segments (${blueprint.plan.segments.length})`}>
              {blueprint.plan.segments.map((s, i) => (
                <div key={i} className="flex items-start gap-3 py-1 border-b border-gray-100 last:border-0">
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium mt-0.5">{s.durationMinutes}m</span>
                  <div><p className="font-medium">{s.name}</p><p className="text-gray-500 text-xs">{s.description}</p></div>
                </div>
              ))}
            </Section>
            <Section title={`✅ Production Checklist (${blueprint.checklist.length} tasks)`} defaultOpen={false}>
              {blueprint.checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <CircleIcon className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{item.task}</span>
                  <span className="ml-auto text-xs text-gray-400 capitalize">{item.stage}</span>
                </div>
              ))}
            </Section>
          </>
        )}
      </div>
    );
  }

  function PreProductionPanel() {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <RunBtn label="Research Package" loading={!!loading.research} disabled={!topic}
            onClick={() => run('research', async () => setResearch(await preProductionService.generateResearchPackage(topic, blueprint?.plan.concept)))} />
          <RunBtn label="Episode Outline" loading={!!loading.outline} disabled={!topic}
            onClick={() => run('outline', async () => setOutline(await preProductionService.generateOutline(topic, blueprint?.plan.concept.uniqueAngle, audience, duration, format)))} />
          {format === 'interview' && (
            <RunBtn label="Interview Questions" loading={!!loading.interviewQs} disabled={!guestName && !topic}
              onClick={() => run('interviewQs', async () => setInterviewQs(await preProductionService.generateInterviewQuestions(guestName || 'the guest', topic)))} />
          )}
        </div>
        {format === 'interview' && (
          <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Guest name (for interview questions)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        )}

        {research && (
          <>
            <Section title={`🔍 Research Package — ${research.topic}`}>
              <p className="text-xs text-gray-500 mb-2">{research.sources.length} sources · {research.keyFacts.length} key facts · {research.statistics.length} statistics</p>
              <StringList items={research.keyFacts} />
            </Section>
            <Section title="📊 Statistics" defaultOpen={false}><StringList items={research.statistics} /></Section>
            <Section title="⚡ Controversies & Debates" defaultOpen={false}><StringList items={research.controversies} /></Section>
            <Section title="🎓 Expert Perspectives" defaultOpen={false}><StringList items={research.expertPerspectives} /></Section>
            <Section title={`📚 Suggested Sources (${research.sources.length})`} defaultOpen={false}>
              {research.sources.map((s, i) => (
                <div key={i} className="flex items-start gap-2 py-1 border-b border-gray-100 last:border-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.reliability === 'high' ? 'bg-green-100 text-green-700' : s.reliability === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>{s.reliability}</span>
                  <div><p className="font-medium text-xs">{s.title}</p><p className="text-gray-500 text-xs">{s.notes}</p></div>
                </div>
              ))}
            </Section>
          </>
        )}

        {outline && (
          <Section title={`📝 Episode Outline — ${outline.title}`}>
            <p className="text-xs text-gray-500 mb-2">{outline.totalEstimatedMinutes} min estimated · {outline.sections.length} sections</p>
            {outline.sections.map((s, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium mt-0.5 flex-shrink-0">{s.estimatedMinutes}m</span>
                <div className="flex-1"><p className="font-medium text-sm">{s.title}</p>
                  {s.talkingPoints.length > 0 && <p className="text-gray-500 text-xs mt-0.5">{s.talkingPoints.join(' · ')}</p>}
                </div>
              </div>
            ))}
          </Section>
        )}

        {interviewQs.length > 0 && (
          <Section title={`❓ Interview Questions (${interviewQs.length})`}>
            <ol className="space-y-2 list-decimal list-inside">
              {interviewQs.map((q, i) => <li key={i} className="text-sm">{q}</li>)}
            </ol>
          </Section>
        )}
      </div>
    );
  }

  function ProductionPanel() {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
          <div className="flex items-start gap-3">
            <MicIcon className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-violet-900">Recording happens in Studio</p>
              <p className="text-sm text-violet-700 mt-0.5">Use Studio for live recording, level monitoring, and real-time feedback. Return here to log recording notes for post-production.</p>
              <Link to="/studio" className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-violet-700 hover:text-violet-900">
                Open Studio <ExternalLinkIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <RunBtn label="Get Recording Tips" loading={!!loading.tip} disabled={!topic}
          onClick={() => run('tip', async () => setRecordingTip(await recordingCoachService.getRecordingTip(topic)))} />

        {recordingTip && (
          <Section title="💡 Recording Tip">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm">{recordingTip}</p>
              <CopyBtn text={recordingTip} />
            </div>
          </Section>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Recording Notes <span className="text-gray-400 font-normal">(carried to post-production)</span></label>
          <textarea value={recordingNotes} onChange={e => setRecordingNotes(e.target.value)} rows={4}
            placeholder="e.g. Room had some HVAC noise at 2:30. Stumbled on the intro twice. Good energy in the main segment. Guest had mic hiss."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
      </div>
    );
  }

  function PostProductionPanel() {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <RunBtn label="Edit Recommendations" loading={!!loading.editRec} disabled={!topic}
            onClick={() => run('editRec', async () => setEditRec(await postProductionService.generateEditRecommendations(duration, recordingNotes, format)))} />
          <RunBtn label="Cleanup Plan" loading={!!loading.cleanup} disabled={!topic}
            onClick={() => run('cleanup', async () => {
              let out = '';
              await postProductionService.generateCleanupPlan(recordingNotes, '', c => { out += c; setCleanupPlan(out); });
              setCleanupPlan(out);
            })} />
        </div>

        {editRec && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Est. Filler Words', value: editRec.fillerWordEstimate },
                { label: 'Silence', value: `${editRec.totalSilenceEstimateSeconds}s` },
                { label: 'Savings', value: `−${editRec.estimatedEditSavingsMinutes}m` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {editRec.editPoints.length > 0 && (
              <Section title={`✂️ Edit Points (${editRec.editPoints.length})`}>
                {editRec.editPoints.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${p.severity === 'high' ? 'bg-red-100 text-red-600' : p.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{p.severity}</span>
                    <div><p className="font-medium text-xs">{p.timestampApprox} — {p.description}</p>
                      <p className="text-gray-500 text-xs">→ {p.recommendation}</p></div>
                  </div>
                ))}
              </Section>
            )}
            <Section title="🧹 Cleanup Suggestions" defaultOpen={false}><StringList items={editRec.cleanupSuggestions} /></Section>
            {editRec.assemblyOrder.length > 0 && (
              <Section title="🔧 Assembly Order" defaultOpen={false}>
                <ol className="space-y-1 list-decimal list-inside">{editRec.assemblyOrder.map((s, i) => <li key={i} className="text-sm">{s}</li>)}</ol>
              </Section>
            )}
          </>
        )}
        {cleanupPlan && (
          <Section title="📋 Cleanup Plan">
            <div className="flex items-start justify-between gap-2">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">{cleanupPlan}</pre>
              <CopyBtn text={cleanupPlan} />
            </div>
          </Section>
        )}
      </div>
    );
  }

  function MixingPanel() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mix Style</label>
            <select value={mixStyle} onChange={e => setMixStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              {['Broadcast', 'Natural', 'Warm', 'Clear', 'Radio'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Measured LUFS <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="number" value={measuredLUFS} onChange={e => setMeasuredLUFS(e.target.value)} placeholder="e.g. -18.5"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
        </div>
        <RunBtn label="Generate Mix Recommendations" loading={!!loading.mix}
          onClick={() => run('mix', async () => setMixRec(await mixingService.generateMixRecommendations(mixStyle, recordingNotes, measuredLUFS ? parseFloat(measuredLUFS) : undefined)))} />

        {mixRec && (
          <>
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50">
              <div className={`w-2.5 h-2.5 rounded-full ${mixRec.loudnessPass ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-sm font-medium">{mixRec.loudnessNote}</span>
              <span className="ml-auto text-xs text-gray-500">Target: {mixRec.targetLUFS} LUFS</span>
            </div>
            <Section title="🎚️ EQ Suggestions"><StringList items={mixRec.eqSuggestions} /></Section>
            <Section title="📉 Compression" defaultOpen={false}><StringList items={mixRec.compressionSuggestions} /></Section>
            <Section title="⚖️ Balance Notes" defaultOpen={false}><StringList items={mixRec.balanceNotes} /></Section>
            <Section title="📝 Overall Report" defaultOpen={false}>
              <div className="flex gap-2">
                <p className="text-sm flex-1">{mixRec.overallReport}</p>
                <CopyBtn text={mixRec.overallReport} />
              </div>
            </Section>
          </>
        )}
      </div>
    );
  }

  function MasteringPanel() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mastering Style</label>
          <select value={mixStyle} onChange={e => setMixStyle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
            {['Broadcast', 'Natural', 'Warm', 'Clear', 'Radio'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <RunBtn label="Get Mastering Preset" loading={!!loading.mastering}
          onClick={() => run('mastering', async () => setMasteringRec(masteringAssistantService.getDefaultRecommendation(mixStyle)))} />

        {masteringRec && (
          <>
            <div className="flex items-center justify-between p-3 bg-violet-50 rounded-xl border border-violet-200">
              <span className="text-sm font-semibold text-violet-900">Target: {masteringRec.targetLUFS} LUFS</span>
              <span className="text-xs text-violet-600">{masteringRec.summary}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'EQ', value: masteringRec.eq },
                { label: 'Compression', value: masteringRec.compression },
                { label: 'De-Essing', value: masteringRec.deEssing },
                { label: 'Limiting', value: masteringRec.limiting },
                { label: 'Noise Reduction', value: masteringRec.noiseReduction },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-24 flex-shrink-0 mt-0.5">{label}</span>
                  <span className="text-xs text-gray-700 flex-1">{value}</span>
                  <CopyBtn text={value} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  function PackagingPanel() {
    return (
      <div className="space-y-4">
        <RunBtn label="Generate Complete Package" loading={!!loading.pkg} disabled={!topic}
          onClick={() => run('pkg', async () => setEpisodePkg(await packagingService.generateCompletePackage(
            topic, blueprint?.plan.concept.uniqueAngle, research?.keyFacts ?? [],
            outline ?? undefined, duration, showName,
          )))} />

        {episodePkg && (
          <>
            <Section title="📣 Episode Metadata">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-xs text-gray-500">Title</p><p className="font-semibold">{episodePkg.metadata.title}</p></div>
                  <CopyBtn text={episodePkg.metadata.title} />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-xs text-gray-500 mb-0.5">Description</p><p>{episodePkg.metadata.description}</p></div>
                  <CopyBtn text={episodePkg.metadata.description} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {episodePkg.metadata.keywords.map((k, i) => (
                      <span key={i} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
            <Section title="📖 Show Notes" defaultOpen={false}>
              <div className="flex items-start justify-between gap-2">
                <pre className="text-xs whitespace-pre-wrap font-sans text-gray-700 flex-1">{episodePkg.showNotes}</pre>
                <CopyBtn text={episodePkg.showNotes} />
              </div>
            </Section>
            {episodePkg.chapters.length > 0 && (
              <Section title={`⏱️ Chapter Markers (${episodePkg.chapters.length})`} defaultOpen={false}>
                {episodePkg.chapters.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 py-1 border-b border-gray-100 last:border-0">
                    <span className="text-xs font-mono text-gray-500 w-12">{Math.floor(c.timestampSeconds / 60)}:{String(c.timestampSeconds % 60).padStart(2, '0')}</span>
                    <span className="text-sm">{c.title}</span>
                  </div>
                ))}
              </Section>
            )}
            <Section title="📱 Social Copy" defaultOpen={false}>
              {[
                { platform: 'Twitter / X', text: episodePkg.socialCopy.twitter },
                { platform: 'LinkedIn', text: episodePkg.socialCopy.linkedin },
                { platform: 'Instagram', text: episodePkg.socialCopy.instagram },
                { platform: 'Newsletter', text: episodePkg.socialCopy.newsletter },
              ].map(({ platform, text }) => text ? (
                <div key={platform} className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-2 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{platform}</span>
                    <CopyBtn text={text} />
                  </div>
                  <p className="text-xs text-gray-700">{text}</p>
                </div>
              ) : null)}
            </Section>
          </>
        )}
      </div>
    );
  }

  function DistributionPanel() {
    const PLATFORM_OPTIONS: { id: DistributionPlatform; label: string }[] = [
      { id: 'spotify', label: 'Spotify' },
      { id: 'apple-podcasts', label: 'Apple Podcasts' },
      { id: 'rss', label: 'RSS Feed' },
      { id: 'youtube', label: 'YouTube' },
      { id: 'google-podcasts', label: 'Google Podcasts' },
    ];

    const togglePlatform = (id: DistributionPlatform) =>
      setPlatforms(ps => ps.includes(id) ? ps.filter(p => p !== id) : [...ps, id]);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Target Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map(({ id, label }) => (
              <button key={id} onClick={() => togglePlatform(id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${platforms.includes(id) ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <RunBtn label="Generate Distribution Package" loading={!!loading.dist} disabled={!episodePkg}
          onClick={() => {
            if (!episodePkg) return;
            setApproval({
              id: 'dist-package',
              action: 'Generate Distribution Package',
              description: `This will prepare your episode "${episodePkg.metadata.title || topic}" for distribution. Review all outputs before publishing.`,
              impact: 'medium',
            });
          }} />

        {!episodePkg && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">Complete the Packaging stage first to generate a distribution package.</p>}

        {distribution && (
          <>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle2Icon className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Export: {distribution.recommendedFormat.toUpperCase()} · {distribution.recommendedBitrate} · {distribution.targetLUFS} LUFS
                </p>
              </div>
            </div>
            <Section title={`🚦 Platform Readiness (${distribution.platforms.length})`}>
              {distribution.platforms.map((p, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${p.ready ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.label}</p>
                    <p className="text-xs text-gray-500">{p.formatRecommendation}</p>
                    <p className="text-xs text-gray-400">{p.notes}</p>
                  </div>
                </div>
              ))}
            </Section>
            <Section title="📋 Publishing Checklist">
              <ol className="space-y-1.5 list-decimal list-inside">
                {distribution.exportChecklist.map((item, i) => <li key={i} className="text-sm">{item}</li>)}
              </ol>
            </Section>
          </>
        )}
      </div>
    );
  }

  // ─── Scorecard modal ───────────────────────────────────────────────────────

  const generateScorecard = useCallback(async () => {
    setLoad(l => ({ ...l, scorecard: true }));
    try {
      const sc = await qualityScorecardService.generateScorecard({
        topic,
        durationMinutes: duration,
        hasScript: Boolean(outline),
        hasOutline: Boolean(outline),
        hasResearch: Boolean(research),
        editRec: editRec ?? undefined,
        mixRec: mixRec ?? undefined,
        masteringRec: masteringRec ?? undefined,
        episodePackage: episodePkg ?? undefined,
        measuredLUFS: measuredLUFS ? parseFloat(measuredLUFS) : undefined,
        recordingNotes,
      });
      setScorecard(sc);
    } finally {
      setLoad(l => ({ ...l, scorecard: false }));
    }
  }, [topic, duration, outline, research, editRec, mixRec, masteringRec, episodePkg, measuredLUFS, recordingNotes]);

  const CATEGORY_LABELS: Record<keyof QualityScorecard['categories'], string> = {
    audioQuality: 'Audio Quality',
    noiseLevel: 'Noise Level',
    loudnessCompliance: 'Loudness Compliance',
    scriptStructure: 'Script Structure',
    pacing: 'Pacing',
    introQuality: 'Intro Quality',
    outroQuality: 'Outro Quality',
    metadataCompleteness: 'Metadata Completeness',
    distributionReadiness: 'Distribution Readiness',
  };

  // ─── Layout ────────────────────────────────────────────────────────────────

  const activeStageConfig = STAGES.find(s => s.id === activeStage)!;
  const ActiveIcon = activeStageConfig.icon;

  if (!isAIReady) {
    return (
      <AppLayout title="AI Producer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm">
            <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">AI Producer not configured</h2>
            <p className="text-sm text-gray-500 mb-5">Set up an AI provider to unlock the full podcast production pipeline.</p>
            <Link to="/settings/ai" className="inline-flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700">
              <SettingsIcon className="w-4 h-4" /> Configure AI Producer
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={<span className="flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-violet-600" />AI Producer</span>}
      rightHeader={
        <button onClick={() => { setShowScorecard(true); generateScorecard(); }}
          className="flex items-center gap-2 px-4 py-2 border border-violet-300 text-violet-700 rounded-lg text-sm font-semibold hover:bg-violet-50">
          <StarIcon className="w-4 h-4" /> Quality Scorecard
        </button>
      }>

      {/* Context bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="col-span-2 lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Episode Topic *</label>
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="What's this episode about?"
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Show Name</label>
          <input value={showName} onChange={e => setShowName(e.target.value)} placeholder="Your Podcast"
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Host Name</label>
          <input value={hostName} onChange={e => setHostName(e.target.value)} placeholder="Your Name"
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Format</label>
          <select value={format} onChange={e => setFormat(e.target.value as EpisodeConcept['format'])}
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
            {['solo', 'interview', 'panel', 'narrative', 'roundtable'].map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Duration (min)</label>
          <input type="number" value={duration} onChange={e => setDuration(+e.target.value)} min={5} max={180}
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5">
        {/* Stage navigation */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {STAGES.map(({ id, label, icon: Icon }) => {
            const done = doneStages.has(id);
            const active = id === activeStage;
            return (
              <button key={id} onClick={() => setActiveStage(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${active ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : done ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="flex-1">{label}</span>
                {done && !active && <CheckCircle2Icon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Active stage content */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <ActiveIcon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{activeStageConfig.label}</h2>
              <p className="text-sm text-gray-500">{activeStageConfig.desc}</p>
            </div>
            {doneStages.has(activeStage) && (
              <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                <CheckCircle2Icon className="w-3.5 h-3.5" /> Complete
              </div>
            )}
          </div>

          {!topic && activeStage !== 'planning' && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm text-amber-700">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
              Enter an episode topic in the context bar above to get started.
            </div>
          )}

          {activeStage === 'planning'        && <PlanningPanel />}
          {activeStage === 'pre-production'  && <PreProductionPanel />}
          {activeStage === 'production'      && <ProductionPanel />}
          {activeStage === 'post-production' && <PostProductionPanel />}
          {activeStage === 'mixing'          && <MixingPanel />}
          {activeStage === 'mastering'       && <MasteringPanel />}
          {activeStage === 'packaging'       && <PackagingPanel />}
          {activeStage === 'distribution'    && <DistributionPanel />}
        </div>
      </div>

      {/* Quality Scorecard modal */}
      {showScorecard && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowScorecard(false)}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarIcon className="w-5 h-5 text-violet-600" />
                <h2 className="font-bold text-gray-900">Episode Quality Scorecard</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={generateScorecard} disabled={!!loading.scorecard}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
                  {loading.scorecard ? <Spinner /> : <RefreshCwIcon className="w-3.5 h-3.5" />}
                  {loading.scorecard ? 'Analyzing…' : 'Refresh'}
                </button>
                <button onClick={() => setShowScorecard(false)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
              </div>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loading.scorecard && !scorecard && (
                <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                  <Spinner /> Analyzing episode quality…
                </div>
              )}
              {scorecard && (
                <>
                  <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-center">
                      <div className={`text-4xl font-black ${scorecard.overallGrade === 'A' ? 'text-green-600' : scorecard.overallGrade === 'B' ? 'text-blue-600' : scorecard.overallGrade === 'C' ? 'text-yellow-600' : scorecard.overallGrade === 'D' ? 'text-orange-600' : 'text-red-600'}`}>{scorecard.overallGrade}</div>
                      <div className="text-xs text-gray-500">{scorecard.overallScore}/100</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${scorecard.readyForExport ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {scorecard.readyForExport ? <CheckCircle2Icon className="w-3.5 h-3.5" /> : <AlertCircleIcon className="w-3.5 h-3.5" />}
                          {scorecard.readyForExport ? 'Ready for Export' : 'Not Yet Ready'}
                        </div>
                      </div>
                      {scorecard.blockers.length > 0 && (
                        <p className="text-xs text-red-600">{scorecard.blockers.join(' · ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {(Object.entries(scorecard.categories) as [keyof QualityScorecard['categories'], QualityCategoryScore][]).map(([key, cat]) => (
                      <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-24 flex-shrink-0">
                          <p className="text-xs font-medium text-gray-700">{CATEGORY_LABELS[key]}</p>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${cat.score >= 80 ? 'bg-green-500' : cat.score >= 70 ? 'bg-blue-500' : cat.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${cat.score}%` }} />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{cat.feedback}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-600">{cat.score}</span>
                          <GradeChip grade={cat.grade} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {scorecard.recommendations.length > 0 && (
                    <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                      <p className="text-xs font-bold text-violet-900 mb-2">Top Recommendations</p>
                      <StringList items={scorecard.recommendations} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Gate */}
      {approval && (
        <ApprovalGate
          request={approval}
          onApprove={() => {
            setApproval(null);
            if (approval.id === 'dist-package' && episodePkg) {
              run('dist', async () => setDistribution(await distributionService.generateDistributionPackage(episodePkg, platforms)));
            }
          }}
          onReject={() => setApproval(null)}
        />
      )}
    </AppLayout>
  );
}
