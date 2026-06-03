import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { PROVIDER_DEFS, ProviderStatus, MODULE_SYSTEM_PROMPTS, callProviderInference } from '../utils/multiAI';
import { localInfer } from '../utils/localAI';

export const AI_MODULES = [
  { id: 'ai-producer',       label: 'AI Producer',        description: 'Main production assistant & chat' },
  { id: 'script-writer',     label: 'Script Writer',      description: 'Script and dialogue generation' },
  { id: 'pipeline',          label: 'Pipeline',           description: 'Workflow orchestration and planning' },
  { id: 'storyboard',        label: 'Storyboard',         description: 'Episode structure and narrative arcs' },
  { id: 'audio-assistant',   label: 'Audio Assistant',    description: 'Audio quality and production tips' },
  { id: 'metadata-generator',label: 'Metadata Generator', description: 'Titles, tags, descriptions, SEO' },
  { id: 'transcript',        label: 'Transcript',         description: 'Transcript processing and summaries' },
  { id: 'search-research',   label: 'Search & Research',  description: 'Guest and topic research' },
  { id: 'chat',              label: 'Chat',               description: 'General conversation' },
  { id: 'global-default',    label: 'Global Default',     description: 'Fallback for unassigned modules' },
] as const;
export type AIModuleId = typeof AI_MODULES[number]['id'];

export interface ProviderState {
  status: ProviderStatus;
  apiKey: string;
  error?: string;
  extra?: Record<string, string>;
}

export interface ModuleAssignment {
  providerId: string;
  modelId: string;
  providerName: string;
  modelName: string;
  isLocal?: boolean;
}

type Message = { role: string; content: string };

interface AIModelContextType {
  providerStates: Record<string, ProviderState>;
  connectProvider(id: string, apiKey: string, extra?: Record<string, string>): Promise<boolean>;
  disconnectProvider(id: string): void;

  loadedLocalModelIds: string[];
  registerLocalPipeline(modelId: string, pipeline: any, modelName: string): void;
  unregisterLocalPipeline(modelId: string): void;

  assignments: Record<string, ModuleAssignment | null>;
  assignModule(moduleId: string, assignment: ModuleAssignment): void;
  unassignModule(moduleId: string): void;

  sendMessage(moduleId: string, history: Message[]): Promise<string>;
  getModuleInfo(moduleId: string): { providerName: string; modelName: string; status: string } | null;
  isModuleActive(moduleId: string): boolean;
}

/* ── Module-level pipeline registry (non-serializable, not in React state) ── */
const pipelineRegistry: Record<string, { pipeline: any; modelName: string }> = {};

/* ── localStorage helpers ── */
const KEY_PROVIDER = (id: string) => `podcraft_provider_key_${id}`;
const KEY_EXTRA = (id: string) => `podcraft_provider_extra_${id}`;
const KEY_CONNECTED = 'podcraft_connected_providers_v2';
const KEY_ASSIGNMENTS = 'podcraft_ai_assignments_v2';

function loadProviderStates(): Record<string, ProviderState> {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(KEY_CONNECTED) ?? '[]');
    const states: Record<string, ProviderState> = {};
    for (const id of ids) {
      const apiKey = localStorage.getItem(KEY_PROVIDER(id)) ?? '';
      const extra = JSON.parse(localStorage.getItem(KEY_EXTRA(id)) ?? 'null') as Record<string, string> | null;
      states[id] = { status: 'connected', apiKey, extra: extra ?? undefined };
    }
    return states;
  } catch { return {}; }
}

function saveProviderConnected(id: string, apiKey: string, extra?: Record<string, string>) {
  const ids: string[] = JSON.parse(localStorage.getItem(KEY_CONNECTED) ?? '[]');
  if (!ids.includes(id)) localStorage.setItem(KEY_CONNECTED, JSON.stringify([...ids, id]));
  localStorage.setItem(KEY_PROVIDER(id), apiKey);
  if (extra) localStorage.setItem(KEY_EXTRA(id), JSON.stringify(extra));
  else localStorage.removeItem(KEY_EXTRA(id));
}

function saveProviderDisconnected(id: string) {
  const ids: string[] = JSON.parse(localStorage.getItem(KEY_CONNECTED) ?? '[]');
  localStorage.setItem(KEY_CONNECTED, JSON.stringify(ids.filter(x => x !== id)));
  localStorage.removeItem(KEY_PROVIDER(id));
  localStorage.removeItem(KEY_EXTRA(id));
}

function loadAssignments(): Record<string, ModuleAssignment | null> {
  try { return JSON.parse(localStorage.getItem(KEY_ASSIGNMENTS) ?? '{}'); } catch { return {}; }
}

function saveAssignments(a: Record<string, ModuleAssignment | null>) {
  localStorage.setItem(KEY_ASSIGNMENTS, JSON.stringify(a));
}

/* ── Context ── */
const AIModelContext = createContext<AIModelContextType | null>(null);

export function AIModelProvider({ children }: { children: React.ReactNode }) {
  const [providerStates, setProviderStates] = useState<Record<string, ProviderState>>(loadProviderStates);
  const [assignments, setAssignments] = useState<Record<string, ModuleAssignment | null>>(loadAssignments);
  const [loadedLocalModelIds, setLoadedLocalModelIds] = useState<string[]>([]);

  /* Stable refs for sendMessage to avoid stale closures */
  const providerStatesRef = useRef(providerStates);
  const assignmentsRef = useRef(assignments);
  useEffect(() => { providerStatesRef.current = providerStates; }, [providerStates]);
  useEffect(() => { assignmentsRef.current = assignments; }, [assignments]);

  const connectProvider = useCallback(async (id: string, apiKey: string, extra?: Record<string, string>): Promise<boolean> => {
    const def = PROVIDER_DEFS.find(p => p.id === id);
    if (!def) return false;

    setProviderStates(prev => ({ ...prev, [id]: { status: 'validating', apiKey, extra } }));

    const { validateProviderConnection } = await import('../utils/multiAI');
    const result = await validateProviderConnection(def, apiKey, extra);

    const newState: ProviderState = { status: result.status, apiKey, error: result.error, extra };
    setProviderStates(prev => ({ ...prev, [id]: newState }));

    if (result.ok) {
      saveProviderConnected(id, apiKey, extra);
      return true;
    }
    return false;
  }, []);

  const disconnectProvider = useCallback((id: string) => {
    setProviderStates(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    saveProviderDisconnected(id);
    /* Unassign any modules that used this provider */
    setAssignments(prev => {
      const next = { ...prev };
      let changed = false;
      for (const [k, v] of Object.entries(next)) {
        if (v?.providerId === id) { next[k] = null; changed = true; }
      }
      if (changed) saveAssignments(next);
      return next;
    });
  }, []);

  const registerLocalPipeline = useCallback((modelId: string, pipeline: any, modelName: string) => {
    pipelineRegistry[modelId] = { pipeline, modelName };
    setLoadedLocalModelIds(Object.keys(pipelineRegistry));
  }, []);

  const unregisterLocalPipeline = useCallback((modelId: string) => {
    delete pipelineRegistry[modelId];
    setLoadedLocalModelIds(Object.keys(pipelineRegistry));
    /* Unassign modules that used this local model */
    setAssignments(prev => {
      const next = { ...prev };
      let changed = false;
      for (const [k, v] of Object.entries(next)) {
        if (v?.isLocal && v.modelId === modelId) { next[k] = null; changed = true; }
      }
      if (changed) saveAssignments(next);
      return next;
    });
  }, []);

  const assignModule = useCallback((moduleId: string, assignment: ModuleAssignment) => {
    setAssignments(prev => {
      const next = { ...prev, [moduleId]: assignment };
      saveAssignments(next);
      return next;
    });
  }, []);

  const unassignModule = useCallback((moduleId: string) => {
    setAssignments(prev => {
      const next = { ...prev, [moduleId]: null };
      saveAssignments(next);
      return next;
    });
  }, []);

  const sendMessage = useCallback(async (moduleId: string, history: Message[]): Promise<string> => {
    const assignment = assignmentsRef.current[moduleId]
      ?? assignmentsRef.current['global-default']
      ?? null;

    if (!assignment) throw new Error(`No AI assigned to "${moduleId}". Open AI Setup → Assignments to configure.`);

    const systemPrompt = MODULE_SYSTEM_PROMPTS[moduleId] ?? MODULE_SYSTEM_PROMPTS['global-default'];
    const messages = [{ role: 'system', content: systemPrompt }, ...history];

    /* Local AI */
    if (assignment.isLocal) {
      const entry = pipelineRegistry[assignment.modelId];
      if (!entry) throw new Error(`Local model "${assignment.modelName}" is not loaded. Open AI Setup → Local AI to load it.`);
      return localInfer(entry.pipeline, messages);
    }

    /* Cloud AI */
    const def = PROVIDER_DEFS.find(p => p.id === assignment.providerId);
    if (!def) throw new Error(`Unknown provider: ${assignment.providerId}`);

    const state = providerStatesRef.current[assignment.providerId];
    if (!state || state.status !== 'connected') {
      throw new Error(`${assignment.providerName} is not connected. Reconnect in AI Setup → Cloud AI.`);
    }

    return callProviderInference(def, assignment.modelId, state.apiKey, messages, state.extra);
  }, []);

  const getModuleInfo = useCallback((moduleId: string) => {
    const assignment = assignments[moduleId] ?? assignments['global-default'];
    if (!assignment) return null;
    const isLocal = assignment.isLocal ?? false;
    const providerState = isLocal ? null : providerStates[assignment.providerId];
    const status = isLocal
      ? (pipelineRegistry[assignment.modelId] ? 'Ready' : 'Not loaded')
      : (providerState?.status === 'connected' ? 'Connected' : providerState?.status ?? 'Not connected');
    return { providerName: assignment.providerName, modelName: assignment.modelName, status };
  }, [assignments, providerStates]);

  const isModuleActive = useCallback((moduleId: string) => {
    const info = getModuleInfo(moduleId);
    return info?.status === 'Connected' || info?.status === 'Ready';
  }, [getModuleInfo]);

  return (
    <AIModelContext.Provider value={{
      providerStates, connectProvider, disconnectProvider,
      loadedLocalModelIds, registerLocalPipeline, unregisterLocalPipeline,
      assignments, assignModule, unassignModule,
      sendMessage, getModuleInfo, isModuleActive,
    }}>
      {children}
    </AIModelContext.Provider>
  );
}

export function useAIModel(): AIModelContextType {
  const ctx = useContext(AIModelContext);
  if (!ctx) throw new Error('useAIModel must be used within AIModelProvider');
  return ctx;
}
