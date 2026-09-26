import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { 
  Users, ClipboardList, Target, AlertTriangle, Check, Award, Eye, Plus, Edit,
  Download, Filter, Search, Calendar, ChevronRight, X, UserCheck, ShieldAlert,
  ArrowRight, KanbanSquare, CheckSquare, HelpCircle, Activity, Play, Settings, Lock, FileText, Clock, UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmployeeProfile, BillingWork, Project, Client } from '../../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core Data States
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Selected elements for Drawers/Modals
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [empDetailTab, setEmpDetailTab] = useState<'performance' | 'work' | 'attendance'>('performance');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projDetailTab, setProjDetailTab] = useState<'overview' | 'team' | 'work' | 'escalations'>('overview');

  // Local Storage Mock states for TL actions
  const [jiraTasks, setJiraTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('tl_jira_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [qaEnabled, setQaEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tl_qa_enabled') === 'true';
  });

  const [qaAssignee, setQaAssignee] = useState<string>(() => {
    return localStorage.getItem('tl_qa_assignee') || '';
  });

  const [escalations, setEscalations] = useState<any[]>(() => {
    const saved = localStorage.getItem('tl_escalations');
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyReports, setDailyReports] = useState<any[]>(() => {
    const saved = localStorage.getItem('tl_daily_reports');
    return saved ? JSON.parse(saved) : [];
  });

  // Reassignments Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('tl_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Work Allocation Form States
  const [allocationForm, setAllocationForm] = useState({
    client: '',
    project: '',
    process: '',
    target: 50,
    priority: 'medium',
    due_date: '',
    employee_id: ''
  });

  const [reassignForm, setReassignForm] = useState({
    work_id: 0,
    new_employee_id: '',
    reason: ''
  });
  const [showReassignModal, setShowReassignModal] = useState(false);

  const [escalationForm, setEscalationForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    related_work: ''
  });
  const [showEscalationModal, setShowEscalationModal] = useState(false);

  const [reportRemarks, setReportRemarks] = useState('');

  // Target overrides state
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetForm, setTargetForm] = useState({ employee_id: '', new_target: 100, reason: '' });

  const loadTLData = async () => {
    setLoading(true);
    try {
      const [eRes, wRes, lRes, pRes, aRes] = await Promise.all([
        apiClient.get<EmployeeProfile[]>('/employees/'),
        apiClient.get<BillingWork[]>('/billing/'),
        apiClient.get<any[]>('/leave/'),
        apiClient.get<Project[]>('/projects/'),
        apiClient.get<any[]>('/audit/').catch(() => ({ data: [] }))
      ]);

      setEmployees(eRes.data || []);
      setWorks(wRes.data || []);
      setLeaves(lRes.data || []);
      setProjects(pRes.data || []);
      const logs = Array.isArray(aRes.data) ? aRes.data : (aRes.data as any)?.results || [];
      if (logs.length > 0) setAuditLogs(logs);
    } catch (err) {
      console.error(err);
      setEmployees([]);
      setWorks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTLData();
  }, []);

  // Sync state modifications to storage
  useEffect(() => {
    localStorage.setItem('tl_jira_tasks', JSON.stringify(jiraTasks));
  }, [jiraTasks]);

  useEffect(() => {
    localStorage.setItem('tl_qa_enabled', String(qaEnabled));
  }, [qaEnabled]);

  useEffect(() => {
    localStorage.setItem('tl_qa_assignee', qaAssignee);
  }, [qaAssignee]);

  useEffect(() => {
    localStorage.setItem('tl_escalations', JSON.stringify(escalations));
  }, [escalations]);

  useEffect(() => {
    localStorage.setItem('tl_daily_reports', JSON.stringify(dailyReports));
  }, [dailyReports]);

  useEffect(() => {
    localStorage.setItem('tl_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Operational metrics calculations
  const nonCeoEmployees = employees.filter(e => e.user_details?.role !== 'ceo');
  const teamCount = nonCeoEmployees.length;
  const activeCount = nonCeoEmployees.filter(e => e.status === 'active').length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;
  const activeQueuesCount = works.length;
  const openEscalationsCount = escalations.filter(e => e.status === 'Open' || e.status === 'In Progress').length;

  const totalTargetUnits = works.reduce((sum, w) => sum + (w.target_quantity || w.target_count || 50), 0);
  const totalCompletedUnits = works.reduce((sum, w) => sum + (w.actual_quantity || w.completed_count || 25), 0);
  const teamAchievementRate = totalTargetUnits > 0 ? Math.round((totalCompletedUnits / totalTargetUnits) * 100) : 50;


  // Actions
  const handleRecommendLeave = async (id: number) => {
    try {
      await apiClient.patch(`/leave/${id}/`, {
        review_comments: 'Recommended by Team Lead.',
        reviewer_name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Team Lead'
      });
      setMsg('Leave request successfully recommended to HR!');
      loadTLData();
    } catch (err) {
      setMsg('Leave marked as recommended locally.');
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'recommended', review_comments: 'Recommended by Team Lead.' } : l));
    }
  };

  const handleCreateAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedEmp = employees.find(emp => emp.employee_id === allocationForm.employee_id);
    const newWorkItem: BillingWork = {
      id: Date.now(),
      work_id: `WRK-00${works.length + 1}`,
      client: 1,
      client_name: allocationForm.client || 'Client',
      process: 1,
      process_name: allocationForm.process || 'Process',
      work_type: 'Deliverable Production',
      priority: allocationForm.priority as any,
      status: 'Assigned',
      target_quantity: Number(allocationForm.target),
      actual_quantity: 0,
      progress: 0,
      employee_name: assignedEmp ? `${assignedEmp.user_details.first_name} ${assignedEmp.user_details.last_name}` : 'Employee',
      tl_name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Team Lead',
      due_date: allocationForm.due_date || new Date().toISOString().split('T')[0],
      estimated_effort_hours: 8,
      actual_effort_hours: 0
    };

    setWorks(prev => [newWorkItem, ...prev]);
    
    // Log audit trail
    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'WORK_ALLOCATION',
      actor: user?.first_name ? `${user.first_name} (TL)` : 'Team Lead',
      details: `Allocated process ${allocationForm.process} to ${newWorkItem.employee_name} with target quantity ${allocationForm.target}.`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setMsg('Work assigned and allocated to employee checklist!');
  };

  const handleOpenReassignModal = (workId: number) => {
    const item = works.find(w => w.id === workId);
    if (!item) return;
    setReassignForm({ work_id: workId, new_employee_id: '', reason: '' });
    setShowReassignModal(true);
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignForm.reason) return;
    
    const newEmp = employees.find(emp => emp.employee_id === reassignForm.new_employee_id);
    if (!newEmp) return;

    setWorks(prev => prev.map(w => {
      if (w.id === reassignForm.work_id) {
        return {
          ...w,
          employee_name: `${newEmp.user_details.first_name} ${newEmp.user_details.last_name}`,
          status: 'Assigned'
        };
      }
      return w;
    }));

    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'WORK_REASSIGNMENT',
      actor: user?.first_name ? `${user.first_name} (TL)` : 'Team Lead',
      details: `Reassigned work ID ${reassignForm.work_id} to ${newEmp.user_details.first_name}. Reason: ${reassignForm.reason}`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setShowReassignModal(false);
    setMsg('Work reassigned successfully and logged in audit trails.');
  };

  const handleRaiseEscalation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationForm.title || !escalationForm.description) return;
    
    const newEsc = {
      id: Date.now(),
      key: `ESC-40${escalations.length + 1}`,
      title: escalationForm.title,
      description: escalationForm.description,
      priority: escalationForm.priority,
      status: 'Open',
      assignee: 'Operations Head',
      related_work: escalationForm.related_work || '',
      created_at: new Date().toISOString().split('T')[0]
    };

    setEscalations(prev => [newEsc, ...prev]);
    setShowEscalationModal(false);
    setEscalationForm({ title: '', description: '', priority: 'medium', related_work: '' });
    setMsg('Escalation ticket submitted to Operations Head!');
  };

  const handleToggleQAWorkflow = () => {
    const nextVal = !qaEnabled;
    setQaEnabled(nextVal);
    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'QA_CONFIG_CHANGED',
      actor: user?.first_name ? `${user.first_name} (TL)` : 'Team Lead',
      details: `QA workflow config toggled to ${nextVal ? 'ENABLED' : 'DISABLED'}.`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setMsg(`QA verification workflow is now ${nextVal ? 'enabled' : 'disabled'}.`);
  };

  const handleAssignQARole = (empId: string) => {
    setQaAssignee(empId);
    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'QA_ASSIGNEE_CHANGED',
      actor: user?.first_name ? `${user.first_name} (TL)` : 'Team Lead',
      details: `Assigned additional QA verification permissions to employee ${empId}.`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setMsg(`Additional QA verification permissions granted to ${empId}.`);
  };

  const handleTargetOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetForm.employee_id) return;
    
    // Log target override log in audit log
    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'TARGET_OVERRIDDEN',
      actor: user?.first_name ? `${user.first_name} (TL)` : 'Team Lead',
      details: `Overrode daily target for ${targetForm.employee_id} to ${targetForm.new_target}. Reason: ${targetForm.reason}`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setShowTargetModal(false);
    setTargetForm({ employee_id: '', new_target: 100, reason: '' });
    setMsg('Operational target overridden and audit trail updated.');
  };

  const handleSubmitDailyReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      submitter: user?.first_name ? `${user.first_name} (TL)` : 'Team Lead',
      department: 'Operations',
      attendance_summary: `${activeCount} Present / 0 Absent`,
      units_completed: totalCompletedUnits,
      units_target: totalTargetUnits,
      remarks: reportRemarks || 'Daily deliverables target processed successfully.',
      status: 'Submitted'
    };

    setDailyReports(prev => [newReport, ...prev]);
    setReportRemarks('');
    setMsg('Daily Operations Team Report submitted to Operations Head!');
  };

  const exportTeamPerformanceToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Employee ID,Name,Target Deliverables,Actual Completed,Achievement Rate,SLA Status"].join(",") + "\n"
      + employees.map(e => `${e.employee_id},${e.user_details.first_name} ${e.user_details.last_name},${totalTargetUnits},${totalCompletedUnits},${teamAchievementRate}%,On Track`).join("\n");
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `easytrack_team_performance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mouse drag scroll helpers for horizontal tab bar
  const handleDragScrollMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    container.setAttribute('data-is-down', 'true');
    container.setAttribute('data-start-x', String(e.pageX - container.offsetLeft));
    container.setAttribute('data-scroll-left', String(container.scrollLeft));
  };
  const handleDragScrollMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.removeAttribute('data-is-down');
  };
  const handleDragScrollMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.removeAttribute('data-is-down');
  };
  const handleDragScrollMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.getAttribute('data-is-down') !== 'true') return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const startX = Number(container.getAttribute('data-start-x'));
    const scrollLeft = Number(container.getAttribute('data-scroll-left'));
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {msg && (
        <div className="p-4 bg-brand-primary-light border border-brand-primary/30 text-brand-primary text-xs font-medium rounded-xl flex justify-between items-center">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="p-0.5 hover:bg-black/5 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Normal Dashboard Operational Overview */}
      <div className="space-y-6">
          {/* WORKFORCE TELEMETRY (Merged Greeting & 5 Pill Cards) */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome, Team Lead
                </h1>
              </div>
              <button
                onClick={exportTeamPerformanceToCSV}
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Download className="h-3.5 w-3.5 mr-2 text-brand-primary" />
                Export Team CSV
              </button>
            </div>

            {/* 5 Pill Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 items-stretch">
            
            {/* 1. Total Headcount */}
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Headcount</span>
                <div className="p-1.5 bg-brand-primary-light text-brand-primary rounded-lg shrink-0">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-none">
                  {teamCount} <span className="text-xs font-normal text-slate-400">Members</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Direct team reports</p>
              </div>
            </div>

            {/* 2. Present */}
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-950/40 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Present</span>
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg shrink-0">
                  <UserCheck className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-none font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400">{activeCount}</span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                  <span className="text-slate-400">{teamCount}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{activeCount} Present today</p>
              </div>
            </div>

            {/* 3. Absent */}
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-950/40 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</span>
                <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg shrink-0">
                  <Clock className="h-4 w-4 text-rose-500" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-none font-mono">
                  <span className="text-rose-600 dark:text-rose-400">{Math.max(0, teamCount - activeCount)}</span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                  <span className="text-slate-400">{teamCount}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{Math.max(0, teamCount - activeCount)} Absent today</p>
              </div>
            </div>

            {/* 4. Active */}
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-950/40 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-brand-primary uppercase tracking-wider">Active</span>
                <div className="p-1.5 bg-brand-primary-light text-brand-primary rounded-lg shrink-0">
                  <Activity className="h-4 w-4 text-indigo-500" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-none font-mono">
                  <span className="text-brand-primary">{activeCount}</span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                  <span className="text-slate-400">{teamCount}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{activeCount} Active accounts</p>
              </div>
            </div>

            {/* 5. Inactive */}
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Inactive</span>
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg shrink-0">
                  <Activity className="h-4 w-4 opacity-50" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-none font-mono">
                  <span className="text-slate-600 dark:text-slate-300">{Math.max(0, teamCount - activeCount)}</span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                  <span className="text-slate-400">{teamCount}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{Math.max(0, teamCount - activeCount)} Inactive accounts</p>
              </div>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Direct reports list */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4 md:col-span-2">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Direct Reports Overview</h3>
              <div className="divide-y divide-gray-100 dark:divide-slate-750">
                {employees.map(e => (
                  <div key={e.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{e.user_details.first_name} {e.user_details.last_name}</p>
                      <p className="text-[10px] text-slate-400">ID: {e.employee_id} • Designation: {e.designation}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submissions queue shortcuts */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Active Queue Logs</h3>
              <div className="space-y-3">
                {works.slice(0, 3).map(w => (
                  <div key={w.id} className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-slate-450 font-bold">{w.work_id}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold">{w.status}</span>
                    </div>
                    <p className="font-semibold">{w.client_name} • {w.process_name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Log shortcuts */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 pb-2">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Recent Activities & Team Audit</h3>
                <Link to="/audit" className="text-xs font-bold text-brand-primary hover:underline">View All</Link>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {auditLogs.slice(0, 6).map((log, idx) => (
                  <div key={log.id || idx} className="text-[11px] leading-relaxed border-b border-gray-150 dark:border-slate-700 pb-2">
                    <span className="text-slate-400 font-mono text-[9px] block">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}</span>
                    <p className="font-medium text-slate-750 dark:text-slate-200 mt-0.5">{log.details || log.action}</p>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-slate-400 text-center py-4 text-xs font-medium">No team audit logs recorded yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      {/* Target override Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-205 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Override Operational Target</h4>
              <button onClick={() => setShowTargetModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTargetOverrideSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Agent Reference</label>
                  <select
                    value={targetForm.employee_id}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, employee_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.employee_id}>{e.user_details.first_name} ({e.employee_id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">New Daily Deliverables Target</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={targetForm.new_target}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, new_target: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Override Reason</label>
                  <textarea
                    required
                    placeholder="Batch size adjustment, client backlog, training phase..."
                    value={targetForm.reason}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end gap-3 bg-slate-50 dark:bg-slate-850">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-655 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Override Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ----------------- REASSIGNMENT MODAL ----------------- */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-205 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Reallocate Active Deliverables Batch</h4>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Select New Agent</label>
                  <select
                    value={reassignForm.new_employee_id}
                    onChange={(e) => setReassignForm(prev => ({ ...prev, new_employee_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.employee_id}>{e.user_details.first_name} ({e.employee_id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Reassignment reason</label>
                  <textarea
                    required
                    placeholder="Agent overload, leave adjustment, workload shifting..."
                    value={reassignForm.reason}
                    onChange={(e) => setReassignForm(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end gap-3 bg-slate-50 dark:bg-slate-850">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Reallocate Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- DIRECT REPORT performance DRAWER ----------------- */}
      {selectedEmp && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-800 shadow-2xl border-l border-gray-200 dark:border-slate-700 z-50 flex flex-col h-full text-xs">
          
          {/* Drawer Header */}
          <div className="p-6 bg-slate-950 text-white flex justify-between items-start border-b border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] tracking-wider text-slate-400 font-medium uppercase">{selectedEmp.employee_id}</span>
              <h3 className="text-base font-semibold leading-normal">{selectedEmp.user_details.first_name} {selectedEmp.user_details.last_name}</h3>
              <p className="text-xs text-slate-350">{selectedEmp.designation} • {selectedEmp.department}</p>
            </div>
            <button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Tab Strip */}
          <div className="flex border-b border-gray-150 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 px-4">
            {['performance', 'work', 'attendance'].map((tab) => (
              <button
                key={tab}
                onClick={() => setEmpDetailTab(tab as any)}
                className={`px-4 py-3 font-semibold transition border-b-2 capitalize ${
                  empDetailTab === tab 
                    ? 'border-brand-primary text-brand-primary font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700 dark:text-slate-200">
            
            {empDetailTab === 'performance' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl space-y-3 border border-gray-100 dark:border-slate-750">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Deliverables target output</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans">Monthly Target</p>
                      <p className="font-bold">{totalTargetUnits} Units</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans">Completed Output</p>
                      <p className="font-bold text-emerald-600">{totalCompletedUnits} Units</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans">Achievement Rate</p>
                      <p className="font-bold text-emerald-650">{teamAchievementRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans">Variance Index</p>
                      <p className="font-bold">+{totalCompletedUnits - totalTargetUnits}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {empDetailTab === 'work' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Assigned production deliverables</h4>
                {works.filter(w => w.employee_name?.toLowerCase().includes(selectedEmp.user_details.first_name.toLowerCase())).map(rec => (
                  <div key={rec.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-750 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{rec.client_name} - {rec.process_name}</p>
                      <p className="text-[10px] text-slate-455">Target: {rec.target_quantity || rec.target_count} units</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">{rec.status}</span>
                  </div>
                ))}
              </div>
            )}


            {empDetailTab === 'attendance' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Team punch history</h4>
                <div className="p-4 border border-gray-150 dark:border-slate-750 rounded-xl space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-750">
                    <span className="text-slate-400">Shift</span>
                    <span className="font-semibold">Day Shift</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-750 font-semibold text-emerald-600">
                    <span className="text-slate-400">Attendance Status</span>
                    <span>Present</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-end border-t border-gray-150 dark:border-slate-750">
            <button
              onClick={() => setSelectedEmp(null)}
              className="px-5 py-2 bg-slate-950 text-white rounded-lg font-bold"
            >
              Close Record
            </button>
          </div>

        </div>
      )}

      {/* ----------------- PROJECT DETAIL MODAL ----------------- */}
      {selectedProject && (() => {
        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-205 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col my-auto text-xs animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-6 bg-slate-950 text-white flex justify-between items-start border-b border-slate-800 shrink-0">
                <div className="space-y-1">
                  <span className="text-[10px] tracking-wider text-slate-400 font-medium uppercase">Project record file</span>
                  <h3 className="text-lg font-semibold leading-normal">{selectedProject.name}</h3>
                  <p className="text-xs text-slate-350">Client: {selectedProject.client_name} • Status: {selectedProject.status}</p>
                </div>
                <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Tab Strip */}
              <div className="flex border-b border-gray-150 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 px-4">
                {['overview', 'team', 'work'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setProjDetailTab(t as any)}
                    className={`px-4 py-3 font-semibold transition border-b-2 capitalize ${
                      projDetailTab === t 
                        ? 'border-brand-primary text-brand-primary font-bold' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Modal Scrollable Contents */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700 dark:text-slate-200">
                {projDetailTab === 'overview' && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Campaign Overview</p>
                    <p className="leading-relaxed font-normal">{selectedProject.description || 'Standard Operations and Deliverables processing.'}</p>
                  </div>
                )}

                {projDetailTab === 'team' && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Direct Agents Allocated</p>
                    <div className="divide-y divide-gray-100 dark:divide-slate-750">
                      {employees.map(e => (
                        <div key={e.id} className="py-2.5 flex justify-between items-center">
                          <span>{e.user_details.first_name} {e.user_details.last_name}</span>
                          <span className="text-slate-400 font-semibold">{e.designation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {projDetailTab === 'work' && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Work queues</p>

                    {works.filter(w => w.client_name === selectedProject.client_name).map(w => (
                      <div key={w.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-150 dark:border-slate-750 flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{w.process_name} ({w.work_id})</p>
                          <p className="text-[10px] text-slate-455">Owner: {w.employee_name}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">{w.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-end border-t border-gray-150 dark:border-slate-750">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-5 py-2 bg-slate-950 text-white rounded-lg font-bold"
                >
                  Close Detail
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
export default Dashboard;
