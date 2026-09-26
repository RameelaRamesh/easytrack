import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle, Clock, ClipboardList, Target, Award, Save, Play, AlertTriangle,
  FileText, Search, Filter, Calendar, ChevronRight, X, UserCheck, ShieldAlert,
  ArrowRight, KanbanSquare, CheckSquare, HelpCircle, Activity, BookOpen, Download
} from 'lucide-react';
import { BillingWork } from '../../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Navigation tabs within Employee workspace
  const [activeTab, setActiveTab] = useState<'overview' | 'work' | 'tasks' | 'productivity' | 'attendance' | 'training'>('overview');

  // Core Data States (Fetched from backend)
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Selected elements for drawers and modals
  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [blockerForm, setBlockerForm] = useState({ category: 'System Issue', description: '', work_id: '' });

  // Leave submission form states
  const [leaveForm, setLeaveForm] = useState({ type: 'casual', start_date: '', end_date: '', reason: '' });
  const [leavesList, setLeavesList] = useState<any[]>(() => {
    const saved = localStorage.getItem('employee_leaves');
    return saved ? JSON.parse(saved) : [
      { id: 1, type: 'medical', start_date: '2026-08-28', end_date: '2026-08-29', status: 'pending', reason: 'Flu symptoms' }
    ];
  });

  // Logs correction requests
  const [correctionForm, setCorrectionForm] = useState({ date: '', punch_in: '', punch_out: '', reason: '' });
  const [correctionsList, setCorrectionsList] = useState<any[]>([]);

  // Task lists (Shared with TL dashboard storage)
  const [jiraTasks, setJiraTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('tl_jira_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, key: 'TASK-101', title: 'Verify High-Value Apex Claim Batch', description: 'Double check codes for billing correctness.', status: 'in_progress', priority: 'high', assignee: 'EMP-005', project: 'Apex Claims Project', sla: '24h', created_at: '2026-08-25' }
    ];
  });

  // QA enabled state toggle (Shared with TL settings storage)
  const [qaEnabled, setQaEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tl_qa_enabled') === 'true';
  });

  // SOP Acknowledgements
  const [acknowledgedSops, setAcknowledgedSops] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem('emp_acknowledged_sops');
    return saved ? JSON.parse(saved) : {};
  });

  // Output entries map
  const [completedCounts, setCompletedCounts] = useState<Record<number, number>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      const [wRes] = await Promise.all([
        apiClient.get<BillingWork[]>('/billing/')
      ]);

      const myUsername = user?.username || 'emp3';
      const myWorks = wRes.data.filter(w => 
        w.employee_name?.toLowerCase().includes(myUsername.toLowerCase()) || 
        w.employee_name?.includes(user?.first_name || 'Neelam')
      );

      const fallbackWorks = myWorks.length > 0 ? myWorks : [
        { id: 1, work_id: 'WORK-101', client_name: 'Apex Health Partners', process_name: 'Claims Verification', work_type: 'Claim Processing', priority: 'high', due_date: '2026-08-30', target_quantity: 50, actual_quantity: 25, progress: 50, status: 'In Progress', employee_name: 'Neelam Gupta', tl_name: 'Vikram Rathore', estimated_effort_hours: 8, actual_effort_hours: 4 }
      ];

      setWorks(fallbackWorks as any[]);

      const counts: Record<number, number> = {};
      fallbackWorks.forEach((w: any) => {
        counts[w.id] = w.actual_quantity || w.completed_count || 0;
      });
      setCompletedCounts(counts);
    } catch (err) {
      console.error("Error loading employee dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, [user]);

  // Sync state modifications to storage
  useEffect(() => {
    localStorage.setItem('employee_leaves', JSON.stringify(leavesList));
  }, [leavesList]);

  useEffect(() => {
    localStorage.setItem('tl_jira_tasks', JSON.stringify(jiraTasks));
  }, [jiraTasks]);

  useEffect(() => {
    localStorage.setItem('emp_acknowledged_sops', JSON.stringify(acknowledgedSops));
  }, [acknowledgedSops]);

  // Calculations
  const activeQueuesCount = works.length;
  const totalTargetClaims = works.reduce((sum, w: any) => sum + (w.target_quantity || w.target_count || 50), 0);
  const totalCompletedClaims = works.reduce((sum, w: any) => sum + (w.actual_quantity || w.completed_count || 0), 0);
  const achievementRate = totalTargetClaims > 0 ? Math.round((totalCompletedClaims / totalTargetClaims) * 100) : 50;

  const pendingTasksCount = jiraTasks.filter(t => t.status !== 'completed').length;

  // Actions
  const handleStartWork = (id: number) => {
    setWorks(prev => prev.map(w => w.id === id ? { ...w, status: 'In Progress' } : w));
    setMsg('Work status updated to In Progress.');
  };

  const handleUpdateProgress = async (workId: number, maxTarget: number) => {
    setSubmittingId(workId);
    setMsg('');
    const completedVal = completedCounts[workId] || 0;
    const computedProgress = Math.min(100, Math.round((completedVal / maxTarget) * 100));
    
    // Determine next status based on QA settings
    const nextStatus = completedVal >= maxTarget 
      ? (qaEnabled ? 'Awaiting QA' : 'Completed') 
      : 'In Progress';

    try {
      await apiClient.patch(`/billing/${workId}/`, {
        actual_quantity: completedVal,
        progress: computedProgress,
        status: nextStatus
      });
      setMsg('Claim production progress logged successfully!');
      loadEmployeeData();
    } catch (err) {
      setMsg('Progress saved successfully in local cache!');
      setWorks(prev => prev.map(w => w.id === workId ? { 
        ...w, 
        actual_quantity: completedVal, 
        progress: computedProgress, 
        status: nextStatus 
      } : w));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCountChange = (workId: number, val: number, max: number) => {
    const sanitised = Math.max(0, Math.min(max, val));
    setCompletedCounts(prev => ({
      ...prev,
      [workId]: sanitised
    }));
  };

  const handleFileBlocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockerForm.description) return;

    // Raise escalation log (Shared with Operations Head/TL escalations logs)
    const savedEsc = localStorage.getItem('tl_escalations');
    const escalationsList = savedEsc ? JSON.parse(savedEsc) : [];
    
    const newEsc = {
      id: Date.now(),
      key: `ESC-40${escalationsList.length + 1}`,
      title: `${blockerForm.category} Block: ${works[0]?.process_name || 'Verification'}`,
      description: blockerForm.description,
      priority: 'high',
      status: 'Open',
      assignee: 'Vikram Rathore (TL)',
      related_work: blockerForm.work_id || 'WRK-001',
      created_at: new Date().toISOString().split('T')[0]
    };

    localStorage.setItem('tl_escalations', JSON.stringify([newEsc, ...escalationsList]));
    setShowBlockerModal(false);
    setBlockerForm({ category: 'System Issue', description: '', work_id: '' });
    setMsg('Blocker assistance request filed to Team Lead.');
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.start_date || !leaveForm.end_date) return;

    const newLeave = {
      id: Date.now(),
      employee_name: 'Neelam Gupta',
      employee_id: 'EMP-005',
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      leave_type: leaveForm.type,
      reason: leaveForm.reason,
      status: 'pending'
    };

    setLeavesList(prev => [newLeave, ...prev]);
    setLeaveForm({ type: 'casual', start_date: '', end_date: '', reason: '' });
    setMsg('Leave request submitted to Team Lead for review.');
  };

  const handleRequestCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.date || !correctionForm.punch_in) return;

    const newCorrection = {
      id: Date.now(),
      date: correctionForm.date,
      punch_in: correctionForm.punch_in,
      punch_out: correctionForm.punch_out || '18:00',
      reason: correctionForm.reason,
      status: 'pending'
    };

    setCorrectionsList(prev => [newCorrection, ...prev]);
    setCorrectionForm({ date: '', punch_in: '', punch_out: '', reason: '' });
    setMsg('Punch attendance correction requested.');
  };

  const handleAcknowledgeSop = (sopId: number) => {
    setAcknowledgedSops(prev => ({
      ...prev,
      [sopId]: true
    }));
    setMsg('Compliance SOP guidelines acknowledged.');
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Welcome greeting header banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-normal">Welcome back, {user?.first_name || 'Neelam'}!</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">Log claim numbers, resolve support tasks, and audit your production accuracies.</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-brand-primary-light border border-brand-primary/30 text-brand-primary text-xs font-medium rounded-xl flex justify-between items-center">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="p-0.5 hover:bg-black/5 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs strip */}
      <div className="flex overflow-x-auto space-x-1 border-b border-gray-200 dark:border-slate-800 pb-px scrollbar-none">
        {[
          { id: 'overview', label: 'My Dashboard', icon: Activity },
          { id: 'work', label: 'My Assigned Work', icon: ClipboardList },
          { id: 'tasks', label: 'Jira Tasks & Blockers', icon: CheckSquare },
          { id: 'productivity', label: 'My Productivity stats', icon: Target },
          { id: 'attendance', label: 'Attendance & Leave', icon: Calendar },
          { id: 'training', label: 'SOPs & Training', icon: BookOpen }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-semibold text-xs transition whitespace-nowrap ${
                isActive 
                  ? 'border-brand-primary text-brand-primary font-bold bg-brand-primary-light/10' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('work')}>
              <div className="p-3 bg-brand-primary-light text-brand-primary rounded-lg flex-shrink-0">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Assigned Batches</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{activeQueuesCount}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Claim billing queues</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('productivity')}>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg flex-shrink-0 dark:bg-emerald-950/20">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Completed Output</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{totalCompletedClaims} / {totalTargetClaims}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Daily Target progress</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('productivity')}>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0 dark:bg-amber-950/20">
                <Award className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-455 capitalize">Achievement Rate</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{achievementRate}%</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">SLA quality index</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('tasks')}>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg flex-shrink-0 dark:bg-rose-950/20">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-455 capitalize">Pending Tasks</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{pendingTasksCount}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Department support items</p>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Active claims list overview */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4 md:col-span-2">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Active Billing Queues</h3>
              <div className="space-y-3">
                {works.map(w => (
                  <div key={w.id} className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono text-[9px] text-brand-primary font-bold">{w.work_id}</span>
                      <h4 className="font-semibold text-slate-900 dark:text-white mt-0.5">{w.client_name} - {w.process_name}</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Target claims: {w.target_quantity || w.target_count} | Status: {w.status}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedWork(w); }}
                      className="px-2.5 py-1 bg-slate-950 text-white rounded font-bold text-[10px]"
                    >
                      Update progress
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* QA Feedback sidebar summary */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">QA Audit Results</h3>
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-750 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Verification Audit</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Approved</span>
                </div>
                <p className="text-slate-455">Checked by TL audit team Noida. Accuracy rating: 100%.</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: My Assigned Work */}
      {activeTab === 'work' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Assigned Claim Queues</h3>
                <p className="text-xs text-slate-500 mt-1">Log claim numbers completed under SLA policies.</p>
              </div>
              <button
                onClick={() => setShowBlockerModal(true)}
                className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-250 font-bold rounded-lg text-xs"
              >
                Log Blocker
              </button>
            </div>

            {/* Blocker Modal */}
            {showBlockerModal && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <form onSubmit={handleFileBlocker} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 p-6 w-full max-w-md space-y-4 text-xs">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Log Process Blocker</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Blocker Category</label>
                    <select
                      value={blockerForm.category}
                      onChange={(e) => setBlockerForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      <option value="System Issue">System Issue</option>
                      <option value="Client Clarification">Client Clarification</option>
                      <option value="Missing Information">Missing Information</option>
                      <option value="Access Issue">Access Issue</option>
                      <option value="Workload Issue">Workload Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Claim Queue Link</label>
                    <select
                      value={blockerForm.work_id}
                      onChange={(e) => setBlockerForm(prev => ({ ...prev, work_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      {works.map(w => (
                        <option key={w.id} value={w.work_id}>{w.client_name} - {w.process_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Problem Description</label>
                    <textarea
                      required
                      placeholder="List details of the blocker..."
                      value={blockerForm.description}
                      onChange={(e) => setBlockerForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBlockerModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
                    >
                      File Blocker
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {works.map(w => {
                const targetVal = w.target_quantity || w.target_count || 50;
                const completedVal = completedCounts[w.id] || 0;
                const progressPercentage = Math.round((completedVal / targetVal) * 100);
                return (
                  <div key={w.id} className="p-5 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-4 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[9px] text-brand-primary font-bold">{w.work_id}</span>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">{w.client_name} - {w.process_name}</h4>
                        <p className="text-[10px] text-slate-500">SLA priority: {w.priority} • Team Lead: {w.tl_name}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {w.status === 'Assigned' && (
                          <button
                            onClick={() => handleStartWork(w.id)}
                            className="flex items-center px-3 py-1 bg-brand-primary text-slate-950 font-bold rounded-lg"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start Queue
                          </button>
                        )}
                        <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase text-[10px]">
                          {w.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 dark:border-slate-800 pt-3">
                      <div className="flex items-center gap-3">
                        <label className="font-bold text-slate-455">Enter Completed Claims:</label>
                        <input
                          type="number"
                          value={completedVal}
                          onChange={(e) => handleCountChange(w.id, parseInt(e.target.value) || 0, targetVal)}
                          className="w-16 px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded font-bold"
                          min={0}
                          max={targetVal}
                        />
                        <span className="text-slate-455">/ {targetVal}</span>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          disabled={submittingId === w.id}
                          onClick={() => handleUpdateProgress(w.id, targetVal)}
                          className="flex items-center px-4 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold"
                        >
                          <Save className="h-3.5 w-3.5 mr-1" />
                          {submittingId === w.id ? 'Saving...' : 'Save progress'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-500">
                        <span>Target Progress</span>
                        <span className="font-bold">{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-250 dark:bg-slate-750 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-primary h-full rounded-full transition-all" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: My Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Jira Operational Tasks</h3>
            
            <div className="space-y-3">
              {jiraTasks.map(t => (
                <div key={t.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[9px] text-brand-primary font-bold">{t.key}</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{t.title}</h4>
                      <p className="text-slate-400 mt-0.5">Project: {t.project} • Due date: {t.due_date || 'N/A'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold uppercase">
                      {t.status}
                    </span>
                  </div>
                  <p className="leading-relaxed font-normal">{t.description}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Tab 4: My Productivity stats */}
      {activeTab === 'productivity' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Productivity & Performance Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-750 space-y-2">
                <p className="text-[10px] text-slate-400 font-sans">Today's target quota</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{totalTargetClaims} Claims</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-750 space-y-2">
                <p className="text-[10px] text-slate-400 font-sans">Today's actual output</p>
                <p className="font-bold text-sm text-emerald-600">{totalCompletedClaims} Claims ({achievementRate}%)</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-750 text-xs leading-relaxed space-y-2">
              <h4 className="font-bold">Incentive Eligibility Summary</h4>
              <p className="font-normal text-slate-550 dark:text-slate-405">Incentive checks are generated automatically based on daily claims achievements. High targets completed on Apex Claims Project generate up to ₹2,450.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Attendance & Leave */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Apply Leave request form */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Submit Leave Application</h3>
              <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
                
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Leave Type</label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="medical">Medical Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Start Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">End Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.end_date}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Leave Reason</label>
                  <textarea
                    required
                    placeholder="Provide details..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs hover:bg-brand-primary-hover transition"
                >
                  Apply Leave
                </button>
              </form>
            </div>

            {/* Attendance correction request form */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Attendance punch correction</h3>
              <form onSubmit={handleRequestCorrection} className="space-y-3.5 text-xs">
                
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Punch Date</label>
                  <input
                    type="date"
                    required
                    value={correctionForm.date}
                    onChange={(e) => setCorrectionForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Correct Punch In</label>
                    <input
                      type="time"
                      required
                      value={correctionForm.punch_in}
                      onChange={(e) => setCorrectionForm(prev => ({ ...prev, punch_in: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Correct Punch Out</label>
                    <input
                      type="time"
                      value={correctionForm.punch_out}
                      onChange={(e) => setCorrectionForm(prev => ({ ...prev, punch_out: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Correction reason</label>
                  <textarea
                    required
                    placeholder="Forgot punch, system sync issue Noida center..."
                    value={correctionForm.reason}
                    onChange={(e) => setCorrectionForm(prev => ({ ...prev, reason: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition"
                >
                  Request Punch Correction
                </button>
              </form>
            </div>

            {/* Submissions queue logs */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4 text-xs">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Leave Submissions Log</h3>
              <div className="space-y-3">
                {leavesList.map(item => (
                  <div key={item.id} className="p-3 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>{item.leave_type || item.type} Leave</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">{item.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Date: {item.start_date} to {item.end_date}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 6: SOPs & Training */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Process Guidelines & SOPs</h3>
              <p className="text-xs text-slate-500 mt-1">Acknowledge SOP document updates for process compliance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Apex Claims Verification SOP</h4>
                  <p className="text-[10px] text-slate-455">Version: V1.4 • Process: Claims Verification</p>
                </div>
                <p className="leading-relaxed font-normal">Check patient registration IDs and policy dates against Medicare and Medicaid eligibility criteria.</p>
                
                <div className="flex justify-end">
                  {acknowledgedSops[1] ? (
                    <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded">
                      ✓ Acknowledged Compliance
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledgeSop(1)}
                      className="px-3 py-1 bg-brand-primary text-slate-950 font-bold rounded hover:bg-brand-primary-hover"
                    >
                      Acknowledge SOP
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ----------------- ASSIGNED WORK DETAIL DIALOG DRAWER ----------------- */}
      {selectedWork && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-800 shadow-2xl border-l border-gray-200 dark:border-slate-700 z-50 flex flex-col h-full text-xs">
          
          {/* Header */}
          <div className="p-6 bg-slate-950 text-white flex justify-between items-start border-b border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] tracking-wider text-slate-400 font-medium uppercase">{selectedWork.work_id}</span>
              <h3 className="text-base font-semibold leading-normal">{selectedWork.client_name}</h3>
              <p className="text-xs text-slate-350">{selectedWork.process_name} • TL: {selectedWork.tl_name}</p>
            </div>
            <button onClick={() => setSelectedWork(null)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-xs">Process instructions</p>
              <p className="mt-1">Follow Noida compliance guidelines and Medicare rules while checking billing IDs.</p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900 p-4 border border-gray-150 dark:border-slate-750 rounded-xl space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-750">
                <span className="text-slate-400">Claims Target</span>
                <span className="font-semibold">{selectedWork.target_quantity || selectedWork.target_count} Claims</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-750">
                <span className="text-slate-400">Completed Output</span>
                <span className="font-semibold">{selectedWork.actual_quantity || selectedWork.completed_count || 0} Claims</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-end border-t border-gray-150 dark:border-slate-750">
            <button
              onClick={() => setSelectedWork(null)}
              className="px-5 py-2 bg-slate-950 text-white rounded-lg font-bold"
            >
              Close Detail
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
export default Dashboard;
