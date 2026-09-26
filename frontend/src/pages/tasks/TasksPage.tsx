import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckSquare, Plus, X, Save, Clock, ArrowRight, 
  MessageSquare, Paperclip, Send, RotateCcw, CheckCircle, 
  AlertCircle, ChevronRight, User, Layers, FolderKanban, ShieldAlert
} from 'lucide-react';
import { Task, EmployeeProfile, Project, Client, TaskComment, TaskActivity } from '../../types';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFlow, setFilterFlow] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit / Action states
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Request changes modal/input
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changesNotes, setChangesNotes] = useState('');

  // Attachments input
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  // Create Task Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createFlowSource, setCreateFlowSource] = useState<'management' | 'client_requirement'>('management');
  const [createProjectId, setCreateProjectId] = useState('');
  const [createClientId, setCreateClientId] = useState('');
  const [createTeam, setCreateTeam] = useState('Operations');
  const [createTlId, setCreateTlId] = useState('');
  const [createAssigneeId, setCreateAssigneeId] = useState('');
  const [createPriority, setCreatePriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createSlaHours, setCreateSlaHours] = useState(24);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchData = async () => {
    try {
      const [tRes, eRes, pRes, cRes] = await Promise.all([
        apiClient.get<Task[]>('/tasks/'),
        apiClient.get<EmployeeProfile[]>('/employees/').catch(() => ({ data: [] })),
        apiClient.get<Project[]>('/projects/').catch(() => ({ data: [] })),
        apiClient.get<Client[]>('/clients/').catch(() => ({ data: [] }))
      ]);
      setTasks(tRes.data || []);
      setEmployees(eRes.data || []);
      setProjects(pRes.data || []);
      setClients(cRes.data || []);
    } catch (err) {
      console.error('Error fetching tasks data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditAssignee(task.assignee ? task.assignee.toString() : '');
    setActionMsg('');
    setCommentText('');
    setShowChangesModal(false);
    setShowAttachmentInput(false);
  };

  const handleSaveTaskEdits = async () => {
    if (!selectedTask) return;
    setSaving(true);
    setActionMsg('');
    try {
      const selectedEmp = employees.find(e => e.id.toString() === editAssignee);
      const assigneeName = selectedEmp ? `${selectedEmp.user_details.first_name} ${selectedEmp.user_details.last_name}` : selectedTask.assignee_name;
      
      const res = await apiClient.patch(`/tasks/${selectedTask.id}/`, {
        status: editStatus,
        priority: editPriority,
        assignee: editAssignee ? parseInt(editAssignee) : null
      });
      
      const updated = res.data;
      setActionMsg('Task updated successfully!');
      fetchData();
      setSelectedTask(prev => prev ? { ...prev, ...updated, assignee_name: assigneeName } : null);
    } catch (err) {
      console.error(err);
      setActionMsg('Task changes updated locally.');
    } finally {
      setSaving(false);
    }
  };

  const handleTransitionStatus = async (newStatus: string) => {
    if (!selectedTask) return;
    setSaving(true);
    try {
      const res = await apiClient.patch(`/tasks/${selectedTask.id}/`, {
        status: newStatus
      });
      const updated = res.data;
      setEditStatus(newStatus);
      setSelectedTask(prev => prev ? { ...prev, ...updated } : null);
      setActionMsg(`Task transitioned to ${getStatusLabel(newStatus)}.`);
      fetchData();
    } catch (err) {
      console.error(err);
      setSelectedTask(prev => prev ? { ...prev, status: newStatus as any } : null);
      setEditStatus(newStatus);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSaving(true);
    try {
      const res = await apiClient.post(`/tasks/${selectedTask.id}/request-changes/`, {
        review_notes: changesNotes
      });
      setSelectedTask(res.data);
      setEditStatus('changes_requested');
      setShowChangesModal(false);
      setChangesNotes('');
      setActionMsg('Changes requested and logged in task review history.');
      fetchData();
    } catch (err) {
      console.error(err);
      handleTransitionStatus('changes_requested');
      setShowChangesModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;
    setCommenting(true);
    try {
      const res = await apiClient.post(`/tasks/${selectedTask.id}/add-comment/`, {
        text: commentText.trim()
      });
      setSelectedTask(res.data);
      setCommentText('');
      fetchData();
    } catch (err) {
      console.error(err);
      // Offline fallback
      const fallbackComment: TaskComment = {
        id: (selectedTask.comments?.length || 0) + 1,
        author: user?.username || 'user',
        author_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User',
        text: commentText.trim(),
        timestamp: new Date().toISOString()
      };
      setSelectedTask(prev => prev ? {
        ...prev,
        comments: [...(prev.comments || []), fallbackComment]
      } : null);
      setCommentText('');
    } finally {
      setCommenting(false);
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !attachmentName.trim()) return;
    const newAtt = {
      name: attachmentName.trim(),
      url: attachmentUrl.trim() || '#',
      date: new Date().toISOString().split('T')[0]
    };
    const updatedAttachments = [...(selectedTask.attachments || []), newAtt];
    try {
      const res = await apiClient.patch(`/tasks/${selectedTask.id}/`, {
        attachments: updatedAttachments
      });
      setSelectedTask(res.data);
      setAttachmentName('');
      setAttachmentUrl('');
      setShowAttachmentInput(false);
      fetchData();
    } catch (err) {
      setSelectedTask(prev => prev ? { ...prev, attachments: updatedAttachments } : null);
      setAttachmentName('');
      setAttachmentUrl('');
      setShowAttachmentInput(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!createTitle.trim()) {
      setCreateError('Task title is required.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload: any = {
        title: createTitle.trim(),
        description: createDescription.trim(),
        flow_source: createFlowSource,
        team: createTeam,
        priority: createPriority,
        sla_hours: createSlaHours,
        status: 'todo'
      };

      if (createProjectId) payload.project = parseInt(createProjectId);
      if (createClientId) payload.client = parseInt(createClientId);
      if (createTlId) payload.team_lead = parseInt(createTlId);
      if (createAssigneeId) payload.assignee = parseInt(createAssigneeId);
      if (createDueDate) payload.due_date = createDueDate;

      await apiClient.post('/tasks/', payload);
      setShowCreateModal(false);
      setCreateTitle('');
      setCreateDescription('');
      setCreateProjectId('');
      setCreateClientId('');
      setCreateTlId('');
      setCreateAssigneeId('');
      setCreateDueDate('');
      fetchData();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to create task. Please check parameters.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo':
      case 'backlog':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'review':
        return 'Review';
      case 'changes_requested':
        return 'Changes Requested';
      case 'completed':
        return 'Completed';
      case 'on_hold':
        return 'On Hold';
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'review':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'changes_requested':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-gray-200 dark:border-slate-700';
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'todo' && t.status !== 'todo' && t.status !== 'backlog') return false;
      if (filterStatus !== 'todo' && t.status !== filterStatus) return false;
    }
    if (filterFlow !== 'all' && t.flow_source !== filterFlow) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = t.key?.toLowerCase().includes(q);
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchAssignee = t.assignee_name?.toLowerCase().includes(q);
      const matchProject = t.project_name?.toLowerCase().includes(q);
      if (!matchKey && !matchTitle && !matchAssignee && !matchProject) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-6 w-6 text-brand-primary" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project & Task Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Collaborative workflow: Management → Team Lead → Employee, or Client Requirement → Team Lead → Employee. 
            Track status from To Do ➔ In Progress ➔ Review ➔ Completed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create New Task
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search key, title, assignee, project..."
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg w-full sm:w-64"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>

          <select
            value={filterFlow}
            onChange={(e) => setFilterFlow(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg font-medium"
          >
            <option value="all">All Task Flows</option>
            <option value="management">Management → TL → Employee</option>
            <option value="client_requirement">Client Requirement → TL → Employee</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-slate-400 font-semibold">
          Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleSelectTask(task)}
              className="p-4 sm:p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-brand-primary hover:shadow-md cursor-pointer transition"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-brand-primary bg-brand-primary-light px-2 py-0.5 rounded border border-brand-primary/30">
                    {task.key}
                  </span>
                  
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {task.flow_source === 'client_requirement' 
                      ? 'Client Requirement Flow' 
                      : 'Management Flow'}
                  </span>

                  {task.project_name && (
                    <span className="flex items-center text-[11px] font-medium text-slate-500">
                      <FolderKanban className="h-3 w-3 mr-1" />
                      {task.project_name}
                    </span>
                  )}

                  {task.team && (
                    <span className="flex items-center text-[11px] font-medium text-slate-400">
                      <Layers className="h-3 w-3 mr-1" />
                      {task.team}
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400">
                    SLA: {task.sla_hours}h
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {task.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {task.description || 'No description provided.'}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span>Assignee: <strong className="text-slate-700 dark:text-slate-200">{task.assignee_name || 'Unassigned'}</strong></span>
                  {task.team_lead_name && <span>Team Lead: <strong className="text-slate-700 dark:text-slate-200">{task.team_lead_name}</strong></span>}
                  {task.due_date && <span>Due: <strong className="text-slate-700 dark:text-slate-200">{task.due_date}</strong></span>}
                  {task.comments && task.comments.length > 0 && (
                    <span className="flex items-center text-brand-primary">
                      <MessageSquare className="h-3 w-3 mr-1" /> {task.comments.length}
                    </span>
                  )}
                  {task.attachments && task.attachments.length > 0 && (
                    <span className="flex items-center text-slate-400">
                      <Paperclip className="h-3 w-3 mr-1" /> {task.attachments.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Status & Priority Badge Column */}
              <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(task.status)}`}>
                  {getStatusLabel(task.status)}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Priority: <span className="text-slate-600 dark:text-slate-200">{task.priority}</span>
                </span>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
              <CheckSquare className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No tasks match the active filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Task Details & Review Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 p-4 sm:p-5 shrink-0 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-xs bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded border border-teal-200 dark:border-teal-800">
                  {selectedTask.key}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate max-w-md">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {actionMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 rounded-xl font-semibold">
                  {actionMsg}
                </div>
              )}

              {/* Status Workflow Actions Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Task State</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadgeClass(selectedTask.status)}`}>
                    {getStatusLabel(selectedTask.status)}
                  </span>
                </div>

                {/* Workflow step buttons: To Do -> In Progress -> Review -> Completed */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {(selectedTask.status === 'todo' || selectedTask.status === 'backlog') && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleTransitionStatus('in_progress')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg flex items-center space-x-1"
                    >
                      <span>Start Task ➔ In Progress</span>
                    </button>
                  )}

                  {(selectedTask.status === 'in_progress' || selectedTask.status === 'changes_requested') && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleTransitionStatus('review')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg flex items-center space-x-1"
                    >
                      <span>Submit for Review</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}

                  {selectedTask.status === 'review' && (
                    <>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleTransitionStatus('completed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center space-x-1"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Approve & Complete</span>
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setShowChangesModal(true)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center space-x-1"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Request Changes</span>
                      </button>
                    </>
                  )}

                  {selectedTask.status === 'completed' && (
                    <span className="text-emerald-600 font-bold flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" /> Work completed & verified.
                    </span>
                  )}
                </div>

                {/* Request Changes Sub-Modal / Form */}
                {showChangesModal && (
                  <form onSubmit={handleRequestChanges} className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg space-y-2">
                    <p className="font-bold text-rose-700 dark:text-rose-300">Request Changes & Quality Rework</p>
                    <textarea
                      value={changesNotes}
                      onChange={(e) => setChangesNotes(e.target.value)}
                      required
                      placeholder="Specify the revisions required before this deliverable can be approved..."
                      rows={2}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 rounded-lg text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowChangesModal(false)}
                        className="px-2.5 py-1 bg-gray-200 dark:bg-slate-700 rounded text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-3 py-1 bg-rose-600 text-white font-bold rounded text-xs"
                      >
                        Submit Changes Request
                      </button>
                    </div>
                  </form>
                )}

                {selectedTask.review_notes && selectedTask.status === 'changes_requested' && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 rounded text-rose-700 dark:text-rose-300 text-xs">
                    <strong>Review Feedback:</strong> {selectedTask.review_notes}
                  </div>
                )}
              </div>

              {/* Task Core Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Flow Origin</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedTask.flow_source === 'client_requirement'
                      ? 'Client Requirement/Meeting → Team Lead → Employee'
                      : 'Management/Manager → Team Lead → Employee'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Project / Client</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedTask.project_name || 'General Project'} {selectedTask.client_name ? `(${selectedTask.client_name})` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Team / Department</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedTask.team || 'Operations'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Due Date & SLA</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedTask.due_date || 'No due date'} • SLA: {selectedTask.sla_hours} hours
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Description</p>
                <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                  {selectedTask.description || 'No description provided.'}
                </div>
              </div>

              {/* Editable Fields: Assignee, Priority, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-100 dark:border-slate-700 pt-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Assignee</label>
                  <select
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">Unassigned</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.user_details.first_name} {e.user_details.last_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Manual Status Override</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="changes_requested">Changes Requested</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center">
                    <Paperclip className="h-3.5 w-3.5 mr-1" />
                    Attachments ({selectedTask.attachments?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                    className="text-brand-primary font-bold hover:underline"
                  >
                    + Add Attachment
                  </button>
                </div>

                {showAttachmentInput && (
                  <form onSubmit={handleAddAttachment} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      placeholder="Attachment name (e.g. Design Specs.pdf)"
                      required
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder="URL or document link"
                      required
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-lg text-xs"
                    >
                      Attach
                    </button>
                  </form>
                )}

                <div className="flex flex-wrap gap-2">
                  {selectedTask.attachments?.map((att, i) => (
                    <div key={i} className="flex items-center px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      <Paperclip className="h-3 w-3 mr-1 text-slate-400" />
                      <span className="font-medium">{att.name}</span>
                      {att.date && <span className="ml-1 text-slate-400 text-[10px]">({att.date})</span>}
                    </div>
                  ))}
                  {(!selectedTask.attachments || selectedTask.attachments.length === 0) && !showAttachmentInput && (
                    <p className="text-slate-400 text-[11px]">No attachments uploaded.</p>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  Comments ({selectedTask.comments?.length || 0})
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTask.comments?.map((c) => (
                    <div key={c.id} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{c.author_name || c.author}</span>
                        <span className="text-slate-400">{new Date(c.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-800 dark:text-slate-300">{c.text}</p>
                    </div>
                  ))}
                  {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                    <p className="text-slate-400 text-[11px]">No comments yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment or status update..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    disabled={commenting || !commentText.trim()}
                    className="px-3 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-lg text-xs flex items-center disabled:opacity-50"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Comment
                  </button>
                </form>
              </div>

              {/* Activity History Timeline */}
              {selectedTask.activity_history && selectedTask.activity_history.length > 0 && (
                <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Activity History
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedTask.activity_history.map((act, i) => (
                      <div key={i} className="text-[11px] flex items-start space-x-2 text-slate-500">
                        <span className="text-slate-400 shrink-0 font-mono text-[10px]">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:
                        </span>
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">{act.action}</strong> by {act.actor} — {act.details}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 shrink-0 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveTaskEdits}
                className="flex items-center px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 p-4 sm:p-5 shrink-0 bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create New Task / Work Item</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {createError && (
                <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-semibold">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Task Title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  required
                  placeholder="e.g. Produce Q3 Financial Audit Deliverables"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Task Flow Source</label>
                <select
                  value={createFlowSource}
                  onChange={(e) => setCreateFlowSource(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="management">Management / Manager → Team Lead → Employee</option>
                  <option value="client_requirement">Client Requirement / Meeting → Team Lead → Employee</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Client (Internal Record)</label>
                  <select
                    value={createClientId}
                    onChange={(e) => setCreateClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">No Client Linked</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Project</label>
                  <select
                    value={createProjectId}
                    onChange={(e) => setCreateProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">No Project Linked</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Team Lead</label>
                  <select
                    value={createTlId}
                    onChange={(e) => setCreateTlId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">Select Team Lead</option>
                    {employees.filter(e => e.user_details.role === 'tl' || e.user_details.role === 'admin').map(e => (
                      <option key={e.user_details.id} value={e.user_details.id}>{e.user_details.first_name} {e.user_details.last_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Assignee</label>
                  <select
                    value={createAssigneeId}
                    onChange={(e) => setCreateAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">Assign Later</option>
                    {employees.map(e => (
                      <option key={e.user_details.id} value={e.user_details.id}>{e.user_details.first_name} {e.user_details.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={createDueDate}
                    onChange={(e) => setCreateDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">SLA (Hours)</label>
                  <input
                    type="number"
                    value={createSlaHours}
                    onChange={(e) => setCreateSlaHours(parseInt(e.target.value) || 24)}
                    min={1}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Description / Requirements</label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={3}
                  placeholder="Detailed specifications, deliverables, and expectations..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating Task...' : 'Create Task'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default TasksPage;
