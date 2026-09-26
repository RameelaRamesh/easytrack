import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { 
  Users, ClipboardList, Target, AlertTriangle, Check, Award, Eye, Plus, Edit,
  Download, Filter, Search, Calendar, ChevronRight, X, UserCheck, ShieldAlert,
  ArrowRight, KanbanSquare, CheckSquare, HelpCircle, Activity, Play, Settings, Lock, FileText
} from 'lucide-react';
import { EmployeeProfile, BillingWork, Project, Client } from '../../types';

export const Dashboard: React.FC = () => {
  // Navigation tabs within TL workspace
  const [activeTab, setActiveTab] = useState<'dashboard' | 'team' | 'allocation' | 'tasks' | 'projects' | 'sla' | 'escalations' | 'reports'>('dashboard');

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
    return saved ? JSON.parse(saved) : [
      { id: 1, key: 'TASK-101', title: 'Verify High-Value Apex Claim Batch', description: 'Double check codes for billing correctness.', status: 'in_progress', priority: 'high', assignee: 'EMP-005', project: 'Apex Claims Project', sla: '24h', created_at: '2026-08-25' },
      { id: 2, key: 'TASK-102', title: 'Denial Re-submission Audit', description: 'Review denial logic on error cases.', status: 'backlog', priority: 'critical', assignee: 'EMP-005', project: 'Beacon Payment Posting Project', sla: '12h', created_at: '2026-08-26' }
    ];
  });

  const [qaEnabled, setQaEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tl_qa_enabled') === 'true';
  });

  const [qaAssignee, setQaAssignee] = useState<string>(() => {
    return localStorage.getItem('tl_qa_assignee') || '';
  });

  const [escalations, setEscalations] = useState<any[]>(() => {
    const saved = localStorage.getItem('tl_escalations');
    return saved ? JSON.parse(saved) : [
      { id: 1, key: 'ESC-401', title: 'Apex Claim Eligibility Hold', description: 'Missing client document code files.', priority: 'high', status: 'Open', assignee: 'Sanjay Sharma (Ops Head)', related_work: 'WRK-001', created_at: '2026-08-25' }
    ];
  });

  const [dailyReports, setDailyReports] = useState<any[]>(() => {
    const saved = localStorage.getItem('tl_daily_reports');
    return saved ? JSON.parse(saved) : [];
  });

  // Reassignments Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('tl_audit_logs');
    return saved ? JSON.parse(saved) : [
      { id: 1, timestamp: new Date().toISOString(), action: 'QA_TOGGLE', actor: 'Vikram Rathore (TL)', details: 'QA workflow enabled across department claims.' }
    ];
  });

  // Work Allocation Form States
  const [allocationForm, setAllocationForm] = useState({
    client: 'Apex Health Partners',
    project: 'Apex Claims Project',
    process: 'Claims Verification',
    target: 50,
    priority: 'medium',
    due_date: '',
    employee_id: 'EMP-005'
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
      const [eRes, wRes, lRes, pRes] = await Promise.all([
        apiClient.get<EmployeeProfile[]>('/employees/'),
        apiClient.get<BillingWork[]>('/billing/'),
        apiClient.get<any[]>('/leave/'),
        apiClient.get<Project[]>('/projects/')
      ]);

      const fallbackEmployees = eRes.data.length > 0 ? eRes.data : [
        { id: 1, employee_id: 'EMP-001', user_details: { id: '1', username: 'ceo', email: 'ceo@medicalbilling.com', first_name: 'Ramesh', last_name: 'Kumar', role: 'ceo' }, department: 'Executive', designation: 'CEO', base_salary: 150000, status: 'active', leave_balance: 14 },
        { id: 2, employee_id: 'EMP-002', user_details: { id: '2', username: 'hrmanager', email: 'hr@medicalbilling.com', first_name: 'Aditi', last_name: 'Sharma', role: 'hr' }, department: 'HR', designation: 'HR Lead', base_salary: 65000, status: 'active', leave_balance: 18 },
        { id: 3, employee_id: 'EMP-003', user_details: { id: '3', username: 'opshead', email: 'ops@medicalbilling.com', first_name: 'Sanjay', last_name: 'Sharma', role: 'operations_head' }, department: 'Operations', designation: 'Ops Head', base_salary: 80000, status: 'active', leave_balance: 15 },
        { id: 4, employee_id: 'EMP-004', user_details: { id: '4', username: 'tl1', email: 'tl1@medicalbilling.com', first_name: 'Vikram', last_name: 'Rathore', role: 'tl' }, department: 'Claims', designation: 'Team Lead', base_salary: 50000, status: 'active', leave_balance: 12 },
        { id: 5, employee_id: 'EMP-005', user_details: { id: '5', username: 'emp3', email: 'emp3@medicalbilling.com', first_name: 'Neelam', last_name: 'Gupta', role: 'employee' }, department: 'Claims', designation: 'Billing Associate', base_salary: 30000, status: 'active', leave_balance: 10 }
      ];

      const fallbackLeaves = lRes.data.length > 0 ? lRes.data : [
        { id: 1, employee_name: 'Neelam Gupta', employee_id: 'EMP-005', start_date: '2026-08-28', end_date: '2026-08-29', leave_type: 'medical', reason: 'Flu symptoms', status: 'pending' }
      ];

      const fallbackWorks = wRes.data.length > 0 ? wRes.data : [
        { id: 1, work_id: 'WORK-101', client_name: 'Apex Health Partners', process_name: 'Claims Verification', work_type: 'Claim Processing', priority: 'high', due_date: '2026-08-30', target_quantity: 50, actual_quantity: 25, progress: 50, status: 'In Progress', employee_name: 'Neelam Gupta', tl_name: 'Vikram Rathore', estimated_effort_hours: 8, actual_effort_hours: 4 }
      ];

      const fallbackProjects = pRes.data.length > 0 ? pRes.data : [
        { id: 1, name: 'Apex Claims Project', client_name: 'Apex Health Partners', status: 'active', description: 'Standard claims processing and eligibility checking.' },
        { id: 2, name: 'Beacon Payment Posting Project', client_name: 'Beacon Medical Group', status: 'active', description: 'Processing daily medical payment posting and denial handling.' }
      ];

      // Direct reports filter: members belonging to department Claims/Coding reporting to TL Vikram Rathore
      setEmployees(fallbackEmployees.filter(e => e.department === 'Claims' || e.employee_id === 'EMP-005') as any[]);
      setWorks(fallbackWorks as any[]);
      setLeaves(fallbackLeaves);
      setProjects(fallbackProjects as any[]);
    } catch (err) {
      console.error(err);
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
  const teamCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'active').length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;
  const activeQueuesCount = works.length;
  const openEscalationsCount = escalations.filter(e => e.status === 'Open' || e.status === 'In Progress').length;

  const totalTargetClaims = works.reduce((sum, w) => sum + (w.target_quantity || w.target_count || 50), 0);
  const totalCompletedClaims = works.reduce((sum, w) => sum + (w.actual_quantity || w.completed_count || 25), 0);
  const teamAchievementRate = totalTargetClaims > 0 ? Math.round((totalCompletedClaims / totalTargetClaims) * 100) : 50;

  // Actions
  const handleRecommendLeave = async (id: number) => {
    try {
      await apiClient.patch(`/leave/${id}/`, {
        review_comments: 'Recommended by Team Lead Vikram Rathore.',
        reviewer_name: 'Vikram Rathore'
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
      client_name: allocationForm.client,
      process: 1,
      process_name: allocationForm.process,
      work_type: 'Claim Processing',
      priority: allocationForm.priority as any,
      status: 'Assigned',
      target_quantity: Number(allocationForm.target),
      actual_quantity: 0,
      progress: 0,
      employee_name: assignedEmp ? `${assignedEmp.user_details.first_name} ${assignedEmp.user_details.last_name}` : 'Neelam Gupta',
      tl_name: 'Vikram Rathore',
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
      actor: 'Vikram Rathore (TL)',
      details: `Allocated process ${allocationForm.process} to ${newWorkItem.employee_name} with target quantity ${allocationForm.target}.`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setMsg('Work assigned and allocated to employee checklist!');
  };

  const handleOpenReassignModal = (workId: number) => {
    const item = works.find(w => w.id === workId);
    if (!item) return;
    setReassignForm({ work_id: workId, new_employee_id: 'EMP-005', reason: '' });
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
      actor: 'Vikram Rathore (TL)',
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
      assignee: 'Sanjay Sharma (Ops Head)',
      related_work: escalationForm.related_work || 'WRK-001',
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
      actor: 'Vikram Rathore (TL)',
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
      actor: 'Vikram Rathore (TL)',
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
      actor: 'Vikram Rathore (TL)',
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
      submitter: 'Vikram Rathore (TL)',
      department: 'Claims',
      attendance_summary: `${activeCount} Present / 0 Absent`,
      claims_completed: totalCompletedClaims,
      claims_target: totalTargetClaims,
      remarks: reportRemarks || 'Daily claims quota processed successfully.',
      status: 'Submitted'
    };

    setDailyReports(prev => [newReport, ...prev]);
    setReportRemarks('');
    setMsg('Daily Operations Team Report submitted to Operations Head!');
  };

  const exportTeamPerformanceToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Employee ID,Name,Target Claims,Actual Completed,Achievement Rate,SLA Status"].join(",") + "\n"
      + employees.map(e => `${e.employee_id},${e.user_details.first_name} ${e.user_details.last_name},${totalTargetClaims},${totalCompletedClaims},${teamAchievementRate}%,On Track`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `easytrack_team_performance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Date Presets Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-normal">Team Lead Command Center</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">Allocate medical billing claims, coordinate QA audit loops, and track daily operational SLAs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={exportTeamPerformanceToCSV}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Download className="h-3.5 w-3.5 mr-2 text-brand-primary" />
            Export Team CSV
          </button>
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

      {/* TL Dashboard Tabs */}
      <div className="flex overflow-x-auto space-x-1 border-b border-gray-200 dark:border-slate-800 pb-px scrollbar-none">
        {[
          { id: 'dashboard', label: 'Operational Overview', icon: Activity },
          { id: 'team', label: 'My Direct Reports', icon: Users },
          { id: 'allocation', label: 'Work Allocation', icon: ClipboardList },
          { id: 'tasks', label: 'Jira Task board', icon: CheckSquare },
          { id: 'projects', label: 'Assigned Campaigns', icon: KanbanSquare },
          { id: 'sla', label: 'SLA Risk Center', icon: Target },
          { id: 'escalations', label: 'Escalations & QA config', icon: ShieldAlert },
          { id: 'reports', label: 'Operations Reports', icon: FileText }
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

      {/* Tab 1: Dashboard Operational Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-stretch">
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('team')}>
              <div className="p-3 bg-brand-primary-light text-brand-primary rounded-lg flex-shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Direct Reports</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{teamCount}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{activeCount} working today</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('allocation')}>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg flex-shrink-0 dark:bg-emerald-950/20">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Assigned Work</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{activeQueuesCount}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Active production queues</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('sla')}>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0 dark:bg-amber-950/20">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Team Accuracy</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{teamAchievementRate}%</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Monthly quota progress</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('escalations')}>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg flex-shrink-0 dark:bg-rose-950/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Escalations</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{openEscalationsCount}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Active blockers logged</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('tasks')}>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0 dark:bg-indigo-950/20">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Jira Issues</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{jiraTasks.length}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Assigned to team backlog</p>
              </div>
            </div>

          </div>

          {/* Operational summary banner */}
          <div className="p-4 bg-brand-primary-light border border-brand-primary/30 rounded-xl">
            <p className="text-xs font-medium text-brand-primary leading-relaxed">
              ◈ Operational summary: Today, {activeCount} direct agents are active. SLA quota progress stands at {teamAchievementRate}%. QA review loop is {qaEnabled ? 'ENABLED' : 'DISABLED'}. {openEscalationsCount} client escalation requires action.
            </p>
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

          </div>
        </div>
      )}

      {/* Tab 2: My Direct Reports */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Direct Reports Performance Matrix</h3>
                <p className="text-xs text-slate-500 mt-1">Review direct team targets, operational achievement, and QA eligibility.</p>
              </div>
              <button
                onClick={() => setShowTargetModal(true)}
                className="px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
              >
                Override Team Target
              </button>
            </div>

            {/* Target override Modal */}
            {showTargetModal && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <form onSubmit={handleTargetOverrideSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 p-6 w-full max-w-md space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Override Operational Target</h4>
                  
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
                    <label className="block text-[10px] uppercase font-bold text-slate-455">New Daily Claims Target</label>
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

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTargetModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Override Target
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto border border-gray-150 dark:border-slate-750 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-750 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Daily Target</th>
                    <th className="py-3 px-4">Completed output</th>
                    <th className="py-3 px-4">Achievement %</th>
                    <th className="py-3 px-4">Variance</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-750">
                  {employees.map(e => {
                    const variance = totalCompletedClaims - totalTargetClaims;
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-mono font-bold text-brand-primary">{e.employee_id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{e.user_details.first_name} {e.user_details.last_name}</td>
                        <td className="py-3 px-4 font-mono">{totalTargetClaims} Claims</td>
                        <td className="py-3 px-4 font-mono">{totalCompletedClaims} Claims</td>
                        <td className="py-3 px-4 font-bold text-emerald-600 font-mono">{teamAchievementRate}%</td>
                        <td className={`py-3 px-4 font-mono font-bold ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {variance >= 0 ? `+${variance}` : variance}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => { setSelectedEmp(e); setEmpDetailTab('performance'); }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold"
                          >
                            Review Matrix
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: Work Allocation workspace */}
      {activeTab === 'allocation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Allocation Form panel */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Allocate Production Claims</h3>
              <form onSubmit={handleCreateAllocation} className="space-y-3.5">
                
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Client</label>
                  <select
                    value={allocationForm.client}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, client: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    <option value="Apex Health Partners">Apex Health Partners</option>
                    <option value="Beacon Medical Group">Beacon Medical Group</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Associated Project</label>
                  <select
                    value={allocationForm.project}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, project: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    <option value="Apex Claims Project">Apex Claims Project</option>
                    <option value="Beacon Payment Posting Project">Beacon Payment Posting Project</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Process SOP</label>
                  <select
                    value={allocationForm.process}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, process: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    <option value="Claims Verification">Claims Verification</option>
                    <option value="Denial Audit SOP V2">Denial Audit SOP V2</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Claims Target</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={allocationForm.target}
                      onChange={(e) => setAllocationForm(prev => ({ ...prev, target: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Priority</label>
                    <select
                      value={allocationForm.priority}
                      onChange={(e) => setAllocationForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-455">Assign to Employee</label>
                  <select
                    value={allocationForm.employee_id}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, employee_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.employee_id}>{e.user_details.first_name} ({e.employee_id})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs hover:bg-brand-primary-hover transition"
                >
                  Allocate Claims Batch
                </button>
              </form>
            </div>

            {/* Active allocations lists and workload visibility */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4 lg:col-span-2">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Direct Report Workloads</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employees.map(e => {
                  const itemsCount = works.filter(w => w.employee_name?.includes(e.user_details.first_name)).length;
                  return (
                    <div key={e.id} className="p-3 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-900 dark:text-white">{e.user_details.first_name}</span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{itemsCount} Queue(s)</span>
                      </div>
                      {itemsCount > 3 ? (
                        <span className="text-[8px] uppercase tracking-wider text-rose-600 font-bold flex items-center">
                          ⚠️ Workload Balancing Alert: Over average quota
                        </span>
                      ) : (
                        <span className="text-[8px] uppercase tracking-wider text-emerald-600 font-bold">
                          ✓ Normal load capacity
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-3">Allocated Batches</h3>
                <div className="space-y-3">
                  {works.map(w => (
                    <div key={w.id} className="p-4 border border-gray-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono text-[9px] text-brand-primary font-bold">{w.work_id}</span>
                        <p className="font-semibold text-slate-800 dark:text-white mt-0.5">{w.client_name} - {w.process_name}</p>
                        <p className="text-[10px] text-slate-455 mt-0.5">Assignee: {w.employee_name} | Target: {w.target_quantity || w.target_count} claims</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenReassignModal(w.id)}
                          className="px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded font-bold text-[10px]"
                        >
                          Reassign Agent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Tab 4: Jira Task board */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Jira-Style Department Backlog</h3>
                <p className="text-xs text-slate-500 mt-1">Assign and coordinate process support tasks.</p>
              </div>
              <button
                onClick={() => {
                  const newTask = {
                    id: Date.now(),
                    key: `TASK-10${jiraTasks.length + 1}`,
                    title: 'Client SOP Readme verification',
                    description: 'Verify new updates in Noida office SOP guidelines.',
                    status: 'backlog',
                    priority: 'medium',
                    assignee: 'EMP-005',
                    project: 'Apex Claims Project',
                    sla: '48h',
                    created_at: new Date().toISOString().split('T')[0]
                  };
                  setJiraTasks(prev => [newTask, ...prev]);
                  setMsg('New support task added to backlog.');
                }}
                className="flex items-center px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Jira Task
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              
              {/* Backlog Column */}
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-750 rounded-xl space-y-3 flex flex-col min-h-[300px]">
                <h4 className="font-bold text-xs uppercase text-slate-455 border-b border-gray-200 dark:border-slate-800 pb-1.5">Backlog</h4>
                {jiraTasks.filter(t => t.status === 'backlog').map(t => (
                  <div key={t.id} className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-750 rounded-lg space-y-2 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-brand-primary text-[9px]">{t.key}</span>
                      <button
                        onClick={() => {
                          setJiraTasks(prev => prev.map(item => item.id === t.id ? { ...item, status: 'in_progress' } : item));
                        }}
                        className="px-1.5 py-0.5 bg-slate-950 text-white rounded font-bold text-[9px] flex items-center"
                      >
                        Start <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* In Progress Column */}
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-750 rounded-xl space-y-3 flex flex-col min-h-[300px]">
                <h4 className="font-bold text-xs uppercase text-slate-455 border-b border-gray-200 dark:border-slate-800 pb-1.5">In Progress</h4>
                {jiraTasks.filter(t => t.status === 'in_progress').map(t => (
                  <div key={t.id} className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-750 rounded-lg space-y-2 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-brand-primary text-[9px]">{t.key}</span>
                      <button
                        onClick={() => {
                          setJiraTasks(prev => prev.map(item => item.id === t.id ? { ...item, status: 'completed' } : item));
                        }}
                        className="px-1.5 py-0.5 bg-emerald-600 text-white rounded font-bold text-[9px]"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completed Column */}
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-750 rounded-xl space-y-3 flex flex-col min-h-[300px]">
                <h4 className="font-bold text-xs uppercase text-slate-455 border-b border-gray-200 dark:border-slate-800 pb-1.5">Completed</h4>
                {jiraTasks.filter(t => t.status === 'completed').map(t => (
                  <div key={t.id} className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-750 rounded-lg space-y-1 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                    <span className="font-mono font-bold text-slate-455 text-[9px]">{t.key}</span>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Tab 5: Assigned Campaigns */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">Corporate Campaigns & Client Progress</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(p => {
                const target = 100;
                const actual = 82;
                const progress = 82;
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProject(p); setProjDetailTab('overview'); }}
                    className="p-5 border border-gray-150 dark:border-slate-750 hover:border-brand-primary bg-slate-50/50 dark:bg-slate-900 rounded-xl cursor-pointer hover:shadow transition duration-150"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{p.name}</h4>
                        <p className="text-xs text-slate-500">Client: {p.client_name}</p>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase">
                        {p.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-slate-455">
                        <span>Claims volume: {actual} / {target}</span>
                        <span className="font-bold text-brand-primary">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-750 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-primary h-full rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Tab 6: SLA Risk Center */}
      {activeTab === 'sla' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">Active Operational SLAs & Breach Risk Alerts</h3>
            
            <div className="space-y-3">
              {works.map(w => (
                <div key={w.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] text-brand-primary font-bold">{w.work_id}</span>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{w.client_name} - {w.process_name}</h4>
                    <p className="text-[10px] text-slate-500">Owner: {w.employee_name} | Due date: {w.due_date}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">Remaining Time: 4h 30m</p>
                      <p className="text-[10px] text-slate-400">Target volume: {w.target_quantity || w.target_count} claims</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold uppercase text-[9px]">
                      At Risk
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Tab 7: Escalations & QA settings */}
      {activeTab === 'escalations' && (
        <div className="space-y-6">
          
          {/* QA settings block */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Department Quality Assurance (QA) Configuration</h3>
                <p className="text-xs text-slate-500 mt-1">Configure whether claims must go through audit checks before submission.</p>
              </div>
              <button
                onClick={handleToggleQAWorkflow}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  qaEnabled 
                    ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                    : 'bg-brand-primary text-slate-950 hover:bg-brand-primary-hover'
                }`}
              >
                {qaEnabled ? 'Disable QA workflow' : 'Enable QA workflow'}
              </button>
            </div>

            {qaEnabled && (
              <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-750 space-y-3.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div>
                    <h4 className="font-bold">QA Auditor Assignment</h4>
                    <p className="text-slate-500 mt-0.5">Assign quality verification access permissions to an agent.</p>
                  </div>
                  <select
                    value={qaAssignee}
                    onChange={(e) => handleAssignQARole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs"
                  >
                    <option value="">Choose Agent</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.employee_id}>{e.user_details.first_name} ({e.employee_id})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Active Blockers & Escalations Queue</h3>
                <p className="text-xs text-slate-500 mt-1">Raise support tickets to Noida operations center.</p>
              </div>
              <button
                onClick={() => setShowEscalationModal(true)}
                className="flex items-center px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Log Escalation
              </button>
            </div>

            {/* Raise Escalation Modal */}
            {showEscalationModal && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <form onSubmit={handleRaiseEscalation} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 p-6 w-full max-w-md space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Log Operational Escalation</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Escalation Issue Summary</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Noida server link connectivity failure"
                      value={escalationForm.title}
                      onChange={(e) => setEscalationForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Priority</label>
                    <select
                      value={escalationForm.priority}
                      onChange={(e) => setEscalationForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Detailed Description</label>
                    <textarea
                      required
                      placeholder="List details of the blocker..."
                      value={escalationForm.description}
                      onChange={(e) => setEscalationForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEscalationModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
                    >
                      File Escalation
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {escalations.map(esc => (
                <div key={esc.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        esc.priority === 'high' || esc.priority === 'critical' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
                      }`}>{esc.priority} Priority</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">{esc.title} ({esc.key})</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Assignee: {esc.assignee}</span>
                  </div>
                  <p className="text-xs text-slate-550 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-750 leading-relaxed font-normal">{esc.description}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Tab 8: Operations Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">Submit Daily Team Operations Report</h3>
            <p className="text-xs text-slate-500">Auto-populates direct reports metrics. Add final qualitative remarks.</p>
            
            <form onSubmit={handleSubmitDailyReport} className="space-y-4 max-w-xl text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-150 dark:border-slate-750">
                <div>
                  <p className="text-slate-400">Total Active Staff</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{activeCount} Present</p>
                </div>
                <div>
                  <p className="text-slate-400">Claims target quota</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{totalCompletedClaims} / {totalTargetClaims} Completed</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-455">Operational Comments & Remarks</label>
                <textarea
                  required
                  placeholder="Summarize blockages, process feedback, or SLA performance indexes..."
                  value={reportRemarks}
                  onChange={(e) => setReportRemarks(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg"
              >
                Submit Daily Report
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-3">Submitted Reports Log</h3>
            <div className="space-y-3">
              {dailyReports.map(rep => (
                <div key={rep.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold font-mono">{rep.date}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">Submitted</span>
                  </div>
                  <p className="font-semibold">{rep.remarks}</p>
                </div>
              ))}
              {dailyReports.length === 0 && (
                <p className="text-slate-400 text-center py-4 text-xs font-semibold">No daily reports recorded this month.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- REASSIGNMENT MODAL ----------------- */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <form onSubmit={handleReassignSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 p-6 w-full max-w-md space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Reallocate Active Claims Batch</h4>
            
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
                placeholder="Agent overload, leave adjustment, Noida process shifting..."
                value={reassignForm.reason}
                onChange={(e) => setReassignForm(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
              >
                Reallocate Batch
              </button>
            </div>
          </form>
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
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Claims target output</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans">Monthly Target</p>
                      <p className="font-bold">{totalTargetClaims} Claims</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans">Completed Output</p>
                      <p className="font-bold text-emerald-600">{totalCompletedClaims} Claims</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans">Achievement Rate</p>
                      <p className="font-bold text-emerald-650">{teamAchievementRate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans">Variance Index</p>
                      <p className="font-bold">+{totalCompletedClaims - totalTargetClaims}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {empDetailTab === 'work' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Assigned production claims</h4>
                {works.filter(w => w.employee_name?.toLowerCase().includes(selectedEmp.user_details.first_name.toLowerCase())).map(rec => (
                  <div key={rec.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-750 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{rec.client_name} - {rec.process_name}</p>
                      <p className="text-[10px] text-slate-455">Target: {rec.target_quantity || rec.target_count} claims</p>
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
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 dark:border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] text-xs">
              
              {/* Modal Header */}
              <div className="p-6 bg-slate-950 text-white flex justify-between items-start border-b border-slate-800">
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
                    <p className="leading-relaxed font-normal">{selectedProject.description || 'Standard Claims Verification processing.'}</p>
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
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Claims queues</p>
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
