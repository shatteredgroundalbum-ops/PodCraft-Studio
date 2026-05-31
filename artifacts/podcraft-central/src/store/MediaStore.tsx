import React, { useState, createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthStore';
import * as projectService from '../services/projectService';
import * as episodeService from '../services/episodeService';
import * as taskService from '../services/taskService';
import * as mediaService from '../services/mediaService';
import * as templateService from '../services/templateService';
import * as activitySvc from '../services/activityService';
import type { DbProject, DbEpisode, DbTask, DbMediaAsset, DbTemplate, DbChecklistItem, DbAttachment, DbComment, DbActivityEntry } from '../db';

export type ProjectStatus = 'Planning' | 'Pre-Production' | 'Production' | 'Post-Production' | 'Mastering';
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type AssetCategory = 'studio' | 'audio' | 'music' | 'sfx' | 'images' | 'videos' | 'documents';
export type AssetSource = 'recording' | 'mixdown' | 'master' | 'project' | 'export' | 'upload';

export type Project = DbProject;
export type Episode = DbEpisode;
export type Task = DbTask & { checklist: DbChecklistItem[]; attachments: DbAttachment[]; comments: DbComment[]; activity: DbActivityEntry[] };
export type MediaAsset = DbMediaAsset;
export type Template = DbTemplate;
export type TaskChecklistItem = DbChecklistItem;
export type TaskAttachment = DbAttachment;
export type TaskComment = DbComment;
export type TaskActivity = DbActivityEntry;

type MediaStoreContextType = {
  projects: Project[];
  episodes: Episode[];
  tasks: Task[];
  mediaAssets: MediaAsset[];
  templates: Template[];
  isLoaded: boolean;
  createProject: (project: Omit<Project, 'id' | 'userId' | 'tracks' | 'episodes' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createEpisode: (episode: Omit<Episode, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEpisode: (id: string, updates: Partial<Episode>) => Promise<void>;
  deleteEpisode: (id: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'userId' | 'checklist' | 'attachments' | 'comments' | 'activity' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addChecklistItem: (taskId: string, text: string) => Promise<void>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  addComment: (taskId: string, author: string, text: string) => Promise<void>;
  addAttachment: (taskId: string, attachment: Omit<TaskAttachment, 'id'>) => Promise<void>;
  logActivity: (taskId: string, text: string) => Promise<void>;
  addAsset: (asset: Omit<MediaAsset, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  getAssetsByCategory: (category: AssetCategory) => MediaAsset[];
  getStorageStats: () => { totalSize: number; totalFiles: number };
  createTemplate: (template: Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
};

const MediaStoreContext = createContext<MediaStoreContextType | undefined>(undefined);

export function MediaStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setEpisodes([]);
      setTasks([]);
      setMediaAssets([]);
      setTemplates([]);
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    Promise.all([
      projectService.getProjects(user.userId),
      episodeService.getEpisodes(user.userId),
      taskService.getTasks(user.userId),
      mediaService.getAssets(user.userId),
      templateService.getTemplates(user.userId),
    ]).then(([p, e, t, m, tpl]) => {
      setProjects(p);
      setEpisodes(e);
      setTasks(t as Task[]);
      setMediaAssets(m);
      setTemplates(tpl);
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, [user?.userId]);

  const createProject = useCallback(async (data: Omit<Project, 'id' | 'userId' | 'tracks' | 'episodes' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const p = await projectService.createProject(user.userId, data);
    setProjects((prev) => [...prev, p]);
    activitySvc.logActivity(user.userId, 'create', 'project', p.id, `Created project "${p.name}"`);
  }, [user]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    await projectService.updateProject(id, updates);
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await projectService.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setEpisodes((prev) => prev.filter((e) => e.projectId !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
  }, []);

  const createEpisode = useCallback(async (data: Omit<Episode, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const ep = await episodeService.createEpisode(user.userId, data);
    setEpisodes((prev) => [...prev, ep]);
    setProjects((prev) => prev.map((p) => p.id === data.projectId ? { ...p, episodes: [...p.episodes, ep.id] } : p));
    activitySvc.logActivity(user.userId, 'create', 'episode', ep.id, `Created episode "${ep.title}"`);
  }, [user]);

  const updateEpisode = useCallback(async (id: string, updates: Partial<Episode>) => {
    await episodeService.updateEpisode(id, updates);
    setEpisodes((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const deleteEpisode = useCallback(async (id: string) => {
    await episodeService.deleteEpisode(id);
    setEpisodes((prev) => prev.filter((e) => e.id !== id));
    setProjects((prev) => prev.map((p) => ({ ...p, episodes: p.episodes.filter((eid) => eid !== id) })));
  }, []);

  const createTask = useCallback(async (data: Omit<Task, 'id' | 'userId' | 'checklist' | 'attachments' | 'comments' | 'activity' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const t = await taskService.createTask(user.userId, data);
    setTasks((prev) => [...prev, t as Task]);
    activitySvc.logActivity(user.userId, 'create', 'task', t.id, `Created task "${t.name}"`);
  }, [user]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    await taskService.updateTask(id, updates);
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    if (updates.status) {
      activitySvc.logActivity(user.userId, 'update', 'task', id, `Task status changed to "${updates.status}"`);
    }
  }, [user]);

  const deleteTask = useCallback(async (id: string) => {
    await taskService.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addChecklistItem = useCallback(async (taskId: string, text: string) => {
    await taskService.addChecklistItem(taskId, text);
    setTasks((prev) => prev.map((t) => t.id === taskId
      ? { ...t, checklist: [...t.checklist, { id: `chk_${Date.now()}`, text, done: false }] }
      : t));
  }, []);

  const toggleChecklistItem = useCallback(async (taskId: string, itemId: string) => {
    await taskService.toggleChecklistItem(taskId, itemId);
    setTasks((prev) => prev.map((t) => t.id === taskId
      ? { ...t, checklist: t.checklist.map((c) => c.id === itemId ? { ...c, done: !c.done } : c) }
      : t));
  }, []);

  const addComment = useCallback(async (taskId: string, author: string, text: string) => {
    await taskService.addComment(taskId, author, text);
    const comment = { id: `cmt_${Date.now()}`, author, text, createdAt: new Date().toISOString() };
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t));
  }, []);

  const addAttachment = useCallback(async (taskId: string, attachment: Omit<TaskAttachment, 'id'>) => {
    await taskService.addAttachment(taskId, attachment);
    const att = { ...attachment, id: `att_${Date.now()}` };
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, attachments: [...t.attachments, att] } : t));
  }, []);

  const logActivity = useCallback(async (taskId: string, text: string) => {
    await taskService.logTaskActivity(taskId, text);
    const entry = { id: `act_${Date.now()}`, text, createdAt: new Date().toISOString() };
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, activity: [entry, ...t.activity] } : t));
  }, []);

  const addAsset = useCallback(async (data: Omit<MediaAsset, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const asset = await mediaService.createAsset(user.userId, data);
    setMediaAssets((prev) => [...prev, asset]);
  }, [user]);

  const removeAsset = useCallback(async (id: string) => {
    await mediaService.deleteAsset(id);
    setMediaAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getAssetsByCategory = useCallback((category: AssetCategory) =>
    mediaAssets.filter((a) => a.category === category), [mediaAssets]);

  const getStorageStats = useCallback(() => ({
    totalSize: mediaAssets.reduce((acc, a) => acc + a.size, 0),
    totalFiles: mediaAssets.length,
  }), [mediaAssets]);

  const createTemplate = useCallback(async (data: Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const tpl = await templateService.createTemplate(user.userId, data);
    setTemplates((prev) => [...prev, tpl]);
    activitySvc.logActivity(user.userId, 'create', 'template', tpl.id, `Created template "${tpl.name}"`);
  }, [user]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<Template>) => {
    await templateService.updateTemplate(id, updates);
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await templateService.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
