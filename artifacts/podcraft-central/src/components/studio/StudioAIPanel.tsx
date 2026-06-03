import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles, MoreVertical, Send,
  PanelRightClose, PanelLeftClose, Trash2, Download,
} from 'lucide-react';

type Tab = 'Chat' | 'Assistant' | 'Notes';
interface Message { role: 'system' | 'user' | 'assistant'; content: string; }

interface StudioAIPanelProps {
  width: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function StudioAIPanel({ width, collapsed, onToggleCollapsed }: StudioAIPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Chat');
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState(() => localStorage.getItem('podcraft_notes') || '');
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem('podcraft_chat');
    if (stored) { try { return JSON.parse(stored); } catch { /* ignore */ } }
    return [{ role: 'system', content: 'AI Producer is not connected. Connect an AI provider in Settings → AI Configuration to enable replies.' }];
  });

  useEffect(() => { localStorage.setItem('podcraft_notes', notes); }, [notes]);
  useEffect(() => { localStorage.setItem('podcraft_chat', JSON.stringify(messages)); }, [messages]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
  };
  const clearChat = () => {
    if (window.confirm('Clear all chat messages?')) {
      setMessages([{ role: 'system', content: 'Chat cleared. Connect an AI provider to start a conversation.' }]);
    }
    setMenuOpen(false);
  };
  const exportChat = () => {
    const text = messages.filter((m) => m.role !== 'system').map((m) => `[${m.role.toUpperCase()}]\n${m.content}\n`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `chat-${Date.now()}.txt`;
    a.click();
    setMenuOpen(false);
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapsed}
        className="w-10 bg-white border-l border-gray-200 flex flex-col items-center justify-start py-4 gap-3 hover:bg-gray-50 transition-colors flex-shrink-0">
        <PanelLeftClose className="w-5 h-5 text-violet-600" />
        <div className="rotate-90 origin-center mt-12 flex items-center gap-2 whitespace-nowrap">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-semibold text-gray-700">AI Producer</span>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white border-l border-gray-200 flex flex-col flex-shrink-0 shadow-sm" style={{ width }}>
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h2 className="font-semibold text-gray-900">AI Producer</h2>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <button onClick={onToggleCollapsed} title="Collapse panel" className="hover:text-gray-600">
            <PanelRightClose className="w-4 h-4" />
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="hover:text-gray-600">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                <button onClick={clearChat} className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 text-left">
                  <Trash2 className="w-4 h-4" /> Clear chat
                </button>
                <button onClick={exportChat} className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 text-left">
                  <Download className="w-4 h-4" /> Export as .txt
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex px-4 border-b border-gray-100 flex-shrink-0">
        {(['Chat', 'Assistant', 'Notes'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 min-h-0">
        {activeTab === 'Chat' && (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'system' ? (
                  <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-200 w-full text-center">{msg.content}</div>
                ) : (
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'}`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {activeTab === 'Notes' && (
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Jot down ideas, timestamps, or reminders here..."
            className="w-full h-full bg-transparent resize-none focus:outline-none text-sm text-gray-700" />
        )}
        {activeTab === 'Assistant' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tools</h3>
            {['Generate Show Notes', 'Suggest Titles', 'Transcribe Audio', 'Extract Highlights'].map((tool) => (
              <button key={tool} disabled className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed flex items-center justify-between group relative">
                {tool}
                <Sparkles className="w-4 h-4 opacity-50" />
                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                  Requires AI provider
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'Chat' && (
        <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="relative flex items-center">
            <input
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all" />
            <button onClick={handleSend} className="absolute right-2 p-2 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-1.5 justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[10px] text-gray-500">AI Producer offline — connect a provider in Settings.</span>
          </div>
        </div>
      )}
    </div>
  );
}
