import React, { useEffect, useState, useRef } from 'react';
import {
  FileText, Download, Sparkles, Undo, Redo,
  ChevronDown, Check, Trash2, Clock,
} from 'lucide-react';

const DEFAULT_SCRIPT = `Episode Notes

Welcome to PodCraft Central — the complete podcast production workspace.

Start writing your script here. You can use AI Write to generate an outline,
import a .txt or .md file, and save named versions as you work.

Let's make something great.`;

interface Version {
  id: string;
  name: string;
  content: string;
  timestamp: number;
}

export function StudioScriptPanel({ height }: { height?: number }) {
  const [content, setContent] = useState(
    () => localStorage.getItem('podcraft_script') || DEFAULT_SCRIPT,
  );
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lastSaved, setLastSaved] = useState('just now');
  const [versions, setVersions] = useState<Version[]>(() => {
    const stored = localStorage.getItem('podcraft_versions');
    return stored ? JSON.parse(stored) : [];
  });
  const [versionsOpen, setVersionsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const versionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (versionsRef.current && !versionsRef.current.contains(e.target as Node))
        setVersionsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('podcraft_script', content);
      setLastSaved('just now');
    }, 5000);
    const timeInterval = setInterval(() => {
      setLastSaved((prev) => {
        if (prev === 'just now') return '1m ago';
        if (prev.endsWith('m ago')) return `${parseInt(prev) + 1}m ago`;
        return prev;
      });
    }, 60000);
    return () => { clearInterval(saveInterval); clearInterval(timeInterval); };
  }, [content]);

  useEffect(() => {
    localStorage.setItem('podcraft_versions', JSON.stringify(versions));
  }, [versions]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setContent(history[historyIndex - 1]); }
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setContent(history[historyIndex + 1]); }
  };
  const handleNew = () => {
    if (window.confirm('Clear current script?')) { setContent(''); setHistory(['']); setHistoryIndex(0); }
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setContent(text);
        setHistory([...history.slice(0, historyIndex + 1), text]);
        setHistoryIndex(historyIndex + 1);
      };
      reader.readAsText(file);
    }
  };
  const handleAIWrite = () => {
    const template = `\n\n[Outline]\n1. Introduction\n2. Main Topic\n3. Guest Interview\n4. Conclusion & Outro`;
    const newContent = content + template;
    setContent(newContent);
    setHistory([...history.slice(0, historyIndex + 1), newContent]);
    setHistoryIndex(historyIndex + 1);
  };
  const saveVersion = () => {
    const name = window.prompt('Version name:', `Version ${versions.length + 1}`);
    if (!name) return;
    setVersions([{ id: Math.random().toString(36).substr(2, 9), name, content, timestamp: Date.now() }, ...versions]);
  };
  const restoreVersion = (v: Version) => {
    if (window.confirm(`Restore "${v.name}"? Current script will be replaced.`)) {
      setContent(v.content);
      setHistory([...history, v.content]);
      setHistoryIndex(history.length);
      setVersionsOpen(false);
    }
  };

  const lines = content.split('\n');
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 flex flex-col flex-shrink-0 shadow-sm overflow-hidden"
      style={{ height }}>
      <div className="flex items-center justify-between p-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Script</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleNew} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200">
            <FileText className="w-4 h-4" /> New
          </button>
          <input type="file" accept=".txt,.md" className="hidden" ref={fileInputRef} onChange={handleImport} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200">
            <Download className="w-4 h-4 rotate-180" /> Import
          </button>
          <button onClick={handleAIWrite} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md shadow-sm">
            <Sparkles className="w-4 h-4" /> AI Write
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-50">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-50">
            <Redo className="w-4 h-4" />
          </button>
          <div className="relative ml-1" ref={versionsRef}>
            <button onClick={() => setVersionsOpen(!versionsOpen)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200">
              <Clock className="w-4 h-4" /> Versions <ChevronDown className="w-4 h-4" />
            </button>
            {versionsOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50">
                <button onClick={saveVersion} className="w-full text-left px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 flex items-center gap-2 border-b border-gray-100">
                  <Sparkles className="w-4 h-4" /> Save current as version
                </button>
                <div className="max-h-72 overflow-y-auto">
                  {versions.length === 0 ? (
                    <div className="px-4 py-6 text-xs text-gray-400 text-center">No saved versions yet</div>
                  ) : versions.map((v) => (
                    <div key={v.id} className="group px-3 py-2 hover:bg-gray-50 flex items-start justify-between gap-2">
                      <button onClick={() => restoreVersion(v)} className="flex-1 text-left">
                        <div className="text-sm font-medium text-gray-900 truncate">{v.name}</div>
                        <div className="text-[10px] text-gray-500">{new Date(v.timestamp).toLocaleString()}</div>
                      </button>
                      <button onClick={() => setVersions(versions.filter((x) => x.id !== v.id))} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-white min-h-0">
        <div className="w-12 flex-shrink-0 bg-gray-50 border-r border-gray-100 py-4 flex flex-col items-end pr-3 text-xs text-gray-400 font-mono select-none overflow-hidden">
          {lines.map((_, i) => <div key={i} className="leading-6 h-6">{i + 1}</div>)}
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          className="flex-1 p-4 resize-none focus:outline-none font-mono text-sm text-gray-800 leading-6 whitespace-pre overflow-auto"
          spellCheck={false} />
      </div>

      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50 flex-shrink-0">
        <div className="flex gap-4">
          <span>Words: {words}</span>
          <span>Characters: {content.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Saved {lastSaved}</span>
          <Check className="w-3.5 h-3.5 text-green-500" />
        </div>
      </div>
    </div>
  );
}
