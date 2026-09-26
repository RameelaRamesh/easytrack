import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle, ClipboardList, Target, Award, Save, Play, AlertTriangle,
  FileText, Calendar, ChevronRight, X, UserCheck, ShieldAlert,
  ArrowRight, CheckSquare, Activity, BookOpen, Laptop,
  MessageSquare, Plus, Minus
} from 'lucide-react';
import { BillingWork } from '../../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Core Data States
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  
  // Active batch selection
  const [activeBatchId, setActiveBatchId] = useState<number | null>(null);
  const [completedCounts, setCompletedCounts] = useState<Record<number, number>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // Blocker Modal State
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [blockerForm, setBlockerForm] = useState({ category: 'Portal Down / Login Issue', description: '', work_id: '' });
  const [blockerSubmitting, setBlockerSubmitting] = useState(false);

  // Jira tasks for employee
  const [jiraTasks, setJiraTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('tl_jira_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Verify deliverable submissions for batch B-101', priority: 'high', status: 'in_progress', due_date: 'Today' },
      { id: 2, title: 'Check daily eligibility discrepancy reports', priority: 'medium', status: 'pending', due_date: 'Tomorrow' }
    ];
  });

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      const wRes = await apiClient.get<BillingWork[]>('/billing/');

      const myUsername = user?.username || '';
      const myWorks = (wRes.data || []).filter(w => 
        (w.employee_name && w.employee_name.toLowerCase().includes(myUsername.toLowerCase())) || 
        (user?.first_name && w.employee_name && w.employee_name.toLowerCase().includes(user.first_name.toLowerCase())) ||
        String(w.assigned_employee) === String(user?.id)
      );

      // If no works assigned specifically to user name, display available works or fallback
      const effectiveWorks = myWorks.length > 0 ? myWorks : (wRes.data || []);
      setWorks(effectiveWorks as any[]);

      if (effectiveWorks.length > 0) {
        // Pick first in_progress or pending batch
        const active = effectiveWorks.find(w => w.status === 'in_progress') || effectiveWorks[0];
        setActiveBatchId(active.id);
      }

      const counts: Record<number, number> = {};
      effectiveWorks.forEach((w: any) => {
        counts[w.id] = w.actual_quantity ?? w.completed_count ?? 0;
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

  // Sync tasks to localStorage
  useEffect(() => {
    localStorage.setItem('tl_jira_tasks', JSON.stringify(jiraTasks));
  }, [jiraTasks]);

  // Operational Batch Actions
  const activeWork = works.find(w => w.id === activeBatchId) || works[0];

  const handleCountStep = (workId: number, delta: number, maxTarget: number) => {
    setCompletedCounts(prev => {
      const current = prev[workId] ?? 0;
      const next = Math.max(0, Math.min(maxTarget * 2, current + delta));
      return { ...prev, [workId]: next };
    });
  };

  const handleCountDirect = (workId: number, val: number) => {
    const sanitised = Math.max(0, isNaN(val) ? 0 : val);
    setCompletedCounts(prev => ({
      ...prev,
      [workId]: sanitised
    }));
  };

  const handleStartWork = async (workId: number) => {
    try {
      await apiClient.patch(`/billing/${workId}/`, { status: 'in_progress' });
      setWorks(prev => prev.map(w => w.id === workId ? { ...w, status: 'in_progress' } : w));
      setMsg('Work started on this batch.');
    } catch (err) {
      setWorks(prev => prev.map(w => w.id === workId ? { ...w, status: 'in_progress' } : w));
      setMsg('Work started on this batch.');
    }
  };

  const handleSaveProgress = async (workId: number, maxTarget: number) => {
    setSubmittingId(workId);
    setMsg('');
    const completedVal = completedCounts[workId] ?? 0;
    const computedProgress = Math.min(100, Math.round((completedVal / maxTarget) * 100));
    const nextStatus = completedVal >= maxTarget ? 'completed' : 'in_progress';

    try {
      await apiClient.patch(`/billing/${workId}/`, {
        actual_quantity: completedVal,
        progress: computedProgress,
        status: nextStatus
      });
      setMsg(`Saved ${completedVal}/${maxTarget} units successfully.`);
      setWorks(prev => prev.map(w => w.id === workId ? {

        ...w,
        actual_quantity: completedVal,
        progress: computedProgress,
        status: nextStatus
      } : w));
    } catch (err) {
      setWorks(prev => prev.map(w => w.id === workId ? {
        ...w,
        actual_quantity: completedVal,
        progress: computedProgress,
        status: nextStatus
      } : w));
      setMsg(`Work progress (${completedVal} items) saved.`);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleFileBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockerForm.description.trim() || !activeWork) return;

    setBlockerSubmitting(true);
    const reporterName = user?.first_name ? `${user.first_name} ${user.last_name}` : (user?.username || 'Operator');

    try {
      try {
        await apiClient.post('/escalations/', {
          name: `Blocker: ${activeWork.work_id} - ${blockerForm.category}`,
          status: 'Open',
          details: {
            work_id: activeWork.work_id,
            work_pk: activeWork.id,
            client: activeWork.client_name,
            process: activeWork.process_name,
            category: blockerForm.category,
            description: blockerForm.description,
            reporter: reporterName,
            timestamp: new Date().toISOString()
          }
        });
      } catch (err) {
        console.warn("Escalations API fallback", err);
      }

      const savedEsc = localStorage.getItem('tl_escalations');
      const escalationsList = savedEsc ? JSON.parse(savedEsc) : [];
      const newEsc = {
        id: Date.now(),
        key: `ESC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `${blockerForm.category}: ${activeWork.work_id} (${activeWork.client_name})`,
        description: blockerForm.description,
        priority: 'high',
        status: 'Open',
        assignee: activeWork.tl_name || 'Team Lead',
        related_work: activeWork.work_id,
        reporter: reporterName,
        created_at: new Date().toISOString().split('T')[0]
      };

      localStorage.setItem('tl_escalations', JSON.stringify([newEsc, ...escalationsList]));
      setShowBlockerModal(false);
      setBlockerForm({ category: 'Portal Down / Login Issue', description: '', work_id: '' });
      setMsg('Blocker escalated to Team Lead successfully.');
    } catch (err) {
      setMsg('Failed to submit blocker.');
    } finally {
      setBlockerSubmitting(false);
    }
  };

  const toggleTaskDone = (taskId: number) => {
    setJiraTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'completed' ? 'in_progress' : 'completed';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Calculations
  const totalTargetUnits = works.reduce((sum, w: any) => sum + (w.target_quantity || w.target_count || 50), 0);
  const totalCompletedUnits = works.reduce((sum, w: any) => sum + (w.actual_quantity || w.completed_count || 0), 0);
  const achievementRate = totalTargetUnits > 0 ? Math.round((totalCompletedUnits / totalTargetUnits) * 100) : 0;
  const pendingTasksCount = jiraTasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans max-w-7xl mx-auto">
      
      {/* 1. Welcome & Shift Hero Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Welcome back, {user?.first_name || 'Operator'}!
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-primary-light text-brand-primary">
              Shift Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-450">
            Operations & Work Production Mission Control • Shift IST 09:30 - 18:30
          </p>
        </div>
      </div>

      {/* User notification toast */}
      {msg && (
        <div className="p-3 bg-brand-primary-light border border-brand-primary/30 text-brand-primary text-xs font-semibold rounded-xl flex justify-between items-center animate-in fade-in duration-200">
          <span className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {msg}
          </span>
          <button onClick={() => setMsg('')} className="p-1 hover:bg-black/5 rounded">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. Daily Focus KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Deliverables Progress */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-450">Today's Output</span>
            <div className="p-2 bg-brand-primary-light text-brand-primary rounded-lg">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalCompletedUnits}</span>
              <span className="text-xs text-slate-400 font-mono">/ {totalTargetUnits || 50} units</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-brand-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, achievementRate)}%` }}></div>
            </div>
            <p className="text-[10px] font-semibold text-brand-primary mt-1.5">{achievementRate}% of daily target reached</p>
          </div>
        </div>


        {/* KPI 2: Assigned Batches */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-450">Work Batches</span>
            <div className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-950/30 rounded-lg">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{works.length}</span>
            <span className="text-xs text-slate-400 ml-1.5">assigned</span>
            <p className="text-[10px] text-slate-500 mt-2">
              <Link to="/billing" className="text-brand-primary hover:underline font-bold flex items-center">
                Open Work Queue <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </p>
          </div>
        </div>

        {/* KPI 3: Open Support Tasks */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-450">Pending Tasks</span>
            <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-950/30 rounded-lg">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{pendingTasksCount}</span>
            <span className="text-xs text-slate-400 ml-1.5">in queue</span>
            <p className="text-[10px] text-slate-500 mt-2">
              <Link to="/tasks" className="text-brand-primary hover:underline font-bold flex items-center">
                View Task Board <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </p>
          </div>
        </div>

        {/* KPI 4: Quality & Accuracy */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-450">QA Accuracy</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 rounded-lg">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-600">98.5%</span>
            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-2 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" /> Quality standard met
            </p>
          </div>
        </div>

      </div>

      {/* 3. Main Centerpiece: Active Batch Runner & Quick Task Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Batch Runner */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 space-y-5">
            
            {/* Batch Selector Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-brand-primary" />
                  Active Execution Batch
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Increment units processed and report immediate blockers.</p>
              </div>

              {/* Batch switcher if multiple */}
              {works.length > 1 && (
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Batch:</span>
                  <select
                    value={activeBatchId || ''}
                    onChange={(e) => setActiveBatchId(Number(e.target.value))}
                    className="px-2.5 py-1 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-mono font-bold text-brand-primary"
                  >
                    {works.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.work_id} - {w.client_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeWork ? (
              <div className="space-y-5">
                {/* Meta details banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Client</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{activeWork.client_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Process</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{activeWork.process_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Priority</span>
                    <p className="font-bold text-brand-primary capitalize mt-0.5">{activeWork.priority}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Due Date</span>
                    <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">{activeWork.due_date || 'Today'}</p>
                  </div>
                </div>

                {/* Production Units Logger */}
                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Log Completed Units</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                        {completedCounts[activeWork.id] ?? (activeWork.actual_quantity ?? 0)}
                      </span>
                      <span className="text-sm font-mono text-slate-400">
                        / {activeWork.target_quantity || (activeWork as any).target_count || 50} target
                      </span>
                    </div>
                  </div>

                  {/* Counter Buttons & Save */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleCountStep(activeWork.id, -1, activeWork.target_quantity || (activeWork as any).target_count || 50)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition"
                        title="Decrement item count"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={completedCounts[activeWork.id] ?? (activeWork.actual_quantity ?? 0)}
                        onChange={(e) => handleCountDirect(activeWork.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-mono font-bold text-base bg-transparent border-none focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCountStep(activeWork.id, 1, activeWork.target_quantity || (activeWork as any).target_count || 50)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition"
                        title="Increment item count"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={submittingId === activeWork.id}
                      onClick={() => handleSaveProgress(activeWork.id, activeWork.target_quantity || (activeWork as any).target_count || 50)}
                      className="px-4 py-2.5 bg-brand-primary bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
                    >
                      <Save className="h-4 w-4" />
                      <span>{submittingId === activeWork.id ? 'Saving...' : 'Save Progress'}</span>
                    </button>
                  </div>
                </div>

                {/* Batch Status & Blocker Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-semibold">Status:</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      activeWork.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      activeWork.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {activeWork.status === 'in_progress' ? 'In Progress' : activeWork.status}
                    </span>

                    {activeWork.status !== 'in_progress' && activeWork.status !== 'completed' && (
                      <button
                        onClick={() => handleStartWork(activeWork.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Start Batch</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setBlockerForm({ category: 'Portal Down / Login Issue', description: '', work_id: activeWork.work_id });
                      setShowBlockerModal(true);
                    }}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs font-bold flex items-center space-x-1.5 border border-rose-200 dark:border-rose-900 transition"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Report Blocker to TL</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <ClipboardList className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No operational batches currently assigned.</p>
                <p className="text-xs text-slate-400">Check in with your Team Lead or explore available work in the queue.</p>
                <Link
                  to="/billing"
                  className="inline-flex items-center px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Go to Work Queue
                </Link>
              </div>
            )}

          </div>

          {/* Quick Support Checklist */}
          <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center">
                <CheckSquare className="h-4 w-4 mr-2 text-brand-primary" />
                My Daily Action Items
              </h4>
              <Link to="/tasks" className="text-xs text-brand-primary hover:underline font-bold">
                View All
              </Link>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-750">
              {jiraTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => toggleTaskDone(task.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                    <span className={`${task.status === 'completed' ? 'line-through text-slate-400' : 'font-semibold text-slate-800 dark:text-slate-200'}`}>
                      {task.title}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                    task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Self-Service & Quick Portals */}
        <div className="space-y-4">
          
          <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Self-Service Shortcuts
            </h4>

            <div className="space-y-2.5">
              {/* Quick Action 1: Apply For Leave */}
              <Link
                to="/my-desk?tab=leave&action=apply"
                className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-750 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-950/40 rounded-lg">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-brand-primary transition">
                      Apply For Leave
                    </p>
                    <p className="text-[10px] text-slate-400">Casual, Sick, or Medical leave request</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              {/* Quick Action 2: Process SOPs */}
              <Link
                to="/knowledge-base"
                className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-750 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/40 rounded-lg">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-brand-primary transition">
                      Process SOPs & KB
                    </p>
                    <p className="text-[10px] text-slate-400">Client guidelines & billing checklists</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              {/* Quick Action 3: Hardware Assets */}
              <Link
                to="/my-desk?tab=assets"
                className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-750 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 rounded-lg">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-brand-primary transition">
                      My Assigned Assets
                    </p>
                    <p className="text-[10px] text-slate-400">Laptop, charger & accessories</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              {/* Quick Action 4: Communication Hub */}
              <Link
                to="/communication"
                className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-750 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-950/40 rounded-lg">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-brand-primary transition">
                      Communication Hub
                    </p>
                    <p className="text-[10px] text-slate-400">Team chats & broadcast alerts</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Compliance & Verification Badge Card */}
          <div className="bg-gradient-to-br from-brand-primary-light/40 to-brand-primary/10 border border-brand-primary/30 p-5 rounded-card space-y-3">
            <div className="flex items-center space-x-2 text-brand-primary">
              <UserCheck className="h-5 w-5" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Employee Standing</h4>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Your onboarding documentation is verified and your daily deliverable target is actively tracked by your Team Lead.
            </p>
            <div className="text-[10px] font-mono text-slate-500">
              Department: Operations
            </div>
          </div>

        </div>

      </div>

      {/* Blocker Escalation Modal */}
      {showBlockerModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0 bg-rose-50/50 dark:bg-rose-950/20">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Escalate Operational Blocker</h3>
              </div>
              <button onClick={() => setShowBlockerModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFileBlocker} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 uppercase text-[10px] mb-1">Blocker Category</label>
                  <select
                    value={blockerForm.category}
                    onChange={(e) => setBlockerForm({ ...blockerForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    <option value="System Down / Access Issue">System Down / Access Issue</option>
                    <option value="Missing Requirements / Input Data">Missing Requirements / Input Data</option>
                    <option value="Client Guidelines Unclear">Client Guidelines Unclear</option>
                    <option value="Software / System Error">Software / System Error</option>
                    <option value="VPN / Network Latency">VPN / Network Latency</option>
                    <option value="Other Operational Blocker">Other Operational Blocker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] mb-1">Details for Team Lead</label>
                  <textarea
                    rows={4}
                    value={blockerForm.description}
                    onChange={(e) => setBlockerForm({ ...blockerForm, description: e.target.value })}
                    placeholder="Provide details of the issue preventing task completion..."
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end gap-2 bg-slate-50 dark:bg-slate-850">
                <button
                  type="button"
                  onClick={() => setShowBlockerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 rounded-lg text-slate-650 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={blockerSubmitting || !blockerForm.description.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  {blockerSubmitting ? 'Submitting...' : 'Escalate to TL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
