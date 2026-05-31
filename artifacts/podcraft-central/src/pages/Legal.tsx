import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import { ScaleIcon, ShieldIcon, FileTextIcon, ArrowLeftIcon, ChevronRightIcon } from 'lucide-react';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, COOKIE_POLICY } from '../data/legalContent';

const DOCUMENTS = [
  { id: 'terms', title: 'Terms of Service', icon: FileTextIcon, updated: 'May 1, 2026', content: TERMS_OF_SERVICE },
  { id: 'privacy', title: 'Privacy Policy', icon: ShieldIcon, updated: 'May 1, 2026', content: PRIVACY_POLICY },
  { id: 'cookies', title: 'Cookie Policy', icon: FileTextIcon, updated: 'May 1, 2026', content: COOKIE_POLICY },
];

function renderContent(content: string) {
  return content.trim().split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
      return <p key={i} className="font-bold text-gray-900 mt-4 first:mt-0">{trimmed.slice(2, -2)}</p>;
    }
    if (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 2) {
      return <p key={i} className="text-gray-500 italic text-sm">{trimmed.slice(1, -1)}</p>;
    }
    if (trimmed.startsWith('- ')) return <li key={i} className="ml-4 list-disc leading-relaxed">{trimmed.slice(2)}</li>;
    if (trimmed === '') return <br key={i} />;
    return <p key={i} className="leading-relaxed">{line}</p>;
  });
}

function DocumentList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <ScaleIcon className="w-6 h-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">Legal &amp; Policies</h1>
      </div>
      <p className="text-gray-500">Review our terms, policies, and legal documents.</p>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {DOCUMENTS.map((doc) => (
          <Link key={doc.id} to={`/legal/${doc.id}`}
            className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 transition-colors group">
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <doc.icon className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{doc.title}</p>
              <p className="text-xs text-gray-400">Last updated: {doc.updated}</p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-violet-600" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const doc = DOCUMENTS.find((d) => d.id === id);
  if (!doc) return <Navigate to="/legal" replace />;

  return (
    <div className="max-w-2xl">
      <Link to="/legal" className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 text-sm font-medium mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Legal Documents
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
            <doc.icon className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{doc.title}</h1>
            <p className="text-xs text-gray-400">Last updated: {doc.updated}</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 space-y-2">
          {renderContent(doc.content)}
        </div>
      </div>
    </div>
  );
}

export function Legal() {
  return (
    <AppLayout title="Legal">
      <Routes>
        <Route index element={<DocumentList />} />
        <Route path=":id" element={<DocumentView />} />
      </Routes>
    </AppLayout>
  );
}
