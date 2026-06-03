import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles, MoreVertical, Send,
  PanelRightClose, PanelLeftClose, Trash2, Download,
  Settings, Key, Wifi, WifiOff, ChevronDown, ExternalLink,
  Loader2,
} from 'lucide-react';

type Tab = 'Chat' | 'Assistant' | 'Notes';
type Provider = 'openai' | 'anthropic' | 'ollama';

interface Message { role: 'system' | 'user' | 'assistant'; content: string; }
interface StudioAIPanelProps { width: number; collapsed: boolean; onToggleCollapsed: () => void; }

const SYSTEM_PROMPT =
  'You are an AI podcast producer assistant inside PodCraft Central. Help with show notes, episode titles, guest research, interview questions, scripting, production decisions, and audio quality tips. Be concise and actionable.';

export function StudioAIPanel({ width, collapsed, onToggleCollapsed }: StudioAIPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Chat');
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [notes, setNotes] = useState(() => localStorage.getItem('podcraft_notes') || '');
  const [messages, setMessages] = useState<Message[]>(() => {
    try { const s = localStorage.getItem('podcraft_chat'); if (s) return JSON.parse(s); } catch { /* ok */ }
    return [{ role: 'system', content: 'AI Producer not connected. Click ⚙ to add your API key or configure Ollama.' }];
  });

  // Provider config
  const [provider, setProvider] = useState<Provider>(() => (localStorage.getItem('podcraft_ai_provider') as Provider) || 'openai');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('podcraft_ai_key') || '');
  const [ollamaModel, setOllamaModel] = useState(() => localStorage.getItem('podcraft_ollama_model') || 'llama3.2');
  const [ollamaUrl, setOllamaUrl] = useState(() => localStorage.getItem('podcraft_ollama_url') || 'http://localhost:11434');

  const isConnected = provider === 'ollama' || apiKey.length > 8;

  useEffect(() => { localStorage.setItem('podcraft_notes', notes); }, [notes]);
  useEffect(() => { localStorage.setItem('podcraft_chat', JSON.stringify(messages.slice(-60))); }, [messages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const saveConfig = () => {
    localStorage.setItem('podcraft_ai_provider', provider);
    localStorage.setItem('podcraft_ai_key', apiKey);
    localStorage.setItem('podcraft_ollama_model', ollamaModel);
    localStorage.setItem('podcraft_ollama_url', ollamaUrl);
    setSetupOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const history = [...messages.filter((m) => m.role !== 'system'), userMsg];
    setMessages((prev) => [...prev.filter((m) => m.role !== 'system'), userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let reply = '';

      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
          }),
        });
        const data = await res.json();
        reply = data.choices?.[0]?.message?.content ?? data.error?.message ?? 'No response';

      } else if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: history,
          }),
        });
        const data = await res.json();
        reply = data.content?.[0]?.text ?? data.error?.message ?? 'No response';

      } else {
        // Ollama
        const res = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            stream: false,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
          }),
        });
        const data = await res.json();
        reply = data.message?.content ?? data.error ?? 'No response';
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err instanceof Error ? err.message : 'Connection failed. Check your provider settings.'}`,
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
    const text = messages.filter((m) => m.role !== 'system')
      .map((m) => `[${m.role.toUpperCase()}]\n${m.content}\n`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `ai-chat-${Date.now()}.txt`;
    a.click();
    setMenuOpen(false);
  };

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

  return (
    <div className="bg-white border-l border-gray-200 flex flex-col flex-shrink-0" style={{ width }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <span className="font-semibold text-gray-900 text-sm">AI Producer</span>
          <div className={`flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isConnected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            {isConnected ? provider.toUpperCase() : 'OFFLINE'}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <button onClick={() => setSetupOpen(!setupOpen)} title="AI Settings" className="hover:text-violet-600 p-1 rounded hover:bg-violet-50">
            <Settings className="w-4 h-4" />
          </button>
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

      {/* Setup panel */}
      {setupOpen && (
        <div className="border-b border-gray-100 bg-gray-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-700">AI Provider</p>

          <div className="flex gap-1">
            {(['openai', 'anthropic', 'ollama'] as Provider[]).map((p) => (
              <button key={p} onClick={() => setProvider(p)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${provider === p ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}>
                {p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : 'Ollama'}
              </button>
            ))}
          </div>

          {provider !== 'ollama' ? (
            <div className="space-y-2">
              <label className="text-xs text-gray-500 flex items-center gap-1"><Key className="w-3 h-3" /> API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono" />
              <a href={provider === 'openai' ? 'https://platform.openai.com/api-keys' : 'https://console.anthropic.com/'}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-violet-600 hover:underline">
                Get your {provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 text-xs text-blue-800 space-y-1">
                <p className="font-semibold">Run a local AI model — no API key needed</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Download &amp; install Ollama</li>
                  <li>Run: <code className="bg-blue-100 px-1 rounded">ollama pull {ollamaModel}</code></li>
                  <li>Run: <code className="bg-blue-100 px-1 rounded">OLLAMA_ORIGINS=* ollama serve</code></li>
                </ol>
                <a href="https://ollama.com/download" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-1 font-semibold text-blue-700 hover:underline">
                  <Download className="w-3 h-3" /> Download Ollama <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <label className="text-xs text-gray-500">Ollama URL</label>
              <input value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono" />
              <label className="text-xs text-gray-500">Model</label>
              <input value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="llama3.2"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono" />
            </div>
          )}

          <button onClick={saveConfig}
            className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Save &amp; Connect
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex px-4 border-b border-gray-100 flex-shrink-0">
        {(['Chat', 'Assistant', 'Notes'] as Tab[]).map((tab) => (
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
              <p className="text-xs text-gray-400 text-center py-4">Start a conversation with your AI Producer.</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'system' ? (
                  <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-200 w-full text-center">{msg.content}</div>
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
            onChange={(e) => setNotes(e.target.value)}
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
            ].map((tool) => (
              <button
                key={tool.label}
                disabled={!isConnected}
                onClick={() => { setInput(tool.prompt); setActiveTab('Chat'); }}
                className={`w-full text-left p-3 bg-white border rounded-lg text-sm font-medium flex items-center justify-between gap-2 transition-colors ${isConnected ? 'border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50 cursor-pointer' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>
                {tool.label}
                <Sparkles className={`w-4 h-4 shrink-0 ${isConnected ? 'text-violet-400' : 'opacity-30'}`} />
              </button>
            ))}
            {!isConnected && (
              <button onClick={() => setSetupOpen(true)}
                className="w-full mt-2 py-2 border-2 border-dashed border-violet-300 rounded-lg text-sm font-medium text-violet-600 hover:bg-violet-50 flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" /> Connect AI Provider
              </button>
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask your AI Producer anything… (Enter to send)"
              rows={2}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none leading-snug" />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {!isConnected && (
            <button onClick={() => setSetupOpen(true)}
              className="mt-2 w-full text-xs text-violet-600 hover:underline flex items-center justify-center gap-1">
              <Settings className="w-3 h-3" /> Connect an AI provider to enable replies
            </button>
          )}
        </div>
      )}
    </div>
  );
}
