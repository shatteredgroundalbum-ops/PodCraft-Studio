import React from 'react';
import { AppLayout } from '../components/AppLayout';
import {
  SearchIcon,
  FilterIcon,
  ChevronDownIcon,
  LayoutTemplateIcon,
  MicIcon,
  UsersIcon,
  Users2Icon,
  BookOpenIcon,
  GraduationCapIcon,
  BriefcaseIcon,
  NewspaperIcon,
  FilmIcon,
  HeartPulseIcon,
  ChurchIcon,
  LaptopIcon,
  PlusIcon,
  SparklesIcon } from
'lucide-react';
export function Templates() {
  const categories = [
  {
    name: 'All Templates',
    icon: LayoutTemplateIcon,
    count: 0,
    active: true
  },
  {
    name: 'Interview',
    icon: MicIcon,
    count: 0
  },
  {
    name: 'Solo',
    icon: MicIcon,
    count: 0
  },
  {
    name: 'Panel',
    icon: UsersIcon,
    count: 0
  },
  {
    name: 'Storytelling',
    icon: BookOpenIcon,
    count: 0
  },
  {
    name: 'Educational',
    icon: GraduationCapIcon,
    count: 0
  },
  {
    name: 'Business',
    icon: BriefcaseIcon,
    count: 0
  },
  {
    name: 'News',
    icon: NewspaperIcon,
    count: 0
  },
  {
    name: 'Entertainment',
    icon: FilmIcon,
    count: 0
  },
  {
    name: 'Health & Fitness',
    icon: HeartPulseIcon,
    count: 0
  },
  {
    name: 'Religion & Spirituality',
    icon: ChurchIcon,
    count: 0
  },
  {
    name: 'Technology',
    icon: LaptopIcon,
    count: 0
  }];

  return (
    <AppLayout title="Templates">
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Choose a template to quickly start your podcast project.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-2xl">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          
        </div>
        <div className="relative">
          <select className="appearance-none border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white min-w-[160px]">
            <option>All Categories</option>
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-white">
          <FilterIcon className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Categories Sidebar */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-4 px-2">Categories</h3>
          <div className="space-y-1">
            {categories.map((cat, i) =>
            <button
              key={i}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${cat.active ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              
                <div className="flex items-center gap-3">
                  <cat.icon
                  className={`w-4 h-4 ${cat.active ? 'text-violet-600' : 'text-gray-400'}`} />
                
                  {cat.name}
                </div>
                <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.active ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
                
                  {cat.count}
                </span>
              </button>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 px-2">
            <button className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1">
              View All Categories <ArrowUpRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content - Empty State */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center p-12 min-h-[600px]">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-violet-50 rounded-2xl flex items-center justify-center">
              <LayoutTemplateIcon className="w-16 h-16 text-violet-400" />
            </div>
            <div className="absolute -top-4 -right-4 text-violet-300">✨</div>
            <div className="absolute top-8 -left-6 text-violet-300">✨</div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            No templates available
          </h2>
          <p className="text-gray-500 text-center max-w-md mb-8">
            We're working on adding templates to help you get started quickly.
          </p>
          <button className="flex items-center gap-2 px-6 py-3 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg font-medium transition-colors">
            <PlusIcon className="w-5 h-5" />
            Create Custom Setup
          </button>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center text-violet-500">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">
              Can't find what you're looking for?
            </h3>
            <p className="text-sm text-gray-500">
              Create a custom setup from scratch or check back later for new
              templates.
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap">
          <Settings2Icon className="w-5 h-5" />
          Create Custom Setup
        </button>
      </div>
    </AppLayout>);

}
function ArrowUpRightIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>);

}
function Settings2Icon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>);

}