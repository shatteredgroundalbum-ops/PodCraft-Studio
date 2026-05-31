import React from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import {
  FileTextIcon,
  ShieldIcon,
  CookieIcon,
  CopyrightIcon,
  ScaleIcon,
  SparklesIcon,
  ArrowRightIcon } from
'lucide-react';
const policies = [
{
  icon: FileTextIcon,
  title: 'Terms of Service',
  description: 'The terms that govern your use of Podify.',
  updated: 'Updated May 30, 2026',
  href: '/legal/terms',
  available: true
},
{
  icon: ShieldIcon,
  title: 'Privacy Policy',
  description: 'How we collect, use, and protect your personal data.',
  updated: 'Updated May 30, 2026',
  href: '/legal/privacy',
  available: true
},
{
  icon: CookieIcon,
  title: 'Cookie Policy',
  description: 'How and why we use cookies and similar technologies.',
  updated: 'Updated May 30, 2026',
  href: '/legal/cookies',
  available: true
},
{
  icon: CopyrightIcon,
  title: 'Acceptable Use Policy',
  description: 'Rules for content you create and share through Podify.',
  updated: 'Updated May 30, 2026',
  href: '/legal/acceptable-use',
  available: true
},
{
  icon: ScaleIcon,
  title: 'DMCA & Copyright',
  description: 'How to report copyright infringement on the platform.',
  updated: 'Updated May 30, 2026',
  href: '/legal/copyright',
  available: true
},
{
  icon: SparklesIcon,
  title: 'AI-Generated Content Policy',
  description:
  'Rules and responsibilities for external and internal AI-generated content.',
  updated: 'Updated May 30, 2026',
  href: '/legal/ai-content',
  available: true
}];

export function Legal() {
  return (
    <AppLayout title="Legal & Policies">
      <div className="mb-8">
        <p className="text-sm text-gray-500">
          Review the terms and policies that govern your use of Podify.
        </p>
      </div>

      <div className="max-w-3xl space-y-3">
        {policies.map((p) =>
        p.available ?
        <Link
          key={p.title}
          to={p.href}
          className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:border-violet-300 hover:shadow-sm transition-all group">
          
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                <p.icon className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">
                  {p.description}
                </p>
                <span className="text-xs text-gray-400">{p.updated}</span>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-violet-600 transition-transform group-hover:translate-x-0.5 mt-1" />
            </Link> :

        <div
          key={p.title}
          className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 opacity-60">
          
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <p.icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    Coming soon
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">
                  {p.description}
                </p>
                <span className="text-xs text-gray-400">{p.updated}</span>
              </div>
            </div>

        )}
      </div>

      <div className="mt-10 max-w-3xl bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-xs text-gray-500 leading-relaxed">
          If you have questions about our policies or need to make a legal
          request, contact{' '}
          <a
            href="mailto:legal@podify.com"
            className="text-violet-600 font-medium hover:text-violet-700">
            
            legal@podify.com
          </a>
          .
        </p>
      </div>
    </AppLayout>);

}