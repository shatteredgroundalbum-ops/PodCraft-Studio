import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { dbGetAll, dbPut, dbDelete } from './db';

export type ProjectStatus = 'Planning' | 'Pre-Production' | 'Production' | 'Post-Production' | 'Mastering';

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  season: string;
  duration: string;
  lastSaved: string;
  microphone: string;
  audioInterface: string;
  sampleRate: string;
  bitDepth: string;
  recordingNotes: string;
  tracks: unknown[];
  episodes: string[];
};

export type Episode = {
  id: string;
  projectId: string;
  title: string;
  status: ProjectStatus;
  duration: string;
  publishDate: string;
};

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskChecklistItem = { id: string; text: string; done: boolean };
export type TaskAttachment = { id: string; name: string; size: string };
export type TaskComment = { id: string; author: string; text: string; createdAt: string };
export type TaskActivity = { id: string; text: string; createdAt: string };

export type Task = {
  id: string;
  name: string;
  description: string;
  projectId: string;
  assignedTo: string;
  dueDate: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: string;
  tags: string[];
  estimatedTime: string;
  checklist: TaskChecklistItem[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  activity: TaskActivity[];
};

export type AssetCategory = 'studio' | 'audio' | 'music' | 'sfx' | 'images' | 'videos' | 'documents';
export type AssetSource = 'recording' | 'mixdown' | 'master' | 'project' | 'export' | 'upload';

export type MediaAsset = {
  id: string;
  name: string;
  category: AssetCategory;
  source: AssetSource;
  size: number;
  type: string;
  duration?: string;
  createdAt: string;
  addedBy: string;
  tags: string[];
  description: string;
  url?: string;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
  content: string;
};

type MediaStoreContextType = {
  projects: Project[];
  episodes: Episode[];
  tasks: Task[];
  mediaAssets: MediaAsset[];
  templates: Template[];
  isLoaded: boolean;
  createProject: (project: Omit<Project, 'id' | 'tracks' | 'episodes'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createEpisode: (episode: Omit<Episode, 'id'>) => void;
  updateEpisode: (id: string, updates: Partial<Episode>) => void;
  deleteEpisode: (id: string) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'checklist' | 'attachments' | 'comments' | 'activity'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addChecklistItem: (taskId: string, text: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  addComment: (taskId: string, author: string, text: string) => void;
  addAttachment: (taskId: string, attachment: Omit<TaskAttachment, 'id'>) => void;
  logActivity: (taskId: string, text: string) => void;
  addAsset: (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => void;
  removeAsset: (id: string) => void;
  getAssetsByCategory: (category: AssetCategory) => MediaAsset[];
  getStorageStats: () => { totalSize: number; totalFiles: number };
  createTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
};

const MediaStoreContext = createContext<MediaStoreContextType | undefined>(undefined);

export function MediaStoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      dbGetAll<Project>('projects'),
      dbGetAll<Episode>('episodes'),
      dbGetAll<Task>('tasks'),
      dbGetAll<MediaAsset>('mediaAssets'),
      dbGetAll<Template>('templates'),
    ]).then(([p, e, t, m, tpl]) => {
      setProjects(p);
      setEpisodes(e);
      setTasks(t);
      setMediaAssets(m);
      setTemplates(tpl);
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, []);

  const createProject = (project: Omit<Project, 'id' | 'tracks' | 'episodes'>) => {
    const newProject: Project = { ...project, id: `proj_${Date.now()}`, tracks: [], episodes: [] };
    setProjects((prev) => [...prev, newProject]);
    dbPut('projects', newProject);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) => {
      const next = prev.map((p) => p.id === id ? { ...p, ...updates } : p);
      const updated = next.find((p) => p.id === id);
      if (updated) dbPut('projects', updated);
      return next;
    });
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setEpisodes((prev) => { const toDelete = prev.filter((e) => e.projectId === id); toDelete.forEach((e) => dbDelete('episodes', e.id)); return prev.filter((e) => e.projectId !== id); });
    setTasks((prev) => { const toDelete = prev.filter((t) => t.projectId === id); toDelete.forEach((t) => dbDelete('tasks', t.id)); return prev.filter((t) => t.projectId !== id); });
    dbDelete('projects', id);
  };

  const createEpisode = (episode: Omit<Episode, 'id'>) => {
    const newEpisode: Episode = { ...episode, id: `ep_${Date.now()}` };
    setEpisodes((prev) => [...prev, newEpisode]);
    dbPut('episodes', newEpisode);
    setProjects((prev) => {
      const next = prev.map((p) => p.id === episode.projectId ? { ...p, episodes: [...p.episodes, newEpisode.id] } : p);
      const updated = next.find((p) => p.id === episode.projectId);
      if (updated) dbPut('projects', updated);
      return next;
    });
  };

  const updateEpisode = (id: string, updates: Partial<Episode>) => {
    setEpisodes((prev) => {
      const next = prev.map((e) => e.id === id ? { ...e, ...updates } : e);
      const updated = next.find((e) => e.id === id);
      if (updated) dbPut('episodes', updated);
      return next;
    });
  };

  const deleteEpisode = (id: string) => {
    setEpisodes((prev) => prev.filter((e) => e.id !== id));
    dbDelete('episodes', id);
    setProjects((prev) => {
      const next = prev.map((p) => ({ ...p, episodes: p.episodes.filter((epId) => epId !== id) }));
      next.forEach((p) => dbPut('projects', p));
      return next;
    });
  };

  const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'checklist' | 'attachments' | 'comments' | 'activity'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task, id: `task_${Date.now()}`, createdAt: now, updatedAt: now,
      checklist: [], attachments: [], comments: [],
      activity: [{ id: `act_${Date.now()}`, text: 'Task created', createdAt: now }]
    };
    setTasks((prev) => [...prev, newTask]);
    dbPut('tasks', newTask);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const next = prev.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
      const updated = next.find((t) => t.id === id);
      if (updated) dbPut('tasks', updated);
      return next;
    });
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    dbDelete('tasks', id);
  };

  const addChecklistItem = (taskId: string, text: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => t.id === taskId ? { ...t, checklist: [...t.checklist, { id: `chk_${Date.now()}`, text, done: false }] } : t);
      const updated = next.find((t) => t.id === taskId);
      if (updated) dbPut('tasks', updated);
      return next;
    });
  };

  const toggleChecklistItem = (taskId: string, itemId: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => t.id === taskId ? { ...t, checklist: t.checklist.map((c) => c.id === itemId ? { ...c, done: !c.done } : c) } : t);
      const updated = next.find((t) => t.id === taskId);
      if (updated) dbPut('tasks', updated);
      return next;
    });
  };

  const addComment = (taskId: string, author: string, text: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => t.id === taskId ? { ...t, comments: [...t.comments, { id: `cmt_${Date.now()}`, author, text, createdAt: new Date().toISOString() }] } : t);
      const updated = next.find((t) => t.id === taskId);
      if (updated) dbPut('tasks', updated);
      return next;
    });
  };

  const addAttachment = (taskId: string, attachment: Omit<TaskAttachment, 'id'>) => {
    setTasks((prev) => {
      const next = prev.map((t) => t.id === taskId ? { ...t, attachments: [...t.attachments, { ...attachment, id: `att_${Date.now()}` }] } : t);
      const updated = next.find((t) => t.id === taskId);
      if (updated) dbPut('tasks', updated);
      return next;
    });
  };

  const logActivity = (taskId: string, text: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => t.id === taskId ? { ...t, activity: [{ id: `act_${Date.now()}`, text, createdAt: new Date().toISOString() }, ...t.activity] } : t);
      const updated = next.find((t) => t.id === taskId);
      if (updated) dbPut('tasks', updated);
      return next;
    });
  };

  const addAsset = (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => {
    const newAsset: MediaAsset = { ...asset, id: `asset_${Date.now()}`, createdAt: new Date().toISOString() };
    setMediaAssets((prev) => [...prev, newAsset]);
    dbPut('mediaAssets', newAsset);
  };

  const removeAsset = (id: string) => {
    setMediaAssets((prev) => prev.filter((a) => a.id !== id));
    dbDelete('mediaAssets', id);
  };

  const getAssetsByCategory = (category: AssetCategory) => mediaAssets.filter((a) => a.category === category);

  const getStorageStats = () => ({
    totalSize: mediaAssets.reduce((acc, a) => acc + a.size, 0),
    totalFiles: mediaAssets.length,
  });

  const createTemplate = (template: Omit<Template, 'id' | 'createdAt'>) => {
    const newTemplate: Template = { ...template, id: `tpl_${Date.now()}`, createdAt: new Date().toISOString() };
    setTemplates((prev) => [...prev, newTemplate]);
    dbPut('templates', newTemplate);
  };

  const updateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates((prev) => {
      const next = prev.map((t) => t.id === id ? { ...t, ...updates } : t);
      const updated = next.find((t) => t.id === id);
      if (updated) dbPut('templates', updated);
      return next;
    });
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    dbDelete('templates', id);
  };

  return (
    <MediaStoreContext.Provider value={{
      projects, episodes, tasks, mediaAssets, templates, isLoaded,
      createProject, updateProject, deleteProject,
      createEpisode, updateEpisode, deleteEpisode,
      createTask, updateTask, deleteTask,
      addChecklistItem, toggleChecklistItem,
      addComment, addAttachment, logActivity,
      addAsset, removeAsset, getAssetsByCategory, getStorageStats,
      createTemplate, updateTemplate, deleteTemplate,
    }}>
      {children}
    </MediaStoreContext.Provider>
  );
}

export function useMediaStore() {
  const context = useContext(MediaStoreContext);
  if (context === undefined) throw new Error('useMediaStore must be used within a MediaStoreProvider');
  return context;
}
