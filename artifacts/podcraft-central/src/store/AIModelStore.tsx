import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

export type AIMode = 'local' | 'cloud' | null;
export type AIActiveStatus = 'not-configured' | 'ready' | 'connected' | 'error';

type InferFn = (history: Array<{ role: string; content: string }>) => Promise<string>;

interface AIModelContextType {
  aiMode: AIMode;
  runtime: string | null;
  modelName: string | null;
  activeStatus: AIActiveStatus;

  activateLocal(runtime: string, modelName: string, fn: InferFn): void;
  activateCloud(runtime: string, modelName: string, fn: InferFn): void;
  deactivate(): void;

  sendMessage(history: Array<{ role: string; content: string }>): Promise<string>;
  isActive: boolean;
}

const AIModelContext = createContext<AIModelContextType | null>(null);

export function AIModelProvider({ children }: { children: React.ReactNode }) {
  const [aiMode, setAiMode] = useState<AIMode>(null);
  const [runtime, setRuntime] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<AIActiveStatus>('not-configured');
  const inferFnRef = useRef<InferFn | null>(null);

  const activateLocal = useCallback((rt: string, model: string, fn: InferFn) => {
    setAiMode('local');
    setRuntime(rt);
    setModelName(model);
    setActiveStatus('ready');
    inferFnRef.current = fn;
  }, []);

  const activateCloud = useCallback((rt: string, model: string, fn: InferFn) => {
    setAiMode('cloud');
    setRuntime(rt);
    setModelName(model);
    setActiveStatus('connected');
    inferFnRef.current = fn;
  }, []);

  const deactivate = useCallback(() => {
    setAiMode(null);
    setRuntime(null);
    setModelName(null);
    setActiveStatus('not-configured');
    inferFnRef.current = null;
  }, []);

  const sendMessage = useCallback(async (history: Array<{ role: string; content: string }>) => {
    if (!inferFnRef.current) {
      throw new Error('No AI configured. Open AI Setup to connect a Local or Cloud AI model.');
    }
    return inferFnRef.current(history);
  }, []);

  const isActive = activeStatus === 'ready' || activeStatus === 'connected';

  return (
    <AIModelContext.Provider value={{
      aiMode, runtime, modelName, activeStatus,
      activateLocal, activateCloud, deactivate,
      sendMessage, isActive,
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
