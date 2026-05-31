import React, { createContext, useContext, useState } from 'react';
import type { AIConfig } from '../services/ai/types';
import { aiProviderService } from '../services/ai/aiProviderService';

const AI_CONFIG_KEY = 'podcraft_ai_config';

const EMPTY_CONFIG: AIConfig = { mode: 'none', setupComplete: false };

function loadAIConfigRaw(): AIConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (raw) return { ...EMPTY_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...EMPTY_CONFIG };
}

// Module-level init: configure the service synchronously before any component renders
aiProviderService.configure(loadAIConfigRaw());

function loadAIConfig(): AIConfig {
  return loadAIConfigRaw();
}

function persistAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify({
      ...config,
      updatedAt: new Date().toISOString(),
    }));
  } catch { /* ignore */ }
}

interface AIConfigContextType {
  config: AIConfig;
  updateConfig: (updates: Partial<AIConfig>) => void;
  completeSetup: (config: AIConfig) => void;
  resetSetup: () => void;
  showWizard: boolean;
  openWizard: () => void;
  closeWizard: () => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export function AIConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AIConfig>(loadAIConfig);
  const [showWizard, setShowWizard] = useState(false);

  const updateConfig = (updates: Partial<AIConfig>) => {
    const next: AIConfig = { ...config, ...updates };
    setConfig(next);
    persistAIConfig(next);
    aiProviderService.configure(next);
  };

  const completeSetup = (newConfig: AIConfig) => {
    const next: AIConfig = { ...newConfig, setupComplete: true };
    setConfig(next);
    persistAIConfig(next);
    aiProviderService.configure(next);
    setShowWizard(false);
  };

  const resetSetup = () => {
    const next: AIConfig = { mode: 'none', setupComplete: false };
    setConfig(next);
    persistAIConfig(next);
    aiProviderService.configure(next);
    setShowWizard(true);
  };

  return (
    <AIConfigContext.Provider value={{
      config,
      updateConfig,
      completeSetup,
      resetSetup,
      showWizard,
      openWizard: () => setShowWizard(true),
      closeWizard: () => setShowWizard(false),
    }}>
      {children}
    </AIConfigContext.Provider>
  );
}

export function useAIConfig(): AIConfigContextType {
  const ctx = useContext(AIConfigContext);
  if (!ctx) throw new Error('useAIConfig must be used inside AIConfigProvider');
  return ctx;
}
