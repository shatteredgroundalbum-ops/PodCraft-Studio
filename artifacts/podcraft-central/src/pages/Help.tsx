import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { LifeBuoyIcon, SearchIcon, BookOpenIcon, MessageCircleIcon, MailIcon, ExternalLinkIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

const FAQS = [
  { q: 'How do I start recording in the Studio?', a: 'Go to the Studio page, click "Audio Setup" to select your microphone, then click the Record button. Your recording will be saved automatically to the Media Library.' },
  { q: 'Where is my data stored?', a: 'All data in PodCraft Central is stored locally in your browser using IndexedDB. Nothing is sent to external servers. Your data stays on your device.' },
  { q: 'How do I create a new episode?', a: 'Go to Projects, click on a project, then switch to the Episodes tab and click "New Episode". You can then record audio for that episode in the Studio.' },
  { q: 'Can I export my recordings?', a: 'Yes! After recording in the Studio, click the Download button to save the audio file. You can also find all your files in the Media Library.' },
  { q: 'How do I invite team members?', a: 'Go to the Team page and click "Invite Member". Enter their name and email, assign a role, and they will be added to your team.' },
  { q: 'How does mastering work?', a: 'After recording, the Studio will automatically switch to Mastering mode. Select a style (Natural, Broadcast, Warm, Clear, or Radio) and click "Start Mastering" to process your audio.' },
];

export function Help() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQS.filter((f) =>
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Help & Support">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
          <LifeBuoyIcon className="w-12 h-12 mx-auto mb-4 text-violet-100" />
          <h1 className="text-2xl font-bold mb-2">How can we help?</h1>
          <p className="text-violet-100 mb-6">Find answers, guides, and support for PodCraft Central.</p>
          <div className="relative max-w-md mx-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search for help..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: BookOpenIcon, title: 'Knowledge Base', desc: 'Browse guides and documentation.' },
            { icon: MessageCircleIcon, title: 'Community', desc: 'Join the podcast creator community.' },
            { icon: MailIcon, title: 'Contact Support', desc: 'Get help from our support team.' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center text-center hover:border-violet-300 hover:shadow-sm transition-all cursor-pointer">
              <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No results for &ldquo;{searchQuery}&rdquo;</div>
            ) : filteredFaqs.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-900">{faq.q}</span>
                  {expandedFaq === i ? <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {expandedFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
