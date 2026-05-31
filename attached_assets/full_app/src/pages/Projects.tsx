import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore, Project, Episode } from '../store/MediaStore';
import {
  FolderIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
  MicIcon,
  CalendarIcon,
  ClockIcon,
  SaveIcon,
  CheckCircle2Icon,
  CircleIcon,
  AudioLinesIcon,
  Settings2Icon,
  MusicIcon,
  FileIcon,
  UploadIcon,
  SettingsIcon,
  MoreVerticalIcon } from
'lucide-react';
export function Projects() {
  const {
    projects,
    episodes,
    createProject,
    updateProject,
    deleteProject,
    createEpisode,
    updateEpisode,
    deleteEpisode
  } = useMediaStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    null
  );
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      setIsNewProjectModalOpen(true);
      // Clean up URL
      navigate('/projects', {
        replace: true
      });
    }
  }, [location, navigate]);
  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createProject({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      status: 'Planning',
      season: 'Season 1',
      duration: '00:00:00',
      lastSaved: new Date().toLocaleDateString(),
      microphone: 'Not set',
      audioInterface: 'Not set',
      sampleRate: '44.1 kHz',
      bitDepth: '16-bit',
      recordingNotes: ''
    });
    setIsNewProjectModalOpen(false);
  };
  return (
    <AppLayout title="Projects">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Manage your podcast projects and episodes.
        </p>
        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          
          <PlusIcon className="w-4 h-4" />
          New Project
        </button>
      </div>

      {projects.length === 0 ?
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
            <FolderIcon className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No projects yet
          </h2>
          <p className="text-gray-500 text-sm max-w-sm mb-6">
            Create your first project to start organizing your podcast episodes,
            tasks, and media.
          </p>
          <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shadow-sm">
          
            <PlusIcon className="w-5 h-5" />
            Create Project
          </button>
        </div> :

      <div className="space-y-4">
          {projects.map((project) =>
        <ProjectCard
          key={project.id}
          project={project}
          episodes={episodes.filter((e) => e.projectId === project.id)}
          isExpanded={expandedProjectId === project.id}
          onToggle={() =>
          setExpandedProjectId(
            expandedProjectId === project.id ? null : project.id
          )
          }
          onUpdate={(updates) => updateProject(project.id, updates)}
          onDelete={() => deleteProject(project.id)}
          onCreateEpisode={(data) =>
          createEpisode({
            ...data,
            projectId: project.id
          })
          }
          onUpdateEpisode={updateEpisode}
          onDeleteEpisode={deleteEpisode} />

        )}
        </div>
      }

      {isNewProjectModalOpen &&
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Create New Project
              </h3>
              <button
              onClick={() => setIsNewProjectModalOpen(false)}
              className="text-gray-400 hover:text-gray-600">
              
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                name="name"
                required
                autoFocus
                type="text"
                placeholder="e.g. The Science Podcast"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                name="description"
                rows={3}
                placeholder="What is this project about?"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              </textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                
                  Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </AppLayout>);

}
function ProjectCard({
  project,
  episodes,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onCreateEpisode,
  onUpdateEpisode,
  onDeleteEpisode










}: {project: Project;episodes: Episode[];isExpanded: boolean;onToggle: () => void;onUpdate: (updates: Partial<Project>) => void;onDelete: () => void;onCreateEpisode: (data: Omit<Episode, 'id' | 'projectId'>) => void;onUpdateEpisode: (id: string, updates: Partial<Episode>) => void;onDeleteEpisode: (id: string) => void;}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDesc, setEditDesc] = useState(project.description);
  const [activeTab, setActiveTab] = useState('Overview');
  const handleSaveEdit = () => {
    onUpdate({
      name: editName,
      description: editDesc
    });
    setIsEditing(false);
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200">
      {/* Collapsed Header */}
      <div
        className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50 border-b border-gray-200' : ''}`}
        onClick={onToggle}>
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FolderIcon className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500 truncate max-w-md">
              {project.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-500">
            {episodes.length} {episodes.length === 1 ? 'Episode' : 'Episodes'}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
              {project.status}
            </span>
            {isExpanded ?
            <ChevronDownIcon className="w-5 h-5 text-gray-400" /> :

            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            }
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded &&
      <div className="p-6 bg-gray-50/50">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Header Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-6 relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(!isEditing);
                  }}
                  className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                  
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                    confirm('Are you sure you want to delete this project?'))
                    {
                      onDelete();
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-48 h-48 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MicIcon className="w-16 h-16 text-violet-300" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  {isEditing ?
                <div className="space-y-3 mb-4 w-full max-w-md">
                      <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                      <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                      <div className="flex gap-2">
                        <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-md">
                      
                          Save
                        </button>
                        <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-md">
                      
                          Cancel
                        </button>
                      </div>
                    </div> :

                <>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">
                          {project.name}
                        </h1>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-sm text-gray-500">
                          {project.description || 'No description provided.'}
                        </h2>
                      </div>
                    </>
                }

                  <div className="mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-700">
                      Project Status
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500">
                      <FolderIcon className="w-4 h-4" />
                      <div>
                        <p className="text-xs mb-0.5">Project</p>
                        <p className="text-sm font-medium text-gray-900">
                          {project.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <CalendarIcon className="w-4 h-4" />
                      <div>
                        <p className="text-xs mb-0.5">Season</p>
                        <p className="text-sm font-medium text-gray-900">
                          {project.season}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <ClockIcon className="w-4 h-4" />
                      <div>
                        <p className="text-xs mb-0.5">Duration</p>
                        <p className="text-sm font-medium text-gray-900">
                          {project.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <SaveIcon className="w-4 h-4" />
                      <div>
                        <p className="text-xs mb-0.5">Last Saved</p>
                        <p className="text-sm font-medium text-gray-900">
                          {project.lastSaved}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-8">
                  {[
                'Overview',
                'Episodes',
                'Studio Setup',
                'Files',
                'Notes',
                'Tasks',
                'Team'].
                map((tab) =>
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  
                      {tab}
                    </button>
                )}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'Overview' &&
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center min-h-[200px] text-gray-500">
                  Project overview and analytics will appear here.
                </div>
            }

              {activeTab === 'Episodes' &&
            <EpisodesList
              episodes={episodes}
              onCreate={onCreateEpisode}
              onUpdate={onUpdateEpisode}
              onDelete={onDeleteEpisode} />

            }

              {activeTab === 'Studio Setup' &&
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Studio Setup
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Configure your recording environment and settings.
                      </p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings2Icon className="w-4 h-4" />
                      Edit Setup
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600">
                        <MicIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">
                          Microphone
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {project.microphone}
                        </p>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600">
                        <AudioLinesIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">
                          Audio Interface
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {project.audioInterface}
                        </p>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600">
                        <Settings2Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">
                          Sample Rate
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {project.sampleRate}
                        </p>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600">
                        <Settings2Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">
                          Bit Depth
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {project.bitDepth}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2">
                      Recording Notes
                    </p>
                    <p className="text-sm text-gray-900">
                      {project.recordingNotes || 'No notes added.'}
                    </p>
                  </div>
                </div>
            }

              {activeTab === 'Files' &&
            <div className="grid grid-cols-2 gap-6">
                  {/* Tracks */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Tracks
                    </h3>
                    <p className="text-sm text-gray-500 mb-8">
                      Manage and organize your audio tracks.
                    </p>

                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center text-violet-400 mb-4">
                        <MusicIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        No tracks yet
                      </h4>
                      <p className="text-sm text-gray-500 mb-6 max-w-[200px]">
                        Start recording or import audio to see your tracks here.
                      </p>
                      <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                        Add Track
                      </button>
                    </div>
                  </div>

                  {/* Recent Files */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Recent Files
                    </h3>
                    <p className="text-sm text-gray-500 mb-8">
                      All files for this project will appear here.
                    </p>

                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center text-violet-400 mb-4">
                        <FileIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        No files yet
                      </h4>
                      <p className="text-sm text-gray-500 mb-6 max-w-[250px]">
                        Your recorded and imported files will show up here.
                      </p>
                      <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                        Browse Files
                      </button>
                    </div>
                  </div>
                </div>
            }

              {['Notes', 'Tasks', 'Team'].includes(activeTab) &&
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center min-h-[200px] text-gray-500">
                  {activeTab} management coming soon.
                </div>
            }
            </div>

            {/* Right Sidebar */}
            <div className="w-80 flex-shrink-0 space-y-6">
              {/* Status */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-6">Status</h3>
                <div className="space-y-4">
                  {[
                {
                  num: 1,
                  label: 'Planning'
                },
                {
                  num: 2,
                  label: 'Pre-Production'
                },
                {
                  num: 3,
                  label: 'Production'
                },
                {
                  num: 4,
                  label: 'Post-Production'
                },
                {
                  num: 5,
                  label: 'Mastering'
                }].
                map((step) => {
                  const statusOrder = [
                  'Planning',
                  'Pre-Production',
                  'Production',
                  'Post-Production',
                  'Mastering'];

                  const currentIndex = statusOrder.indexOf(project.status);
                  const stepIndex = statusOrder.indexOf(step.label);
                  const isDone = stepIndex < currentIndex;
                  const isActive = stepIndex === currentIndex;
                  return (
                    <div
                      key={step.num}
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                      onUpdate({
                        status: step.label as any
                      })
                      }>
                      
                        <div className="flex items-center gap-3">
                          <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isDone ? 'bg-gray-100 text-gray-500' : isActive ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          
                            {step.num}
                          </div>
                          <span
                          className={`text-sm ${isActive ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          
                            {step.label}
                          </span>
                        </div>
                        {isDone ?
                      <CheckCircle2Icon className="w-5 h-5 text-violet-600" /> :

                      <CircleIcon className="w-5 h-5 text-gray-300" />
                      }
                      </div>);

                })}
                </div>
              </div>

              {/* Studio Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">
                  Studio Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <AudioLinesIcon className="w-4 h-4" />
                    Open DAW
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Start Recording
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    <UploadIcon className="w-4 h-4 text-gray-400" />
                    Import Audio
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    <SettingsIcon className="w-4 h-4 text-gray-400" />
                    Studio Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}
function EpisodesList({
  episodes,
  onCreate,
  onUpdate,
  onDelete





}: {episodes: Episode[];onCreate: (data: Omit<Episode, 'id' | 'projectId'>) => void;onUpdate: (id: string, updates: Partial<Episode>) => void;onDelete: (id: string) => void;}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreate({
      title: newTitle,
      status: 'Planning',
      duration: '00:00:00',
      publishDate: 'TBD'
    });
    setNewTitle('');
    setIsCreating(false);
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Episodes</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage episodes for this project.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-sm font-medium transition-colors">
          
          <PlusIcon className="w-4 h-4" />
          Add Episode
        </button>
      </div>

      {isCreating &&
      <form
        onSubmit={handleCreate}
        className="mb-6 p-4 border border-violet-100 bg-violet-50/30 rounded-lg flex gap-3">
        
          <input
          type="text"
          autoFocus
          placeholder="Episode title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        
          <button
          type="submit"
          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
          
            Save
          </button>
          <button
          type="button"
          onClick={() => setIsCreating(false)}
          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          
            Cancel
          </button>
        </form>
      }

      {episodes.length === 0 ?
      <div className="text-center py-8 text-gray-500 text-sm">
          No episodes created yet.
        </div> :

      <div className="border border-gray-100 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-5">Title</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-gray-100">
            {episodes.map((episode) =>
          <div
            key={episode.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors">
            
                <div className="col-span-5 font-medium text-gray-900 truncate">
                  {episode.title}
                </div>
                <div className="col-span-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                    {episode.status}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  {episode.duration}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                onClick={() => {
                  const newTitle = prompt('Edit title:', episode.title);
                  if (newTitle)
                  onUpdate(episode.id, {
                    title: newTitle
                  });
                }}
                className="p-1.5 text-gray-400 hover:text-violet-600 rounded transition-colors">
                
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                onClick={() => {
                  if (confirm('Delete this episode?')) onDelete(episode.id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors">
                
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
          )}
          </div>
        </div>
      }
    </div>);

}