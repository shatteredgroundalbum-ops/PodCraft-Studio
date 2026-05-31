import { useState, useEffect, useCallback } from 'react';
import { aiProducerService } from '../services/ai/aiProducerService';
import { researchAssistantService } from '../services/ai/researchAssistantService';
import { scriptAssistantService } from '../services/ai/scriptAssistantService';
import { recordingCoachService } from '../services/ai/recordingCoachService';
import { masteringAssistantService } from '../services/ai/masteringAssistantService';
import type {
  AIAvailability,
  AIMessage,
  RecordingFeedback,
  MicReadiness,
  ResearchResult,
  ScriptDraft,
  MasteringRecommendation,
} from '../services/ai/types';

export interface UseAIProducer {
  availability: AIAvailability;
  isAvailable: boolean;
  providerName: string;
  setupInstructions?: string;
  messages: AIMessage[];
  isLoading: boolean;
  lastError: string;
  streamingText: string;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  generateResearch: (topic: string, notes?: string) => Promise<ResearchResult | null>;
  generateScript: (topic: string, outline: string[], style?: string) => Promise<ScriptDraft | null>;
  improveText: (text: string, instruction: string) => Promise<string>;
  generateIntro: (topic: string, hostName?: string) => Promise<string>;
  generateOutro: (topic: string, showName?: string) => Promise<string>;
  analyzeMicLevel: (peak: number, rms: number) => MicReadiness;
  generateLiveFeedback: (peak: number, rms: number, silenceDuration: number, clipCount: number) => RecordingFeedback[];
  getRecordingTip: (topic: string) => Promise<string>;
  getMasteringRecommendation: (style: string) => MasteringRecommendation;
  getPersonalisedMastering: (style: string, notes: string) => Promise<string>;
}

export function useAIProducer(): UseAIProducer {
  const [availability, setAvailability] = useState<AIAvailability>('checking');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState('');
  const [streamingText, setStreamingText] = useState('');

  useEffect(() => {
    const unsub = aiProducerService.subscribe(() => {
      setAvailability(aiProducerService.availability);
    });
    aiProducerService.initialize().catch(() => {});
    return unsub;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!aiProducerService.isAvailable()) {
      setLastError('AI Producer is not available. ' + (aiProducerService.providerInfo.setupInstructions ?? ''));
      return;
    }
    const userMsg: AIMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setLastError('');
    setStreamingText('');
    let accumulated = '';
    try {
      await aiProducerService.chat([...messages, userMsg], {
        onChunk: (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
        },
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastError('');
    setStreamingText('');
  }, []);

  const generateResearch = useCallback(async (topic: string, notes?: string): Promise<ResearchResult | null> => {
    if (!aiProducerService.isAvailable()) { setLastError('AI not available'); return null; }
    setIsLoading(true);
    setLastError('');
    try {
      return await researchAssistantService.generateResearch(topic, notes);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Research failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateScript = useCallback(async (topic: string, outline: string[], style = 'conversational'): Promise<ScriptDraft | null> => {
    if (!aiProducerService.isAvailable()) { setLastError('AI not available'); return null; }
    setIsLoading(true);
    setLastError('');
    try {
      return await scriptAssistantService.generateScript(topic, outline, style);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Script generation failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const improveText = useCallback(async (text: string, instruction: string): Promise<string> => {
    if (!aiProducerService.isAvailable()) { setLastError('AI not available'); return text; }
    setIsLoading(true);
    setLastError('');
    try {
      return await scriptAssistantService.improveText(text, instruction);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Improvement failed');
      return text;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateIntro = useCallback(async (topic: string, hostName?: string): Promise<string> => {
    if (!aiProducerService.isAvailable()) { setLastError('AI not available'); return ''; }
    setIsLoading(true);
    try {
      return await scriptAssistantService.generateIntro(topic, hostName);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Failed');
      return '';
    } finally { setIsLoading(false); }
  }, []);

  const generateOutro = useCallback(async (topic: string, showName?: string): Promise<string> => {
    if (!aiProducerService.isAvailable()) { setLastError('AI not available'); return ''; }
    setIsLoading(true);
    try {
      return await scriptAssistantService.generateOutro(topic, showName);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Failed');
      return '';
    } finally { setIsLoading(false); }
  }, []);

  const getRecordingTip = useCallback(async (topic: string): Promise<string> => {
    if (!aiProducerService.isAvailable()) return 'AI not available — check setup.';
    return recordingCoachService.getRecordingTip(topic).catch(() => '');
  }, []);

  const getMasteringRecommendation = useCallback((style: string): MasteringRecommendation => {
    return masteringAssistantService.getDefaultRecommendation(style);
  }, []);

  const getPersonalisedMastering = useCallback(async (style: string, notes: string): Promise<string> => {
    if (!aiProducerService.isAvailable()) { setLastError('AI not available'); return ''; }
    setIsLoading(true);
    try {
      return await masteringAssistantService.getPersonalisedRecommendation(style, notes);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Failed');
      return '';
    } finally { setIsLoading(false); }
  }, []);

  const info = aiProducerService.providerInfo;

  return {
    availability,
    isAvailable: aiProducerService.isAvailable(),
    providerName: info.name,
    setupInstructions: info.setupInstructions,
    messages,
    isLoading,
    lastError,
    streamingText,
    sendMessage,
    clearMessages,
    generateResearch,
    generateScript,
    improveText,
    generateIntro,
    generateOutro,
    analyzeMicLevel: (peak, rms) => recordingCoachService.analyzeMicLevel(peak, rms),
    generateLiveFeedback: (peak, rms, silence, clips) => recordingCoachService.generateLiveFeedback(peak, rms, silence, clips),
    getRecordingTip,
    getMasteringRecommendation,
    getPersonalisedMastering,
  };
}
