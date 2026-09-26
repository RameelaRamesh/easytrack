import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  ClipboardList, Plus, X, Search, Calendar, Save, Trash2, CheckCircle, Eye,
  AlertTriangle, Play, Minus, Check, Clock, ChevronRight
} from 'lucide-react';
import { BillingWork, EmployeeProfile, Client, Process } from '../../types';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  // Operator counter state: maps work.id -> count
  const [operatorCounts, setOperatorCounts] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Blocker modal state
  const [blockerWork, setBlockerWork] = useState<BillingWork | null>(null);
  const [blockerCategory, setBlockerCategory] = useState('Portal Down / Login Issue');
  const [blockerPriority, setBlockerPriority] = useState('high');
  const [blockerNote, setBlockerNote] = useState('');
  const [blockerSubmitting, setBlockerSubmitting] = useState(false);

  // Allocation form state
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedWorkDetails, setSelectedWorkDetails] = useState<BillingWork | null>(null);

  // New allocation inputs
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [processId, setProcessId] = useState('');
  const [processSearch, setProcessSearch] = useState('');
  const [showProcessDropdown, setShowProcessDropdown] = useState(false);

  const [employeeId, setEmployeeId] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [tlId, setTlId] = useState('');
  const [tlSearch, setTlSearch] = useState('');
  const [showTlDropdown, setShowTlDropdown] = useState(false);

  const [workType, setWorkType] = useState('Verification');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [targetCount, setTargetCount] = useState(10);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filters
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isEmployee = user?.role === 'employee';
  const canAllocate = user?.role === 'operations_head' || user?.role === 'ceo';

  const loadData = async () => {
    try {
      const [wRes, eRes, cRes, pRes] = await Promise.all([
        apiClient.get<BillingWork[]>('/billing/'),
        apiClient.get<EmployeeProfile[]>('/employees/'),
        apiClient.get<Client[]>('/clients/'),
        apiClient.get<Process[]>('/processes/')
      ]);

      const loadedWorks = wRes.data || [];
      setWorks(loadedWorks);
      setEmployees(eRes.data || []);
      setClients(cRes.data || []);
      setProcesses(pRes.data || []);

      // Populate operator counts
      const counts: Record<number, number> = {};
      loadedWorks.forEach(w => {
        counts[w.id] = w.actual_quantity ?? (w as any).completed_count ?? 0;
      });
      setOperatorCounts(counts);
    } catch (err) {
      console.error(err);
      setWorks([]);
      setEmployees([]);
      setClients([]);
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAllocateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!clientId || !processId || !employeeId) {
      setFormError('Please select client, process, and employee.');
      return;
    }
    setFormSubmitting(true);
    try {
      const payload = {
        client: parseInt(clientId),
        process: parseInt(processId),
        employee: parseInt(employeeId),
        tl: tlId ? parseInt(tlId) : null,
        work_type: workType,
        priority: priority,
        due_date: dueDate || null,
        target_count: targetCount,
        progress: 0,
        status: 'pending'
      };
      await apiClient.post('/billing/', payload);
      setShowAllocateModal(false);
      // Reset form
      setClientId('');
      setClientSearch('');
      setProcessId('');
      setProcessSearch('');
      setEmployeeId('');
      setEmployeeSearch('');
      setTlId('');
      setTlSearch('');
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to allocate task.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStartWork = async (work: BillingWork) => {
    setSavingId(work.id);
    try {
      await apiClient.patch(`/billing/${work.id}/`, { status: 'in_progress' });
      setWorks(prev => prev.map(w => w.id === work.id ? { ...w, status: 'in_progress' } : w));
      if (selectedWorkDetails?.id === work.id) {
        setSelectedWorkDetails(prev => prev ? { ...prev, status: 'in_progress' } : null);
      }
      setNotificationMsg(`Started work on batch ${work.work_id}.`);
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err) {
      // Local fallback
      setWorks(prev => prev.map(w => w.id === work.id ? { ...w, status: 'in_progress' } : w));
      setNotificationMsg(`Started work on batch ${work.work_id}.`);
      setTimeout(() => setNotificationMsg(null), 3500);
    } finally {
      setSavingId(null);
    }
  };

  const handleCountStep = (workId: number, delta: number, maxTarget: number) => {
    setOperatorCounts(prev => {
      const current = prev[workId] ?? 0;
      const next = Math.max(0, Math.min(maxTarget * 2, current + delta));
      return { ...prev, [workId]: next };
    });
  };

  const handleCountDirect = (workId: number, value: number, maxTarget: number) => {
    const sanitised = Math.max(0, isNaN(value) ? 0 : value);
    setOperatorCounts(prev => ({
      ...prev,
      [workId]: sanitised
    }));
  };

  const handleSaveProgress = async (work: BillingWork) => {
    const currentCount = operatorCounts[work.id] ?? (work.actual_quantity ?? (work as any).completed_count ?? 0);
    const target = work.target_quantity || (work as any).target_count || 1;
    const computedProgress = Math.min(100, Math.round((currentCount / target) * 100));
    const computedStatus = currentCount >= target ? 'completed' : 'in_progress';

    setSavingId(work.id);
    try {
      await apiClient.patch(`/billing/${work.id}/`, {
        actual_quantity: currentCount,
        progress: computedProgress,
        status: computedStatus
      });
      setWorks(prev => prev.map(w => w.id === work.id ? {
        ...w,
        actual_quantity: currentCount,
        progress: computedProgress,
        status: computedStatus
      } : w));
      if (selectedWorkDetails?.id === work.id) {
        setSelectedWorkDetails(prev => prev ? {
          ...prev,
          actual_quantity: currentCount,
          completed_count: currentCount,
          progress: computedProgress,
          status: computedStatus
        } : null);
      }
      setNotificationMsg(`Item count (${currentCount}/${target}) saved for ${work.work_id}.`);
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err) {
      // Local fallback
      setWorks(prev => prev.map(w => w.id === work.id ? {
        ...w,
        actual_quantity: currentCount,
        progress: computedProgress,
        status: computedStatus
      } : w));
      setNotificationMsg(`Item count logged for ${work.work_id} (offline cache).`);
      setTimeout(() => setNotificationMsg(null), 3500);
    } finally {
      setSavingId(null);
    }
  };

  const handleSubmitBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockerWork || !blockerNote.trim()) return;

    setBlockerSubmitting(true);
    const reporterName = user?.first_name ? `${user.first_name} ${user.last_name}` : (user?.username || 'Operator');

    try {
      // 1. Post to backend escalations
      try {
        await apiClient.post('/escalations/', {
          name: `Blocker: ${blockerWork.work_id} - ${blockerCategory}`,
          status: 'Open',
          details: {
            work_id: blockerWork.work_id,
            work_pk: blockerWork.id,
            client: blockerWork.client_name,
            process: blockerWork.process_name,
            category: blockerCategory,
            priority: blockerPriority,
            notes: blockerNote,
            reporter: reporterName,
            timestamp: new Date().toISOString()
          }
        });
      } catch (apiErr) {
        console.warn("Escalations API fallback:", apiErr);
      }

      // 2. Sync to tl_escalations in localStorage for TL/Operations dashboard
      const savedEsc = localStorage.getItem('tl_escalations');
      const escalationsList = savedEsc ? JSON.parse(savedEsc) : [];
      const newEsc = {
        id: Date.now(),
        key: `ESC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `${blockerCategory}: ${blockerWork.work_id} (${blockerWork.client_name})`,
        description: blockerNote,
        priority: blockerPriority,
        status: 'Open',
        assignee: blockerWork.tl_name || 'Team Lead',
        related_work: blockerWork.work_id,
        reporter: reporterName,
        created_at: new Date().toISOString().split('T')[0]
      };
      localStorage.setItem('tl_escalations', JSON.stringify([newEsc, ...escalationsList]));

      setNotificationMsg(`Blocker reported for ${blockerWork.work_id} and escalated to ${blockerWork.tl_name || 'Team Lead'}.`);
      setTimeout(() => setNotificationMsg(null), 4000);
      setBlockerWork(null);
      setBlockerNote('');
    } catch (err: any) {
      setNotificationMsg('Failed to report blocker.');
      setTimeout(() => setNotificationMsg(null), 3000);
    } finally {
      setBlockerSubmitting(false);
    }
  };

  const filteredWorks = works.filter((w) => {
    const matchesSearch = (w.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (w.process_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (w.work_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || w.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <ClipboardList className="h-5 w-5 mr-2 text-brand-primary" />
            {isEmployee ? 'My Operational Work Queue' : 'Work Allocation Workspace'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isEmployee 
              ? 'Log deliverables completed, track target units, and report blockers in real-time.' 
              : 'Assign work targets, allocation buckets, and track work progress across operators.'}
          </p>
        </div>
        {canAllocate && (
          <button
            onClick={() => setShowAllocateModal(true)}
            className="flex items-center px-4 py-2 bg-brand-primary bg-brand-primary-hover text-white rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <Plus className="h-4 w-4 mr-2" />
            Allocate New Task
          </button>
        )}
      </div>

      {/* Notification banner */}
      {notificationMsg && (
        <div className="p-3 bg-brand-primary-light border border-brand-primary/30 text-brand-primary text-xs font-semibold rounded-xl flex justify-between items-center animate-in fade-in duration-200">
          <span className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {notificationMsg}
          </span>
          <button onClick={() => setNotificationMsg(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Client / Process / Batch ID..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 mr-2">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 mr-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="allocated">Allocated</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Work Batches List */}
      <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Work Item ID</th>
                  <th className="py-3 px-4">Client / Process</th>
                  {!isEmployee && <th className="py-3 px-4">Assignee</th>}
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Progress / Target</th>
                  {isEmployee && <th className="py-3 px-4 text-center">Log Units</th>}
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-755 font-medium text-slate-700 dark:text-slate-200">
                {filteredWorks.map((w) => {
                  const target = w.target_quantity || (w as any).target_count || 1;
                  const currentCount = operatorCounts[w.id] ?? (w.actual_quantity ?? (w as any).completed_count ?? 0);
                  const isStarted = w.status === 'in_progress' || w.status === 'completed';

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-755/30">
                      <td className="py-3 px-4 font-mono text-brand-primary font-bold">{w.work_id}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{w.client_name}</p>
                          <p className="text-xs text-slate-400 font-normal">{w.process_name} • {w.work_type}</p>
                        </div>
                      </td>
                      {!isEmployee && (
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-xs font-semibold">{w.employee_name || 'Unassigned'}</p>
                            <p className="text-[10px] text-slate-400">TL: {w.tl_name || 'Unassigned'}</p>
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-primary-light text-brand-primary capitalize">
                          {w.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 dark:bg-slate-750 h-2 rounded-full overflow-hidden">
                              <div className="bg-brand-primary h-full rounded-full transition-all" style={{ width: `${w.progress}%` }}></div>
                            </div>
                            <span className="text-xs font-bold font-mono">{w.progress}%</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {w.actual_quantity ?? (w as any).completed_count ?? 0} / {target} units
                          </p>
                        </div>
                      </td>

                      {/* Interactive operator counter column */}
                      {isEmployee && (
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleCountStep(w.id, -1, target)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-750 rounded text-slate-600 dark:text-slate-300 transition"
                              title="Decrease item count"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={currentCount}
                              onChange={(e) => handleCountDirect(w.id, parseInt(e.target.value) || 0, target)}
                              className="w-14 text-center font-mono font-bold text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded py-0.5"
                            />
                            <button
                              type="button"
                              onClick={() => handleCountStep(w.id, 1, target)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-750 rounded text-slate-600 dark:text-slate-300 transition"
                              title="Increment item count"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={savingId === w.id}
                              onClick={() => handleSaveProgress(w)}
                              className="ml-1 px-2.5 py-1 bg-brand-primary bg-brand-primary-hover text-white rounded font-bold text-[11px] flex items-center space-x-1 shadow-xs transition"
                              title="Save item count to system"
                            >
                              <Save className="h-3 w-3" />
                              <span>{savingId === w.id ? '...' : 'Save'}</span>
                            </button>
                          </div>
                        </td>
                      )}

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          w.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          w.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400' : 
                          'bg-slate-100 text-slate-600 border border-gray-200 dark:bg-slate-900 dark:text-slate-400'
                        }`}>
                          {w.status === 'in_progress' ? 'In Progress' : w.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {isEmployee && !isStarted && (
                            <button
                              onClick={() => handleStartWork(w)}
                              disabled={savingId === w.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center space-x-1 transition"
                              title="Start working on this batch"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span>Start</span>
                            </button>
                          )}
                          {isEmployee && (
                            <button
                              onClick={() => {
                                setBlockerWork(w);
                                setBlockerNote('');
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition"
                              title="Report Blocker / Escalation"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedWorkDetails(w)}
                            className="text-xs text-brand-primary hover:underline font-bold"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredWorks.length === 0 && (
                  <tr>
                    <td colSpan={isEmployee ? 7 : 8} className="text-center py-10 text-slate-400">
                      No operational batches matched your search/filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Blocker / Escalation Modal */}
      {blockerWork && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0 bg-rose-50/50 dark:bg-rose-950/20">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Report Operational Blocker</h3>
              </div>
              <button onClick={() => setBlockerWork(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBlocker} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 uppercase text-[10px] mb-1">Batch Reference</label>
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {blockerWork.work_id} • {blockerWork.client_name} ({blockerWork.process_name})
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] mb-1">Blocker Category</label>
                  <select
                    value={blockerCategory}
                    onChange={(e) => setBlockerCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    <option value="System Down / Access Issue">System Down / Access Issue</option>
                    <option value="Missing Requirements / Input Data">Missing Requirements / Input Data</option>
                    <option value="Client Guidelines / Specifications Unclear">Client Guidelines / Specifications Unclear</option>
                    <option value="Software / System Error">Software / System Error</option>
                    <option value="Network Latency / Connectivity Issue">Network Latency / Connectivity Issue</option>
                    <option value="Other Operational Blocker">Other Operational Blocker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] mb-1">Severity / Urgency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['medium', 'high', 'critical'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setBlockerPriority(p)}
                        className={`py-1.5 px-3 rounded-lg capitalize text-xs font-bold border transition ${
                          blockerPriority === p
                            ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] mb-1">Detailed Explanation</label>
                  <textarea
                    rows={4}
                    value={blockerNote}
                    onChange={(e) => setBlockerNote(e.target.value)}
                    placeholder="Describe exactly what is preventing you from completing this batch so your Team Lead can assist immediately..."
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end gap-2 bg-slate-50 dark:bg-slate-850">
                <button
                  type="button"
                  onClick={() => setBlockerWork(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 rounded-lg text-slate-650 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={blockerSubmitting || !blockerNote.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  {blockerSubmitting ? 'Submitting...' : 'Escalate Blocker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Task Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Allocate Operational Task</h3>
              <button onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 text-xs rounded-lg border border-red-200 shrink-0">
                {formError}
              </div>
            )}

            <form onSubmit={handleAllocateWork} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Searchable Client Dropdown */}
                  <div className="relative">
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Select Client</label>
                    <input
                      type="text"
                      value={clientSearch}
                      onFocus={() => { setShowClientDropdown(true); setShowProcessDropdown(false); setShowEmployeeDropdown(false); setShowTlDropdown(false); }}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setClientId('');
                      }}
                      placeholder="Type to search client..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      required={!clientId}
                    />
                    {showClientDropdown && (
                      <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-lg shadow-lg">
                        {clients
                          .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                          .map(c => (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => {
                                setClientId(c.id.toString());
                                setClientSearch(c.name);
                                setShowClientDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                            >
                              {c.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Searchable Process Dropdown */}
                  <div className="relative">
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Select Process</label>
                    <input
                      type="text"
                      value={processSearch}
                      onFocus={() => { setShowProcessDropdown(true); setShowClientDropdown(false); setShowEmployeeDropdown(false); setShowTlDropdown(false); }}
                      onChange={(e) => {
                        setProcessSearch(e.target.value);
                        setProcessId('');
                      }}
                      placeholder="Type to search process..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      required={!processId}
                    />
                    {showProcessDropdown && (
                      <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-lg shadow-lg">
                        {processes
                          .filter(p => p.name.toLowerCase().includes(processSearch.toLowerCase()) || p.process_id.toLowerCase().includes(processSearch.toLowerCase()))
                          .map(p => (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => {
                                setProcessId(p.id.toString());
                                setProcessSearch(`${p.name} (${p.process_id})`);
                                setShowProcessDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                            >
                              {p.name} ({p.process_id})
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Searchable Employee Dropdown */}
                  <div className="relative">
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Assign Employee</label>
                    <input
                      type="text"
                      value={employeeSearch}
                      onFocus={() => { setShowEmployeeDropdown(true); setShowClientDropdown(false); setShowProcessDropdown(false); setShowTlDropdown(false); }}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setEmployeeId('');
                      }}
                      placeholder="Type to search employee..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      required={!employeeId}
                    />
                    {showEmployeeDropdown && (
                      <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-lg shadow-lg">
                        {employees
                          .filter(e => e.user_details.role === 'employee')
                          .filter(e => `${e.user_details.first_name} ${e.user_details.last_name}`.toLowerCase().includes(employeeSearch.toLowerCase()))
                          .map(emp => (
                            <button
                              type="button"
                              key={emp.id}
                              onClick={() => {
                                setEmployeeId(emp.id.toString());
                                setEmployeeSearch(`${emp.user_details.first_name} ${emp.user_details.last_name}`);
                                setShowEmployeeDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                            >
                              {emp.user_details.first_name} {emp.user_details.last_name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Searchable Team Lead Dropdown */}
                  <div className="relative">
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Assign Team Lead</label>
                    <input
                      type="text"
                      value={tlSearch}
                      onFocus={() => { setShowTlDropdown(true); setShowClientDropdown(false); setShowProcessDropdown(false); setShowEmployeeDropdown(false); }}
                      onChange={(e) => {
                        setTlSearch(e.target.value);
                        setTlId('');
                      }}
                      placeholder="Type to search TL..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                    {showTlDropdown && (
                      <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-lg shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setTlId('');
                            setTlSearch('Unassigned');
                            setShowTlDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs text-slate-455 font-bold"
                        >
                          Unassigned
                        </button>
                        {employees
                          .filter(e => e.user_details.role === 'tl')
                          .filter(e => `${e.user_details.first_name} ${e.user_details.last_name}`.toLowerCase().includes(tlSearch.toLowerCase()))
                          .map(emp => (
                            <button
                              type="button"
                              key={emp.id}
                              onClick={() => {
                                setTlId(emp.id.toString());
                                setTlSearch(`${emp.user_details.first_name} ${emp.user_details.last_name}`);
                                setShowTlDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
                            >
                              {emp.user_details.first_name} {emp.user_details.last_name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Work Type</label>
                    <select
                      value={workType}
                      onChange={(e) => setWorkType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      <option value="Data Processing">Data Processing</option>
                      <option value="Verification & Audit">Verification & Audit</option>
                      <option value="Deliverable Production">Deliverable Production</option>
                      <option value="Quality Review">Quality Review</option>
                      <option value="Client Follow-up & Resolution">Client Follow-up & Resolution</option>
                      <option value="Documentation & Reporting">Documentation & Reporting</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Target Count</label>
                    <input
                      type="number"
                      value={targetCount}
                      onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                      min={1}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end gap-3 bg-slate-50 dark:bg-slate-850">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 rounded-lg text-slate-650 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-brand-primary bg-brand-primary-hover text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  {formSubmitting ? 'Allocating...' : 'Allocate Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedWorkDetails && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Batch Details ({selectedWorkDetails.work_id})</h3>
              <button onClick={() => setSelectedWorkDetails(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Client</p>
                  <p className="text-slate-900 dark:text-white text-sm font-bold mt-0.5">{selectedWorkDetails.client_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Process</p>
                  <p className="text-slate-900 dark:text-white text-sm font-bold mt-0.5">{selectedWorkDetails.process_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Work Type</p>
                  <p className="font-medium mt-0.5">{selectedWorkDetails.work_type}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Priority</p>
                  <p className="font-bold capitalize text-brand-primary mt-0.5">{selectedWorkDetails.priority}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Assignee</p>
                  <p className="font-semibold mt-0.5">{selectedWorkDetails.employee_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Supervisor TL</p>
                  <p className="font-semibold mt-0.5">{selectedWorkDetails.tl_name || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-slate-700 pt-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Target Count</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedWorkDetails.target_quantity || (selectedWorkDetails as any).target_count || 0} units
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Completed Count</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {operatorCounts[selectedWorkDetails.id] ?? (selectedWorkDetails.actual_quantity ?? (selectedWorkDetails as any).completed_count ?? 0)} units
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Progress Tracker</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 dark:bg-slate-755 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-brand-primary h-full rounded-full transition-all" style={{ width: `${selectedWorkDetails.progress}%` }}></div>
                  </div>
                  <span className="font-bold text-sm">{selectedWorkDetails.progress}%</span>
                </div>
              </div>

              {/* In-modal interactive logging for operator */}
              {isEmployee && (
                <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Quick Log Units</p>
                  <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleCountStep(selectedWorkDetails.id, -1, selectedWorkDetails.target_quantity || (selectedWorkDetails as any).target_count || 1)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-750 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={operatorCounts[selectedWorkDetails.id] ?? (selectedWorkDetails.actual_quantity ?? 0)}
                        onChange={(e) => handleCountDirect(selectedWorkDetails.id, parseInt(e.target.value) || 0, selectedWorkDetails.target_quantity || 1)}
                        className="w-16 text-center font-mono font-bold text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded py-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleCountStep(selectedWorkDetails.id, 1, selectedWorkDetails.target_quantity || (selectedWorkDetails as any).target_count || 1)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-750 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={savingId === selectedWorkDetails.id}
                      onClick={() => handleSaveProgress(selectedWorkDetails)}
                      className="px-3 py-1.5 bg-brand-primary bg-brand-primary-hover text-white rounded-lg font-bold text-xs flex items-center space-x-1 shadow-xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{savingId === selectedWorkDetails.id ? 'Saving...' : 'Save Count'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
              {isEmployee && (
                <button
                  type="button"
                  onClick={() => {
                    setBlockerWork(selectedWorkDetails);
                    setSelectedWorkDetails(null);
                  }}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs font-bold flex items-center space-x-1 transition"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Report Blocker</span>
                </button>
              )}
              <button
                onClick={() => setSelectedWorkDetails(null)}
                className="ml-auto px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-lg text-slate-700 dark:text-slate-200 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default BillingPage;
