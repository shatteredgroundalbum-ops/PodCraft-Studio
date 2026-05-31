import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import {
  SearchIcon,
  BookOpenIcon,
  FileTextIcon,
  ArrowRightIcon } from
'lucide-react';
import { knowledgeBaseCategories } from '../data/knowledgeBaseCategories';
const popularArticles = [
{
  title: 'Welcome to Podify',
  href: '/knowledge-base/welcome'
},
{
  title: 'Creating your first project',
  href: '/knowledge-base/create-your-first-project'
},
{
  title: 'Creating your first episode',
  href: '/knowledge-base/create-your-first-episode'
},
{
  title: 'Navigating Podify',
  href: '/knowledge-base/navigating-podify'
},
{
  title: 'Setting up your workspace',
  href: '/knowledge-base/setting-up-your-workspace'
},
{
  title: 'Your first recording session',
  href: '/knowledge-base/completing-your-first-recording'
},
{
  title: 'Reviewing, mastering, exporting, and publishing',
  href: '/knowledge-base/mastering-exporting-and-publishing'
},
{
  title: 'Recording & Studio',
  href: '/knowledge-base/studio-overview'
},
{
  title: 'Connecting a USB microphone',
  href: '/knowledge-base/connecting-a-usb-microphone'
},
{
  title: 'Connecting an audio interface',
  href: '/knowledge-base/connecting-an-audio-interface'
},
{
  title: 'Device detection and troubleshooting',
  href: '/knowledge-base/device-detection-and-troubleshooting'
}];

export function KnowledgeBase() {
  const [query, setQuery] = useState('');
  return (
    <AppLayout title="Knowledge Base">
      <div className="mb-8">
        <p className="text-sm text-gray-500">
          Guides, tutorials, and answers to help you get the most out of Podify.
        </p>
      </div>

      {/* Search hero */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-10 text-white mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-24 -mb-24 blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3 text-violet-100">
            <BookOpenIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Podify Knowledge Base</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">
            How can we help you today?
          </h1>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search articles, guides, and tutorials..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-base bg-white focus:outline-none focus:ring-4 focus:ring-white/30" />
            
          </div>
        </div>
      </div>

      {/* Categories */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          Browse by category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {knowledgeBaseCategories.map((cat) =>
          <Link
            key={cat.id}
            to={`/knowledge-base/category/${cat.id}`}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-300 hover:shadow-sm transition-all group">
            
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center mb-4">
                <cat.icon className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{cat.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                {cat.description}
              </p>
              <span className="text-xs font-medium text-violet-600 group-hover:text-violet-700 inline-flex items-center gap-1">
                {cat.articles.length} articles
                <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Popular */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-4">
          Popular articles
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {popularArticles.map((article, i) =>
          <Link
            key={i}
            to={article.href}
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
            
              <div className="flex items-center gap-3">
                <FileTextIcon className="w-4 h-4 text-gray-400 group-hover:text-violet-600" />
                <span className="text-sm font-medium text-gray-900">
                  {article.title}
                </span>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-violet-600 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </section>
    </AppLayout>);

}