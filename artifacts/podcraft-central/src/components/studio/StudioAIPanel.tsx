import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles, MoreVertical, Send,
  PanelRightClose, PanelLeftClose, Trash2, Download,
  Wifi, WifiOff, Loader2, Cpu, Cloud,
} from 'lucide-react';
import { useAIModel } from '../../store/AIModelStore';
import { AIModelSelector } from '../ai/AIModelSelector';

type Tab = 'Chat' | 'Assistant' | 'Notes';

interface Message { role: 'system' | 'user' | 'assistant'; content: string; }
interface StudioAIPanelProps { width: number; collapsed: boolean; onToggleCollapsed: () => void; }

const SYSTEM_PROMPT =
  'You are an AI podcast producer assistant inside PodCraft Central. Help with show notes, episode titles, guest research, interview questions, scripting, production decisions, and audio quality tips. Be concise and actionable.';

export function StudioAIPanel({ width, collapsed, onToggleCollapsed }: StudioAIPanelProps) {
  const ai = useAIModel();

  const [activeTab, setActiveTab] = useState<Tab>('Chat');
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [notes, setNotes] = useState(() => localStorage.getItem('podcraft_notes') || '');
  const [messages, setMessages] = useState<Message[]>(() => {
    try { const s = localStorage.getItem('podcraft_chat'); if (s) return JSON.parse(s); } catch { /* ok */ }
    return [];
  });

  useEffect(() => { localStorage.setItem('podcraft_notes', notes); }, [notes]);
  useEffect(() => { localStorage.setItem('podcraft_chat', JSON.stringify(messages.slice(-60))); }, [messages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!ai.isActive) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'No AI configured. Click "AI Setup" in the header to connect a Local or Cloud AI model.',
      }]);
      return;
    }

    const userMsg: Message = { role: 'user', content: input.trim() };
    const history = [...messages.filter(m => m.role !== 'system'), userMsg];
    setMessages(prev => [...prev.filter(m => m.role !== 'system'), userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await ai.sendMessage(history);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err instanceof Error ? err.message : 'AI error — check your connection or API key.'}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (!window.confirm('Clear all chat messages?')) return;
    setMessages([]);
    setMenuOpen(false);
  };

  const exportChat = () => {
    const text = messages.filter(m => m.role !== 'system')
      .map(m => `[${m.role.toUpperCase()}]\n${m.content}\n`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `ai-chat-${Date.now()}.txt`;
    a.click();
    setMenuOpen(false);
  };

  /* ── Collapsed state ── */
  if (collapsed) {
    return (
      <button onClick={onToggleCollapsed}
        className="w-10 bg-white border-l border-gray-200 flex flex-col items-center justify-start py-4 gap-3 hover:bg-gray-50 transition-colors flex-shrink-0">
        <PanelLeftClose className="w-5 h-5 text-violet-600" />
        <div className="flex items-center gap-2 whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', marginTop: 16 }}>
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-semibold text-gray-700">AI Producer</span>
        </div>
      </button>
    );
  }

  /* ── Active AI status pill ── */
  const StatusPill = () => {
    if (!ai.isActive) return (
      <div className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-400">
        <WifiOff className="w-2.5 h-2.5" /> OFFLINE
      </div>
    );
    return (
      <div className={`flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
        ai.aiMode === 'local' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
      }`}>
        {ai.aiMode === 'local' ? <Cpu className="w-2.5 h-2.5" /> : <Wifi className="w-2.5 h-2.5" />}
        {ai.modelName ?? (ai.aiMode === 'local' ? 'LOCAL' : 'CLOUD')}
      </div>
    );
  };

  return (
    <div className="bg-white border-l border-gray-200 flex flex-col flex-shrink-0" style={{ width }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0" />
          <span className="font-semibold text-gray-900 text-sm">AI Producer</span>
          <StatusPill />
        </div>
        <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
          <AIModelSelector />
          <button onClick={onToggleCollapsed} className="hover:text-gray-600 p-1 rounded hover:bg-gray-50">
            <PanelRightClose className="w-4 h-4" />
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="hover:text-gray-600 p-1 rounded hover:bg-gray-50">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                <button onClick={clearChat} className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                  <Trash2 className="w-4 h-4" /> Clear chat
                </button>
                <button onClick={exportChat} className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                  <Download className="w-4 h-4" /> Export as .txt
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active AI info bar — shown when connected */}
      {ai.isActive && (
        <div className={`px-4 py-1.5 border-b text-[10px] flex items-center gap-2 ${
          ai.aiMode === 'local' ? 'bg-violet-50 border-violet-100 text-violet-600' : 'bg-blue-50 border-blue-100 text-blue-600'
        }`}>
          {ai.aiMode === 'local' ? <Cpu className="w-3 h-3 flex-shrink-0" /> : <Cloud className="w-3 h-3 flex-shrink-0" />}
          <span className="font-medium">
            {ai.aiMode === 'local' ? 'Local' : 'Cloud'} · {ai.runtime} · {ai.modelName}
          </span>
          <span className={`ml-auto font-bold ${ai.aiMode === 'local' ? 'text-green-600' : 'text-blue-600'}`}>
            {ai.activeStatus === 'ready' ? '● Ready' : '● Connected'}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex px-4 border-b border-gray-100 flex-shrink-0">
        {(['Chat', 'Assistant', 'Notes'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 min-h-0">

        {activeTab === 'Chat' && (
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <Sparkles className="w-8 h-8 text-violet-300 mx-auto" />
                <p className="text-sm text-gray-400 font-medium">AI Producer</p>
                {!ai.isActive ? (
                  <p className="text-xs text-gray-400">
                    Click <strong className="text-violet-600">AI Setup</strong> to connect Local AI or Cloud AI.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Start a conversation with your AI Producer.</p>
                )}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'system' ? (
                  <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-200 w-full text-center">
                    {msg.content}
                  </div>
                ) : (
                  <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'}`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                  <span className="text-xs text-gray-400">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'Notes' && (
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Jot down ideas, timestamps, or reminders here..."
            className="w-full bg-transparent resize-none focus:outline-none text-sm text-gray-700 leading-relaxed"
            style={{ minHeight: 300 }} />
        )}

        {activeTab === 'Assistant' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Tools</p>
            {[
              { label: 'Generate Show Notes', prompt: 'Generate professional show notes for this episode based on what I\'ve been recording today.' },
              { label: 'Suggest 5 Episode Titles', prompt: 'Suggest 5 compelling episode titles for a podcast episode about independent creators.' },
              { label: 'Write Intro Script', prompt: 'Write a 30-second intro script for this episode that hooks listeners immediately.' },
              { label: 'Extract Key Highlights', prompt: 'What are the most shareable moments or quotes I should highlight from this episode?' },
              { label: 'Write Outro Script', prompt: 'Write a brief, warm outro for this episode with a call-to-action to subscribe and leave a review.' },
              { label: 'Social Media Captions', prompt: 'Write 3 social media captions (Twitter/X, Instagram, LinkedIn) to promote this episode.' },
            ].map(tool => (
              <button
                key={tool.label}
                disabled={!ai.isActive}
                onClick={() => { setInput(tool.prompt); setActiveTab('Chat'); }}
                className={`w-full text-left p-3 bg-white border rounded-lg text-sm font-medium flex items-center justify-between gap-2 transition-colors ${ai.isActive ? 'border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50 cursor-pointer' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>
                {tool.label}
                <Sparkles className={`w-4 h-4 shrink-0 ${ai.isActive ? 'text-violet-400' : 'opacity-30'}`} />
              </button>
            ))}
            {!ai.isActive && (
              <p className="text-xs text-center text-gray-400 py-2">
                Connect an AI via <strong className="text-violet-600">AI Setup</strong> to enable these tools.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Chat input */}
      {activeTab === 'Chat' && (
        <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={ai.isActive ? 'Ask your AI Producer anything… (Enter to send)' : 'Connect an AI model to start chatting…'}
              rows={2}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none leading-snug" />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
