import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import { ScaleIcon, ShieldIcon, FileTextIcon, ArrowLeftIcon, ChevronRightIcon } from 'lucide-react';

const DOCUMENTS = [
  {
    id: 'terms',
    title: 'Terms of Service',
    icon: FileTextIcon,
    updated: 'May 1, 2026',
    content: `
**Terms of Service — PodCraft Central**

*Effective date: May 1, 2026*

By using PodCraft Central ("the App"), you agree to the following terms and conditions.

**1. Description of Service**
PodCraft Central is a podcast production workspace application. The App operates entirely within your web browser, storing all data locally using IndexedDB. No user data is transmitted to external servers.

**2. Acceptable Use**
You agree to use PodCraft Central only for lawful purposes related to podcast production and related creative activities. You may not use the App to create, store, or distribute content that:
- Violates applicable laws or regulations
- Infringes on intellectual property rights of others
- Contains malicious code or viruses

**3. Data and Privacy**
All data you create in PodCraft Central — including account information, projects, tasks, recordings, and media — is stored exclusively in your browser's local storage. The App does not collect, transmit, or store your data on any external server.

**4. No Warranty**
PodCraft Central is provided "as is" without warranty of any kind, express or implied. We do not warrant that the App will be error-free or uninterrupted.

**5. Limitation of Liability**
To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.

**6. Changes**
We reserve the right to modify these terms at any time. Continued use of the App constitutes acceptance of updated terms.

**7. Contact**
For questions about these terms, please contact us through the Help & Support page.
    `,
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: ShieldIcon,
    updated: 'May 1, 2026',
    content: `
**Privacy Policy — PodCraft Central**

*Effective date: May 1, 2026*

PodCraft Central is designed with privacy as a core principle. This policy explains how your information is handled.

**1. Information We Collect**
PodCraft Central does not collect any personal information. All data you enter — including your account details, projects, recordings, and tasks — is stored locally in your browser's IndexedDB storage on your device.

**2. How Data Is Stored**
All data is stored in your browser's IndexedDB storage. This data:
- Never leaves your device unless you explicitly export it
- Is not accessible to us or any third party
- Can be deleted by clearing your browser's site data

**3. Microphone Access**
When you use the Studio, we request access to your microphone. This access is used solely for recording audio within the App. Audio data is stored locally and not transmitted anywhere.

**4. Cookies and Tracking**
PodCraft Central does not use cookies, tracking pixels, analytics services, or any form of user tracking.

**5. Third-Party Services**
PodCraft Central does not integrate with third-party data collection services. Any external links (e.g., to documentation) are provided for convenience and are governed by their own privacy policies.

**6. Data Deletion**
You can delete all your data at any time by clearing your browser's site data for this application. This action is irreversible.

**7. Children's Privacy**
PodCraft Central is not directed at children under 13. We do not knowingly collect information from children.

**8. Contact**
For privacy-related questions, contact us through the Help & Support page.
    `,
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    icon: FileTextIcon,
    updated: 'May 1, 2026',
    content: `
**Cookie Policy — PodCraft Central**

*Effective date: May 1, 2026*

**Overview**
PodCraft Central does not use cookies. Session information is stored in browser sessionStorage, which is automatically cleared when you close your browser tab.

**What We Use Instead**
- **sessionStorage**: Stores your login session temporarily
- **IndexedDB**: Stores your workspace data persistently

Neither of these are cookies in the traditional sense, and neither involves tracking or sharing data with third parties.

**Third-Party Cookies**
Any third-party resources (such as images from Unsplash) may set their own cookies. We have no control over these.
    `,
  },
];

function DocumentList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <ScaleIcon className="w-6 h-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">Legal & Policies</h1>
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
        <div className="text-sm text-gray-700 leading-relaxed space-y-3">
          {doc.content.trim().split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-gray-900">{line.slice(2, -2)}</p>;
            if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-gray-500 italic">{line.slice(1, -1)}</p>;
            if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
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
