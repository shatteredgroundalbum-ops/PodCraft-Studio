import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Routes, Route, Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { BookOpenIcon, SearchIcon, ChevronRightIcon, MicIcon, AudioLinesIcon, FolderIcon, CheckCircleIcon, UsersIcon, BarChart3Icon, ArrowLeftIcon } from 'lucide-react';

const ARTICLES = [
  {
    id: 'getting-started',
    title: 'Getting Started with PodCraft Central',
    category: 'Basics',
    readTime: '3 min',
    content: `
# Getting Started

Welcome to PodCraft Central — your complete podcast production workspace.

## Step 1: Create your account
Sign up with your name, email, and a secure password. All your data is stored locally.

## Step 2: Create your first project
Click "New Project" in the sidebar or on the Dashboard. Give it a name and description.

## Step 3: Add episodes
Inside your project, go to the Episodes tab and click "New Episode" to add your first episode.

## Step 4: Open the Studio
Click "Studio" in the sidebar. Set up your microphone and start recording!

## Step 5: Manage your workflow
Use Tasks to track production steps, Templates for reusable scripts, and Analytics for performance.
    `,
  },
  {
    id: 'recording-guide',
    title: 'Recording in the Studio',
    category: 'Studio',
    readTime: '5 min',
    content: `
# Recording in the Studio

The Studio is your professional recording environment built on the Web Audio API and MediaRecorder.

## Setting up your microphone
1. Click "Audio Setup" in the Studio header
2. Select your microphone from the dropdown
3. Allow microphone access when prompted by your browser
4. Click "Continue" to confirm your setup

## Starting a recording
1. Select an episode from the Episode dropdown
2. Write or paste your script in the Script panel
3. Click the red Record button to begin
4. Speak clearly into your microphone
5. Watch the input level meter to ensure a good signal

## Stopping and saving
1. Click the Stop button when done
2. Your recording is automatically saved to the Media Library
3. The Studio switches to Mastering mode

## Tips for quality audio
- Use headphones to avoid echo
- Record in a quiet room with soft surfaces
- Keep microphone 6–8 inches from your mouth
- Avoid plosives (p, b sounds) by angling slightly off-axis
    `,
  },
  {
    id: 'mastering-guide',
    title: 'Mastering Your Podcast Audio',
    category: 'Studio',
    readTime: '4 min',
    content: `
# Mastering Your Audio

After recording, PodCraft Central can apply professional mastering to make your audio broadcast-ready.

## Mastering Styles

**Natural** — Subtle enhancement that preserves your original dynamics. Great for spoken word and intimate formats.

**Broadcast** — Loud, punchy, and consistent. The standard for most modern podcasts.

**Warm** — Enhanced low-end for a rich, intimate sound. Perfect for storytelling formats.

**Clear** — Crisp highs and improved clarity. Ideal for interviews and dialogue-heavy content.

**Radio** — Heavy compression with classic radio energy. Best for entertainment and personality-driven shows.

## How to master
1. After recording, you'll be in Mastering mode
2. Select your preferred mastering style
3. Click "Start Mastering"
4. Wait for processing to complete (~10 seconds)
5. Your mastered file is saved to the Media Library automatically

## Downloading your master
Click the Download button after mastering to save the file to your device.
    `,
  },
  {
    id: 'project-management',
    title: 'Managing Projects & Episodes',
    category: 'Projects',
    readTime: '4 min',
    content: `
# Managing Projects & Episodes

PodCraft Central organizes your work into Projects and Episodes.

## Projects
A project represents your podcast show. Each project can have:
- Multiple seasons and episodes
- Studio setup configurations
- Associated tasks and team members
- Media files and templates

## Creating a project
1. Click "New Project" in the sidebar
2. Enter a name and description
3. Click "Create Project"

## Episodes
An episode is a single installment of your podcast. Each episode has:
- Title and status
- Publish date
- Associated recordings

## Episode workflow
1. **Planning** — Script and research
2. **Recording** — Studio session
3. **Editing** — Post-production
4. **Publishing** — Distribution

## Project Status
Track your project through: Planning → Pre-Production → Production → Post-Production → Mastering
    `,
  },
  {
    id: 'tasks-guide',
    title: 'Using Tasks for Production Workflow',
    category: 'Tasks',
    readTime: '3 min',
    content: `
# Using Tasks

Tasks help you track every step of podcast production.

## Creating tasks
1. Go to the Tasks page
2. Click "New Task"
3. Fill in the name, description, project, priority, and due date

## Task properties
- **Status**: To Do → In Progress → In Review → Completed
- **Priority**: Low, Medium, High, Urgent
- **Checklist**: Break tasks into sub-steps
- **Comments**: Leave notes and updates
- **Activity**: Full audit trail of changes

## Prioritizing work
Use Urgent for blockers, High for this week's work, Medium for regular tasks, and Low for backlog items.

## Best practices
- Create tasks for each episode's production steps
- Use the Checklist feature for recurring checklists
- Add comments to document decisions
- Review the Activity log to track progress
    `,
  },
];

function ArticleList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = ARTICLES.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(ARTICLES.map((a) => a.category))];

  return (
    <div className="space-y-6">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" />
      </div>

      {categories.map((cat) => {
        const catArticles = filtered.filter((a) => a.category === cat);
        if (catArticles.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat}</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {catArticles.map((article) => (
                <button key={article.id} onClick={() => navigate(`/knowledge-base/${article.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors group">
                  <BookOpenIcon className="w-5 h-5 text-violet-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{article.title}</p>
                    <p className="text-xs text-gray-400">{article.readTime} read</p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-violet-600" />
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <SearchIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No articles found for &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

function ArticleView() {
  const { id } = useParams<{ id: string }>();
  const article = ARTICLES.find((a) => a.id === id);

  if (!article) return <Navigate to="/knowledge-base" replace />;

  return (
    <div className="max-w-2xl">
      <Link to="/knowledge-base" className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 text-sm font-medium mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Knowledge Base
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">{article.category}</span>
          <span className="text-xs text-gray-400">{article.readTime} read</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{article.title}</h1>
        <div className="prose prose-sm prose-violet max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
          {article.content.trim().split('\n').map((line, i) => {
            if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-2">{line.slice(3)}</h2>;
            if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-gray-900 mt-4 mb-3">{line.slice(2)}</h1>;
            if (line.startsWith('**') && line.endsWith('**')) {
              const text = line.slice(2, -2);
              const parts = text.split(' — ');
              return <p key={i} className="mb-1"><strong>{parts[0]}</strong>{parts[1] ? ` — ${parts[1]}` : ''}</p>;
            }
            if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc mb-0.5 text-sm">{line.slice(2)}</li>;
            if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 list-decimal mb-0.5 text-sm">{line.replace(/^\d+\. /, '')}</li>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="mb-2 text-sm">{line}</p>;
          })}
        </div>
      </div>
    </div>
  );
}

export function KnowledgeBase() {
  return (
    <AppLayout title="Knowledge Base">
      <Routes>
        <Route index element={<ArticleList />} />
        <Route path=":id" element={<ArticleView />} />
      </Routes>
    </AppLayout>
  );
}
