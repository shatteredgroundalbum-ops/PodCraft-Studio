import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore, Project, Episode } from '../store/MediaStore';
import {
  FolderIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon, PencilIcon,
  Trash2Icon, MicIcon, CalendarIcon, ClockIcon, SaveIcon,
  AudioLinesIcon, Settings2Icon, MusicIcon, FileIcon, UploadIcon,
  RadioIcon, XIcon,
} from 'lucide-react';

export function Projects() {
  const { projects, episodes, createProject, updateProject, deleteProject, createEpisode, updateEpisode, deleteEpisode } = useMediaStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      setIsNewProjectModalOpen(true);
      navigate('/projects', { replace: true });
    }
  }, [location, navigate]);

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createProject({
      name: fd.get('name') as string,
      description: fd.get('description') as string || '',
      status: 'Planning',
      season: 'Season 1',
      duration: '00:00:00',
      lastSaved: new Date().toLocaleDateString(),
      microphone: 'Not set',
      audioInterface: 'Not set',
      sampleRate: '44.1 kHz',
      bitDepth: '16-bit',
      recordingNotes: '',
    });
    setIsNewProjectModalOpen(false);
  };

  return (
    <AppLayout title="Projects">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">Manage your podcast projects and episodes.</p>
        <button onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <PlusIcon className="w-4 h-4" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
            <FolderIcon className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h2>
          <p className="text-gray-500 text-sm max-w-sm mb-6">Create your first project to start organizing your podcast episodes, tasks, and media.</p>
          <button onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shadow-sm">
            <PlusIcon className="w-5 h-5" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              episodes={episodes.filter((e) => e.projectId === project.id)}
              isExpanded={expandedProjectId === project.id}
              onToggle={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}
              onUpdate={(updates) => updateProject(project.id, updates)}
              onDelete={() => deleteProject(project.id)}
              onCreateEpisode={(data) => createEpisode({ ...data, projectId: project.id })}
              onUpdateEpisode={updateEpisode}
              onDeleteEpisode={deleteEpisode}
            />
          ))}
        </div>
      )}

      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Create New Project</h3>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input name="name" required autoFocus type="text" placeholder="e.g. The Science Podcast"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={3} placeholder="What is this project about?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function ProjectCard({
  project, episodes, isExpanded, onToggle, onUpdate, onDelete, onCreateEpisode, onUpdateEpisode, onDeleteEpisode,
}: {
  project: Project; episodes: Episode[]; isExpanded: boolean; onToggle: () => void;
  onUpdate: (u: Partial<Project>) => void; onDelete: () => void;
  onCreateEpisode: (d: Omit<Episode, 'id' | 'projectId'>) => void;
  onUpdateEpisode: (id: string, u: Partial<Episode>) => void;
  onDeleteEpisode: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDesc, setEditDesc] = useState(project.description);
  const [activeTab, setActiveTab] = useState('Overview');

  const handleSave = () => { onUpdate({ name: editName, description: editDesc }); setIsEditing(false); };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50 border-b border-gray-200' : ''}`}
        onClick={onToggle}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FolderIcon className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{project.name}</h3>
            <p className="text-sm text-gray-500 truncate max-w-md">{project.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-500">{episodes.length} {episodes.length === 1 ? 'Episode' : 'Episodes'}</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">{project.status}</span>
            {isExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-400" /> : <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 bg-gray-50/50">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-6 relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                  className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this project?')) onDelete(); }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
              <div className="w-40 h-40 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MicIcon className="w-14 h-14 text-violet-300" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {isEditing ? (
                  <div className="space-y-3 mb-4 w-full max-w-md">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-md">Save</button>
                      <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-md">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.name}</h1>
                    <p className="text-sm text-gray-500 mb-4">{project.description || 'No description provided.'}</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-700 w-fit mb-4">{project.status}</span>
                  </>
                )}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  {[
                    { icon: FolderIcon, label: 'Project', value: project.name },
                    { icon: CalendarIcon, label: 'Season', value: project.season },
                    { icon: ClockIcon, label: 'Duration', value: project.duration },
                    { icon: SaveIcon, label: 'Last Saved', value: project.lastSaved },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-gray-500">
                      <item.icon className="w-4 h-4" />
                      <div>
                        <p className="text-xs mb-0.5">{item.label}</p>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[100px]">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200">
              <nav className="flex gap-8">
                {['Overview', 'Episodes', 'Studio Setup', 'Files', 'Tasks', 'Team'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'Overview' && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                Project overview and analytics will appear here once you start recording episodes.
              </div>
            )}

            {activeTab === 'Episodes' && (
              <EpisodesList episodes={episodes} onCreate={onCreateEpisode} onUpdate={onUpdateEpisode} onDelete={onDeleteEpisode} />
            )}

            {activeTab === 'Studio Setup' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Studio Setup</h3>
                    <p className="text-sm text-gray-500 mt-1">Configure your recording environment and settings.</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Settings2Icon className="w-4 h-4" /> Edit Setup
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: MicIcon, label: 'Microphone', value: project.microphone },
                    { icon: AudioLinesIcon, label: 'Audio Interface', value: project.audioInterface },
                    { icon: Settings2Icon, label: 'Sample Rate', value: project.sampleRate },
                    { icon: Settings2Icon, label: 'Bit Depth', value: project.bitDepth },
                  ].map((item) => (
                    <div key={item.label} className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600 flex-shrink-0">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                        <p className="text-sm font-medium text-gray-900">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Files' && (
              <div className="grid grid-cols-2 gap-6">
                {[
                  { title: 'Tracks', desc: 'Manage and organize your audio tracks.', icon: MusicIcon },
                  { title: 'Recent Files', desc: 'All files for this project will appear here.', icon: FileIcon },
                ].map((section) => (
                  <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{section.title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{section.desc}</p>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center text-violet-400 mb-4">
                        <section.icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">No {section.title.toLowerCase()} yet</h4>
                      <p className="text-sm text-gray-500 mb-4">Start recording in the Studio to add files.</p>
                      <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium flex items-center gap-2">
                        <UploadIcon className="w-4 h-4" /> Import File
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Tasks' && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                Tasks for this project will appear here. Go to the Tasks page to manage all tasks.
              </div>
            )}

            {activeTab === 'Team' && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                Team members for this project will appear here. Go to the Team page to manage your team.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EpisodesList({ episodes, onCreate, onUpdate, onDelete }: {
  episodes: Episode[];
  onCreate: (data: Omit<Episode, 'id' | 'projectId' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, u: Partial<Episode>) => void;
  onDelete: (id: string) => void;
}) {
  const [isNewEpisodeOpen, setIsNewEpisodeOpen] = useState(false);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onCreate({
      title: fd.get('title') as string,
      status: 'Planning',
      duration: '00:00:00',
      publishDate: fd.get('publishDate') as string || 'TBD',
    });
    setIsNewEpisodeOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Episodes</h3>
        <button onClick={() => setIsNewEpisodeOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 border border-violet-200 text-violet-700 bg-violet-50 rounded-lg text-sm font-medium hover:bg-violet-100 transition-colors">
          <PlusIcon className="w-4 h-4" /> New Episode
        </button>
      </div>

      {episodes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <RadioIcon className="w-6 h-6 text-violet-400" />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">No episodes yet</h4>
          <p className="text-sm text-gray-500 mb-4">Add your first episode to this project.</p>
          <button onClick={() => setIsNewEpisodeOpen(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
            Create Episode
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {episodes.map((ep) => (
            <div key={ep.id} className="flex items-center gap-4 p-4">
              <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <RadioIcon className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{ep.title}</p>
                <p className="text-xs text-gray-500">{ep.status} · {ep.publishDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">{ep.status}</span>
                <button onClick={() => { if (confirm('Delete this episode?')) onDelete(ep.id); }}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isNewEpisodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">New Episode</h3>
              <button onClick={() => setIsNewEpisodeOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Episode Title</label>
                <input name="title" required autoFocus type="text" placeholder="e.g. Episode 1: Introduction"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                <input name="publishDate" type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsNewEpisodeOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
