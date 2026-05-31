import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import {
  useMediaStore,
  Task,
  TaskStatus,
  TaskPriority } from
'../store/MediaStore';
import {
  SearchIcon,
  FilterIcon,
  PlusIcon,
  CheckIcon,
  CalendarIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  ListTodoIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
  ClipboardCheckIcon,
  PaperclipIcon,
  MessageSquareIcon,
  ActivityIcon,
  SendIcon,
  UploadIcon,
  CircleIcon,
  UserIcon,
  TagIcon } from
'lucide-react';
export function Tasks() {
  const {
    tasks,
    projects,
    createTask,
    updateTask,
    deleteTask,
    addChecklistItem,
    toggleChecklistItem,
    addComment,
    addAttachment,
    logActivity
  } = useMediaStore();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredTasks = tasks.filter((t) =>
  t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleCreateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTask({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      projectId: formData.get('projectId') as string,
      assignedTo: 'Unassigned',
      dueDate: formData.get('dueDate') as string || 'No date',
      startDate: 'Not set',
      status: 'To Do',
      priority: formData.get('priority') as TaskPriority || 'Medium',
      type: 'General',
      tags: [],
      estimatedTime: '0h'
    });
    setIsNewTaskModalOpen(false);
  };
  return (
    <AppLayout title="Tasks">
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Manage all task details and related information.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Controls */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
              
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <FilterIcon className="w-4 h-4" />
              Filter
            </button>
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
              
              <PlusIcon className="w-4 h-4" />
              New Task
            </button>
          </div>

          {filteredTasks.length === 0 ?
          <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center p-12 min-h-[500px]">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-10 h-10 text-violet-600" />
                </div>
                <div className="absolute -top-2 -right-2 text-violet-300">
                  ✨
                </div>
                <div className="absolute top-4 -left-4 text-violet-300">✨</div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                No tasks found
              </h2>
              <p className="text-gray-500 text-center max-w-sm mb-8">
                {searchQuery ?
              'Try adjusting your search query.' :
              "You're all set! Create your first task to get started."}
              </p>
              {!searchQuery &&
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shadow-sm">
              
                  <PlusIcon className="w-5 h-5" />
                  Create Task
                </button>
            }
            </div> :

          <div className="space-y-4">
              {filteredTasks.map((task) =>
            <TaskCard
              key={task.id}
              task={task}
              projectName={
              projects.find((p) => p.id === task.projectId)?.name ||
              'No Project'
              }
              isExpanded={expandedTaskId === task.id}
              onToggle={() =>
              setExpandedTaskId(
                expandedTaskId === task.id ? null : task.id
              )
              }
              onUpdate={(updates) => updateTask(task.id, updates)}
              onDelete={() => deleteTask(task.id)}
              onAddChecklistItem={(text) => addChecklistItem(task.id, text)}
              onToggleChecklistItem={(itemId) =>
              toggleChecklistItem(task.id, itemId)
              }
              onAddComment={(author, text) =>
              addComment(task.id, author, text)
              }
              onAddAttachment={(att) => addAttachment(task.id, att)}
              onLogActivity={(text) => logActivity(task.id, text)} />

            )}
            </div>
          }
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-6">
          {/* Task Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-6">Task Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                    <ListTodoIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700">Total Tasks</span>
                </div>
                <span className="font-bold text-gray-900">{tasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <ClockIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700">In Progress</span>
                </div>
                <span className="font-bold text-gray-900">
                  {tasks.filter((t) => t.status === 'In Progress').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700">Completed</span>
                </div>
                <span className="font-bold text-gray-900">
                  {tasks.filter((t) => t.status === 'Completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isNewTaskModalOpen &&
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Create New Task
              </h3>
              <button
              onClick={() => setIsNewTaskModalOpen(false)}
              className="text-gray-400 hover:text-gray-600">
              
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name
                </label>
                <input
                name="name"
                required
                autoFocus
                type="text"
                placeholder="e.g. Record Intro"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                name="description"
                rows={2}
                placeholder="Task details..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              </textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                  name="projectId"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  
                    <option value="">No Project</option>
                    {projects.map((p) =>
                  <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                  )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                  name="priority"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                name="dueDate"
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                
                  Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </AppLayout>);

}
function TaskCard({
  task,
  projectName,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onAddChecklistItem,
  onToggleChecklistItem,
  onAddComment,
  onAddAttachment,
  onLogActivity












}: {task: Task;projectName: string;isExpanded: boolean;onToggle: () => void;onUpdate: (updates: Partial<Task>) => void;onDelete: () => void;onAddChecklistItem: (text: string) => void;onToggleChecklistItem: (itemId: string) => void;onAddComment: (author: string, text: string) => void;onAddAttachment: (att: {name: string;size: string;}) => void;onLogActivity: (text: string) => void;}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editDesc, setEditDesc] = useState(task.description);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const handleSaveEdit = () => {
    onUpdate({
      name: editName,
      description: editDesc
    });
    onLogActivity(`Updated task details`);
    setIsEditing(false);
  };
  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    onAddChecklistItem(newChecklistText);
    setNewChecklistText('');
  };
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment('Studio Creator', newCommentText);
    setNewCommentText('');
  };
  const handleStatusChange = (status: TaskStatus) => {
    onUpdate({
      status
    });
    onLogActivity(`Changed status to ${status}`);
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200">
      {/* Collapsed Header */}
      <div
        className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50 border-b border-gray-200' : ''}`}
        onClick={onToggle}>
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <ClipboardCheckIcon className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{task.name}</h3>
            <p className="text-sm text-gray-500 truncate max-w-md">
              {projectName} • {task.dueDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.priority === 'Urgent' ? 'bg-red-100 text-red-700' : task.priority === 'High' ? 'bg-orange-100 text-orange-700' : task.priority === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
              
              {task.priority}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
              {task.status}
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
                    confirm('Are you sure you want to delete this task?'))
                    {
                      onDelete();
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-32 h-32 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardCheckIcon className="w-12 h-12 text-violet-300" />
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
                        <h1 className="text-2xl font-bold text-gray-900">
                          {task.name}
                        </h1>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-sm text-gray-500">
                          {task.description || 'No description provided.'}
                        </h2>
                      </div>
                    </>
                }

                  <div className="mb-6 flex gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-700">
                      <CircleIcon className="w-3 h-3 fill-current" />
                      Task Status: {task.status}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                      <CircleIcon className="w-3 h-3 fill-current" />
                      Task Priority: {task.priority}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500">
                      <FolderIcon className="w-4 h-4" />
                      <div>
                        <p className="text-xs mb-0.5">Project</p>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                          {projectName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <UserIcon className="w-4 h-4" />
                      <div>
                        <p className="text-xs mb-0.5">Assigned To</p>
                        <p className="text-sm font-medium text-gray-900">
                          {task.assignedTo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <CalendarIcon className="w-4 h-4" />
                      <div>
                        <p className="text-xs mb-0.5">Due Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {task.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <ClockIcon className="w-4 h-4" />
                      <div>
                        <p className="text-xs mb-0.5">Created</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <SaveIcon className="w-4 h-4" />
                      <div>
                        <p className="text-xs mb-0.5">Last Updated</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(task.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Task Details */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardCheckIcon className="w-5 h-5 text-violet-600" />
                    <h3 className="text-sm font-bold text-gray-900">
                      Task Details
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Description
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[80px]">
                        {task.description || 'No description provided.'}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <TagIcon className="w-3 h-3" /> Type
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.type}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <AlertCircleIcon className="w-3 h-3" /> Priority
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.priority}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <CheckCircle2Icon className="w-3 h-3" /> Status
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.status}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <CalendarIcon className="w-3 h-3" /> Start Date
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.startDate}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <CalendarIcon className="w-3 h-3" /> Due Date
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.dueDate}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <ClockIcon className="w-3 h-3" /> Estimated Time
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.estimatedTime}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <TagIcon className="w-3 h-3" /> Tags
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.tags.length > 0 ? task.tags.join(', ') : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2Icon className="w-5 h-5 text-violet-600" />
                      <h3 className="text-sm font-bold text-gray-900">
                        Checklist
                      </h3>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {task.checklist.length === 0 ?
                  <div className="text-sm text-gray-500 text-center py-4">
                        No items in checklist.
                      </div> :

                  task.checklist.map((item) =>
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                    
                          <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => onToggleChecklistItem(item.id)}
                      className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500" />
                    
                          <span
                      className={`text-sm flex-1 ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      
                            {item.text}
                          </span>
                        </div>
                  )
                  }
                  </div>
                  <form onSubmit={handleAddChecklist} className="mt-auto">
                    <input
                    type="text"
                    placeholder="Add an item..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                  </form>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Attachments */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PaperclipIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-900">
                      Attachments
                    </h3>
                  </div>
                  {task.attachments.length === 0 ?
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                      <FolderIcon className="w-8 h-8 text-violet-200 mb-2" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        No attachments
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Drag & drop files here or click to upload
                      </p>
                      <button
                    onClick={() => {
                      onAddAttachment({
                        name: 'document.pdf',
                        size: '2.4 MB'
                      });
                      onLogActivity('Added attachment document.pdf');
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-xs font-medium transition-colors">
                    
                        <UploadIcon className="w-4 h-4" />
                        Upload File
                      </button>
                    </div> :

                <div className="space-y-2">
                      {task.attachments.map((att) =>
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                    
                          <div className="flex items-center gap-3">
                            <FileIcon className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {att.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {att.size}
                              </p>
                            </div>
                          </div>
                        </div>
                  )}
                      <button
                    onClick={() => {
                      onAddAttachment({
                        name: 'image.png',
                        size: '1.1 MB'
                      });
                      onLogActivity('Added attachment image.png');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg text-xs font-medium transition-colors mt-4">
                    
                        <PlusIcon className="w-4 h-4" />
                        Add another
                      </button>
                    </div>
                }
                </div>

                {/* Comments */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquareIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-900">
                      Comments
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[150px]">
                    {task.comments.length === 0 ?
                  <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquareIcon className="w-8 h-8 text-violet-100 mb-2" />
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          No comments yet
                        </p>
                        <p className="text-xs text-gray-500">
                          Be the first to add a comment.
                        </p>
                      </div> :

                  task.comments.map((comment) =>
                  <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs flex-shrink-0">
                            {comment.author.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {comment.author}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit'
                            }
                          )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-0.5">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                  )
                  }
                  </div>
                  <form
                  onSubmit={handleAddComment}
                  className="mt-auto relative">
                  
                    <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50" />
                  
                    <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-violet-600 hover:bg-violet-50 rounded transition-colors">
                    
                      <SendIcon className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Activity Log */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <ActivityIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-900">
                      Activity Log
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 min-h-[150px]">
                    {task.activity.length === 0 ?
                  <div className="flex flex-col items-center justify-center h-full text-center">
                        <ListTodoIcon className="w-8 h-8 text-violet-100 mb-2" />
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          No activity yet
                        </p>
                        <p className="text-xs text-gray-500">
                          Task activity will appear here.
                        </p>
                      </div> :

                  task.activity.map((act) =>
                  <div key={act.id} className="flex gap-3">
                          <div className="mt-1">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">{act.text}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(act.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                  )
                  }
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80 flex-shrink-0 space-y-6">
              {/* Task Progress */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-6">
                  Task Progress
                </h3>
                <div className="space-y-4">
                  {[
                {
                  num: 1,
                  label: 'To Do'
                },
                {
                  num: 2,
                  label: 'In Progress'
                },
                {
                  num: 3,
                  label: 'In Review'
                },
                {
                  num: 4,
                  label: 'Completed'
                }].
                map((step) => {
                  const statusOrder = [
                  'To Do',
                  'In Progress',
                  'In Review',
                  'Completed'];

                  const currentIndex = statusOrder.indexOf(task.status);
                  const stepIndex = statusOrder.indexOf(step.label);
                  const isDone = stepIndex < currentIndex;
                  const isActive = stepIndex === currentIndex;
                  return (
                    <div
                      key={step.num}
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => handleStatusChange(step.label as any)}>
                      
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

              {/* Task Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ActivityIcon className="w-5 h-5 text-violet-600" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Task Actions
                  </h3>
                </div>
                <div className="space-y-3">
                  <button
                  onClick={() => handleStatusChange('In Progress')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                  
                    Start / Resume Task
                  </button>
                  <button
                  onClick={() => handleStatusChange('In Review')}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                  
                    Mark As In Review
                  </button>
                  <button
                  onClick={() => handleStatusChange('Completed')}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                  
                    Mark As Completed
                  </button>
                  <button
                  onClick={() => {
                    const newAssignee = prompt('Assign to:', task.assignedTo);
                    if (newAssignee) {
                      onUpdate({
                        assignedTo: newAssignee
                      });
                      onLogActivity(`Reassigned to ${newAssignee}`);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                  
                    Reassign Task
                  </button>
                  <button
                  onClick={() => {
                    if (
                    confirm('Are you sure you want to delete this task?'))
                    {
                      onDelete();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-sm font-medium transition-colors mt-6">
                  
                    <Trash2Icon className="w-4 h-4" />
                    Delete Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}