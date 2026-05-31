import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  FileTextIcon } from
'lucide-react';
import { getCategoryById } from '../data/knowledgeBaseCategories';
export function KnowledgeBaseCategory() {
  const { categoryId = '' } = useParams<{
    categoryId: string;
  }>();
  const category = getCategoryById(categoryId);
  if (!category) {
    return <Navigate to="/knowledge-base" replace />;
  }
  const Icon = category.icon;
  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link
          to="/knowledge-base"
          className="inline-flex items-center gap-1 hover:text-violet-700 font-medium">
          
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Knowledge Base
        </Link>
        <ChevronRightIcon className="w-3 h-3 text-gray-300" />
        <span className="text-gray-700">{category.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {category.title}
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl">
              {category.description}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap mt-2">
          {category.articles.length} articles
        </span>
      </div>

      {/* Content list */}
      {category.articles.length === 0 ?
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileTextIcon className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Articles coming soon
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            We're working on content for this category. Check back soon, or
            browse other categories from the Knowledge Base.
          </p>
        </div> :

      <ol className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {category.articles.map((article, i) => {
          const isComingSoon = article.comingSoon;
          const inner =
          <>
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-50 text-violet-700 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-violet-700">
                      {article.title}
                    </p>
                    {isComingSoon &&
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Coming soon
                      </span>
                }
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                    {article.description}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap mt-1">
                  {article.readTime}
                </span>
                <ArrowRightIcon
              className={`w-4 h-4 mt-1 transition-transform ${isComingSoon ? 'text-gray-200' : 'text-gray-300 group-hover:text-violet-600 group-hover:translate-x-0.5'}`} />
            
              </>;

          return (
            <li key={article.title}>
                {isComingSoon ?
              <div
                className="flex items-start gap-4 px-5 py-4 opacity-70 cursor-not-allowed"
                aria-disabled="true">
                
                    {inner}
                  </div> :

              <Link
                to={article.href}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                
                    {inner}
                  </Link>
              }
              </li>);

        })}
        </ol>
      }
    </AppLayout>);

}