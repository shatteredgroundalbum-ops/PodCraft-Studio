import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore } from '../store/MediaStore';
import {
  SearchIcon, LayoutTemplateIcon, MicIcon, UsersIcon, BookOpenIcon,
  GraduationCapIcon, BriefcaseIcon, NewspaperIcon, FilmIcon, HeartPulseIcon,
  LaptopIcon, PlusIcon, SparklesIcon, PencilIcon, Trash2Icon, XIcon,
} from 'lucide-react';

const CATEGORIES = [
  { name: 'All Templates', icon: LayoutTemplateIcon },
  { name: 'Interview', icon: MicIcon },
  { name: 'Solo', icon: MicIcon },
  { name: 'Panel', icon: UsersIcon },
  { name: 'Storytelling', icon: BookOpenIcon },
  { name: 'Educational', icon: GraduationCapIcon },
  { name: 'Business', icon: BriefcaseIcon },
  { name: 'News', icon: NewspaperIcon },
  { name: 'Entertainment', icon: FilmIcon },
  { name: 'Health & Fitness', icon: HeartPulseIcon },
  { name: 'Tech', icon: LaptopIcon },
];

export function Templates() {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useMediaStore();
  const [activeCategory, setActiveCategory] = useState('All Templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = templates.filter((t) => {
    const matchesCategory = activeCategory === 'All Templates' || t.category === activeCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createTemplate({
      name: fd.get('name') as string,
      description: fd.get('description') as string || '',
      category: fd.get('category') as string || 'Solo',
      tags: ((fd.get('tags') as string) || '').split(',').map((t) => t.trim()).filter(Boolean),
      content: fd.get('content') as string || '',
    });
    setIsNewOpen(false);
  };

  const editing = editingId ? templates.find((t) => t.id === editingId) : null;

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    const fd = new FormData(e.currentTarget);
    updateTemplate(editingId, {
      name: fd.get('name') as string,
      description: fd.get('description') as string || '',
      category: fd.get('category') as string || 'Solo',
      tags: ((fd.get('tags') as string) || '').split(',').map((t) => t.trim()).filter(Boolean),
      content: fd.get('content') as string || '',
    });
    setEditingId(null);
  };

  return (
    <AppLayout title="Templates">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">Create and manage podcast production templates.</p>
        <button onClick={() => setIsNewOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium">
          <PlusIcon className="w-4 h-4" /> New Template
        </button>
      </div>

      <div className="flex gap-6">
        {/* Categories Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {CATEGORIES.map((cat) => {
              const count = templates.filter((t) => cat.name === 'All Templates' || t.category === cat.name).length;
              return (
                <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm border-l-2 transition-colors ${activeCategory === cat.name ? 'bg-violet-50 text-violet-700 border-l-violet-600 font-medium' : 'text-gray-700 border-l-transparent hover:bg-gray-50 hover:text-gray-900'}`}>
                  <div className="flex items-center gap-2.5">
                    <cat.icon className={`w-4 h-4 ${activeCategory === cat.name ? 'text-violet-600' : 'text-gray-400'}`} />
                    {cat.name}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === cat.name ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center min-h-[400px] text-center p-8">
              <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
                <LayoutTemplateIcon className="w-8 h-8 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No templates found</h2>
              <p className="text-gray-500 text-sm max-w-sm mb-6">
                {searchQuery ? 'Try adjusting your search or filter.' : 'Create your first template to speed up podcast production.'}
              </p>
              {!searchQuery && (
                <button onClick={() => setIsNewOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold">
                  <PlusIcon className="w-4 h-4" /> Create Template
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((tpl) => (
                <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-300 hover:shadow-sm transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <LayoutTemplateIcon className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingId(tpl.id)}
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this template?')) deleteTemplate(tpl.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{tpl.name}</h3>
                  <p className="text-sm text-gray-500 flex-1 mb-3">{tpl.description || 'No description.'}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">{tpl.category}</span>
                    <span className="text-xs text-gray-400">{new Date(tpl.createdAt).toLocaleDateString()}</span>
                  </div>
                  {tpl.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {tpl.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Template Modal */}
      {isNewOpen && (
        <TemplateModal title="New Template" onClose={() => setIsNewOpen(false)} onSubmit={handleCreate} />
      )}

      {/* Edit Template Modal */}
      {editingId && editing && (
        <TemplateModal title="Edit Template" onClose={() => setEditingId(null)} onSubmit={handleEdit} template={editing} />
      )}
    </AppLayout>
  );
}

function TemplateModal({ title, onClose, onSubmit, template }: {
  title: string; onClose: () => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  template?: { name: string; description: string; category: string; tags: string[]; content: string };
}) {
  const categories = ['Interview', 'Solo', 'Panel', 'Storytelling', 'Educational', 'Business', 'News', 'Entertainment', 'Health & Fitness', 'Tech'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input name="name" required autoFocus type="text" defaultValue={template?.name} placeholder="e.g. Interview with Expert"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows={2} defaultValue={template?.description} placeholder="What is this template for?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" defaultValue={template?.category || 'Solo'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input name="tags" type="text" defaultValue={template?.tags?.join(', ')} placeholder="intro, outro, interview"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content / Script Template</label>
            <textarea name="content" rows={5} defaultValue={template?.content} placeholder="Write your template content or script structure here..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">Save Template</button>
          </div>
        </form>
      </div>
    </div>
  );
}
