import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore, Task, TaskStatus, TaskPriority } from '../store/MediaStore';
import {
  SearchIcon, FilterIcon, PlusIcon, CheckIcon, CalendarIcon, CheckCircle2Icon,
  ClockIcon, ListTodoIcon, ChevronDownIcon, ChevronRightIcon, PencilIcon,
  Trash2Icon, ClipboardCheckIcon, PaperclipIcon, MessageSquareIcon, ActivityIcon,
  SendIcon, CircleIcon, UserIcon, FolderIcon, SaveIcon, XIcon,
} from 'lucide-react';

export function Tasks() {
  const { tasks, projects, createTask, updateTask, deleteTask, addChecklistItem, toggleChecklistItem, addComment, addAttachment, logActivity } = useMediaStore();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createTask({
      name: fd.get('name') as string,
      description: fd.get('description') as string || '',
      projectId: fd.get('projectId') as string || '',
      assignedTo: 'Unassigned',
      dueDate: fd.get('dueDate') as string || 'No date',
      startDate: 'Not set',
      status: 'To Do',
      priority: (fd.get('priority') as TaskPriority) || 'Medium',
      type: 'General',
      tags: [],
      estimatedTime: '0h',
    });
    setIsNewTaskModalOpen(false);
  };

  const todo = filteredTasks.filter((t) => t.status === 'To Do').length;
  const inProgress = filteredTasks.filter((t) => t.status === 'In Progress').length;
  const completed = filteredTasks.filter((t) => t.status === 'Completed').length;

  return (
    <AppLayout title="Tasks">
      <div className="mb-6">
        <p className="text-sm text-gray-500">Manage all task details and related information.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FilterIcon className="w-4 h-4" /> Filter
            </button>
            <button onClick={() => setIsNewTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium">
              <PlusIcon className="w-4 h-4" /> New Task
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center p-12 min-h-[400px]">
              <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mb-6">
                <CheckIcon className="w-10 h-10 text-violet-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No tasks found</h2>
              <p className="text-gray-500 text-center max-w-sm mb-8">{searchQuery ? 'Try adjusting your search query.' : "Create your first task to get started."}</p>
              {!searchQuery && (
                <button onClick={() => setIsNewTaskModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium">
                  <PlusIcon className="w-5 h-5" /> Create Task
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectName={projects.find((p) => p.id === task.projectId)?.name || 'No Project'}
                  isExpanded={expandedTaskId === task.id}
                  onToggle={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  onUpdate={(updates) => updateTask(task.id, updates)}
                  onDelete={() => deleteTask(task.id)}
                  onAddChecklistItem={(text) => addChecklistItem(task.id, text)}
                  onToggleChecklistItem={(itemId) => toggleChecklistItem(task.id, itemId)}
                  onAddComment={(author, text) => addComment(task.id, author, text)}
                  onAddAttachment={(att) => addAttachment(task.id, att)}
                  onLogActivity={(text) => logActivity(task.id, text)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-80 flex-shrink-0 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-6">Task Overview</h3>
            <div className="space-y-4">
              {[
                { icon: ListTodoIcon, label: 'Total Tasks', value: tasks.length, color: 'violet' },
                { icon: ClockIcon, label: 'In Progress', value: inProgress, color: 'blue' },
                { icon: CheckCircle2Icon, label: 'Completed', value: completed, color: 'emerald' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-${item.color}-50 flex items-center justify-center text-${item.color}-600`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Create New Task</h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                <input name="name" required autoFocus type="text" placeholder="e.g. Record Intro"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={2} placeholder="Task details..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select name="projectId" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="">No Project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select name="priority" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option>Low</option>
                    <option selected>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input name="dueDate" type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function TaskCard({
  task, projectName, isExpanded, onToggle, onUpdate, onDelete, onAddChecklistItem, onToggleChecklistItem, onAddComment, onAddAttachment, onLogActivity,
}: {
  task: Task; projectName: string; isExpanded: boolean; onToggle: () => void;
  onUpdate: (u: Partial<Task>) => void; onDelete: () => void;
  onAddChecklistItem: (t: string) => void; onToggleChecklistItem: (id: string) => void;
  onAddComment: (author: string, text: string) => void;
  onAddAttachment: (a: { name: string; size: string }) => void;
  onLogActivity: (t: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editDesc, setEditDesc] = useState(task.description);
  const [activeTab, setActiveTab] = useState('Details');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  const handleSave = () => { onUpdate({ name: editName, description: editDesc }); onLogActivity('Updated task details'); setIsEditing(false); };
  const handleChecklist = (e: React.FormEvent) => { e.preventDefault(); if (!newChecklistText.trim()) return; onAddChecklistItem(newChecklistText); setNewChecklistText(''); };
  const handleComment = (e: React.FormEvent) => { e.preventDefault(); if (!newCommentText.trim()) return; onAddComment('Studio Creator', newCommentText); setNewCommentText(''); };
  const handleStatusChange = (status: TaskStatus) => { onUpdate({ status }); onLogActivity(`Changed status to ${status}`); };

  const statusColors: Record<TaskStatus, string> = {
    'To Do': 'bg-gray-100 text-gray-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'In Review': 'bg-yellow-100 text-yellow-700',
    'Completed': 'bg-green-100 text-green-700',
  };
  const priorityColors: Record<TaskPriority, string> = {
    'Low': 'bg-gray-100 text-gray-700',
    'Medium': 'bg-blue-100 text-blue-700',
    'High': 'bg-orange-100 text-orange-700',
    'Urgent': 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50 border-b border-gray-200' : ''}`} onClick={onToggle}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <ClipboardCheckIcon className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{task.name}</h3>
            <p className="text-sm text-gray-500 truncate max-w-md">{projectName} · {task.dueDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority as TaskPriority]}`}>{task.priority}</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status as TaskStatus]}`}>{task.status}</span>
          {isExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-400" /> : <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
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
                <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this task?')) onDelete(); }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
              <div className="w-24 h-24 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <ClipboardCheckIcon className="w-10 h-10 text-violet-300" />
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
                    <h1 className="text-xl font-bold text-gray-900 mb-1">{task.name}</h1>
                    <p className="text-sm text-gray-500 mb-3">{task.description || 'No description.'}</p>
                    <div className="flex gap-2 mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[task.status as TaskStatus]}`}>{task.status}</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[task.priority as TaskPriority]}`}>{task.priority}</span>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500"><FolderIcon className="w-4 h-4" /><div><p className="text-xs mb-0.5">Project</p><p className="text-sm font-medium text-gray-900 truncate max-w-[80px]">{projectName}</p></div></div>
                  <div className="flex items-center gap-2 text-gray-500"><UserIcon className="w-4 h-4" /><div><p className="text-xs mb-0.5">Assigned</p><p className="text-sm font-medium text-gray-900">{task.assignedTo}</p></div></div>
                  <div className="flex items-center gap-2 text-gray-500"><CalendarIcon className="w-4 h-4" /><div><p className="text-xs mb-0.5">Due Date</p><p className="text-sm font-medium text-gray-900">{task.dueDate}</p></div></div>
                  <div className="flex items-center gap-2 text-gray-500"><SaveIcon className="w-4 h-4" /><div><p className="text-xs mb-0.5">Updated</p><p className="text-sm font-medium text-gray-900">{new Date(task.updatedAt).toLocaleDateString()}</p></div></div>
                </div>
              </div>
            </div>

            {/* Status changer */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 mb-3">Change Status</p>
              <div className="flex gap-2 flex-wrap">
                {(['To Do', 'In Progress', 'In Review', 'Completed'] as TaskStatus[]).map((s) => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${task.status === s ? statusColors[s] + ' ring-1 ring-current' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-gray-200">
              <nav className="flex gap-6">
                {['Checklist', 'Comments', 'Attachments', 'Activity'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'Checklist' && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                {task.checklist.length === 0 && <p className="text-sm text-gray-500 mb-4">No checklist items yet.</p>}
                <ul className="space-y-2 mb-4">
                  {task.checklist.map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <button onClick={() => onToggleChecklistItem(item.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${item.done ? 'bg-violet-600 border-violet-600' : 'border-gray-300 hover:border-violet-400'}`}>
                        {item.done && <CheckCircle2Icon className="w-3 h-3 text-white" />}
                      </button>
                      <span className={`text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleChecklist} className="flex gap-2">
                  <input type="text" value={newChecklistText} onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Add checklist item..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  <button type="submit" className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">Add</button>
                </form>
              </div>
            )}

            {activeTab === 'Comments' && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                {task.comments.length === 0 && <p className="text-sm text-gray-500 mb-4">No comments yet.</p>}
                <div className="space-y-3 mb-4">
                  {task.comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                        {c.author.charAt(0)}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">{c.author}</p>
                        <p className="text-sm text-gray-700">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleComment} className="flex gap-2">
                  <input type="text" value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  <button type="submit" className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                    <SendIcon className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'Attachments' && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                {task.attachments.length === 0 && <p className="text-sm text-gray-500 mb-4">No attachments yet.</p>}
                <div className="space-y-2 mb-4">
                  {task.attachments.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                      <PaperclipIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 flex-1">{a.name}</span>
                      <span className="text-xs text-gray-500">{a.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Activity' && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                {task.activity.length === 0 ? <p className="text-sm text-gray-500">No activity yet.</p> : (
                  <ul className="space-y-3">
                    {task.activity.map((a) => (
                      <li key={a.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-700">{a.text}</p>
                          <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
