import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { 
  Users, ClipboardList, Target, ShieldAlert, FolderKanban, UserSquare2, MessageSquare,
  CheckSquare, ChevronRight, Plus, Download, Filter, Search, Calendar, ChevronLeft,
  Lock, Trash2, Play, HelpCircle, Activity, UserCheck, AlertTriangle, ArrowRight,
  FileText, Settings, BookOpen, Clock, ChevronDown, X
} from 'lucide-react';
import { BillingWork, EmployeeProfile, Client, Process, Project } from '../../types';

export const Dashboard: React.FC = () => {
  // Navigation tabs within Operations Head panel
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'projects' | 'queues' | 'teams' | 'tasks' | 'escalations' | 'documents'>('dashboard');

  // Core Data States (Fetched from backend)
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [dbClients, setDbClients] = useState<Client[]>([]);
  const [dbProcesses, setDbProcesses] = useState<Process[]>([]);
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Selected elements for drawers and workspaces
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientWorkspaceTab, setClientWorkspaceTab] = useState<'overview' | 'projects' | 'processes' | 'sop' | 'team'>('overview');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [projDetailTab, setProjDetailTab] = useState<'overview' | 'team' | 'work' | 'tasks' | 'escalations'>('overview');

  // Form states for creation
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', client_id: '', industry: 'Medical Billing', status: 'active', renewal_date: '', notes: '' });
  const [showAddProcessModal, setShowAddProcessModal] = useState(false);
  const [newProcess, setNewProcess] = useState({ name: '', process_id: '', daily_target: 50, sla: '24h', priority: 'medium', sop_text: '' });
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client_name: '', process_name: '', volume: 10000, target_date: '', priority: 'medium', tl_name: '' });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ project_id: 1, tl_name: 'Vikram Rathore', target: 1000, due_date: '', priority: 'medium' });

  // Reassignments and Targets States (Mocked & Persisted locally)
  const [jiraTasks, setJiraTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('ops_jira_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, key: 'TASK-201', title: 'Verify Apex Claims SLA Compliance', description: 'Review why processing volume dipped on Tuesday.', status: 'in_progress', priority: 'high', assignee: 'Vikram Rathore (TL)', project: 'Apex Claims Project', due_date: '2026-08-30' },
      { id: 2, key: 'TASK-202', title: 'Denial Management SOP V2 Rollout', description: 'Train TLs on updated denials logic.', status: 'backlog', priority: 'critical', assignee: 'Meera Joshi (TL)', project: 'Beacon Payment Posting Project', due_date: '2026-09-02' }
    ];
  });

  const [escalations, setEscalations] = useState<any[]>(() => {
    const saved = localStorage.getItem('ops_escalations');
    return saved ? JSON.parse(saved) : [
      { id: 1, key: 'ESC-501', title: 'Apex Claims Data Link Down', description: 'Noida office reported VPN failure connecting to client portal.', priority: 'critical', status: 'Open', reporter: 'Vikram Rathore (TL)', assignee: 'Sanjay Sharma (Ops)', created_at: '2026-08-25' }
    ];
  });

  const [sopDocuments, setSopDocuments] = useState<any[]>(() => {
    const saved = localStorage.getItem('ops_sop_documents');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Apex Claims Verification Guide', version: 'V1.4', effective_date: '2026-01-15', status: 'active', process: 'Claims Verification' },
      { id: 2, title: 'Beacon Payment Posting Procedures', version: 'V2.1', effective_date: '2026-06-20', status: 'active', process: 'Payment Posting' }
    ];
  });

  const [dailyReports, setDailyReports] = useState<any[]>(() => {
    const saved = localStorage.getItem('ops_daily_reports');
    return saved ? JSON.parse(saved) : [
      { id: 1, date: '2026-08-25', tl: 'Vikram Rathore', department: 'Claims', completed: 820, target: 1000, status: 'Reviewed', remarks: 'Slight delay due to VPN downtime.' }
    ];
  });

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('ops_audit_logs');
    return saved ? JSON.parse(saved) : [
      { id: 1, timestamp: new Date().toISOString(), action: 'PORTAL_ACTIVE', actor: 'Sanjay Sharma (Ops Head)', details: 'Operations portal loaded successfully.' }
    ];
  });

  // Filters
  const [clientSearch, setClientSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const loadAllOpsData = async () => {
    setLoading(true);
    try {
      const [wRes, eRes, cRes, pRes, projRes] = await Promise.all([
        apiClient.get<BillingWork[]>('/billing/'),
        apiClient.get<EmployeeProfile[]>('/employees/'),
        apiClient.get<Client[]>('/clients/'),
        apiClient.get<Process[]>('/processes/'),
        apiClient.get<Project[]>('/projects/')
      ]);

      const fallbackEmployees = eRes.data.length > 0 ? eRes.data : [
        { id: 1, employee_id: 'EMP-001', user_details: { id: '1', username: 'ceo', email: 'ceo@medicalbilling.com', first_name: 'Ramesh', last_name: 'Kumar', role: 'ceo' }, department: 'Executive', designation: 'CEO', base_salary: 150000, status: 'active', leave_balance: 14 },
        { id: 2, employee_id: 'EMP-002', user_details: { id: '2', username: 'hrmanager', email: 'hr@medicalbilling.com', first_name: 'Aditi', last_name: 'Sharma', role: 'hr' }, department: 'HR', designation: 'HR Lead', base_salary: 65000, status: 'active', leave_balance: 18 },
        { id: 3, employee_id: 'EMP-003', user_details: { id: '3', username: 'opshead', email: 'ops@medicalbilling.com', first_name: 'Sanjay', last_name: 'Sharma', role: 'operations_head' }, department: 'Operations', designation: 'Ops Head', base_salary: 80000, status: 'active', leave_balance: 15 },
        { id: 4, employee_id: 'EMP-004', user_details: { id: '4', username: 'tl1', email: 'tl1@medicalbilling.com', first_name: 'Vikram', last_name: 'Rathore', role: 'tl' }, department: 'Claims', designation: 'Team Lead', base_salary: 50000, status: 'active', leave_balance: 12 },
        { id: 5, employee_id: 'EMP-005', user_details: { id: '5', username: 'emp3', email: 'emp3@medicalbilling.com', first_name: 'Neelam', last_name: 'Gupta', role: 'employee' }, department: 'Claims', designation: 'Billing Associate', base_salary: 30000, status: 'active', leave_balance: 10 }
      ];

      const fallbackClients = cRes.data.length > 0 ? cRes.data : [
        { id: 1, client_id: 'CLI-APEX', name: 'Apex Health Partners', status: 'active', ops_head_name: 'Sanjay Sharma', tl_name: 'Vikram Rathore' },
        { id: 2, client_id: 'CLI-BEAC', name: 'Beacon Medical Group', status: 'active', ops_head_name: 'Sanjay Sharma', tl_name: 'Meera Joshi' }
      ];

      const fallbackProcesses = pRes.data.length > 0 ? pRes.data : [
        { id: 1, process_id: 'PRC-001', name: 'Claims Verification', client: 1, client_name: 'Apex Health Partners', target: 50, status: 'active', sop: 'Verify claim details against patient record.' },
        { id: 2, process_id: 'PRC-002', name: 'Payment Posting', client: 2, client_name: 'Beacon Medical Group', target: 30, status: 'active', sop: 'Post received checks to patient ledgers.' }
      ];

      const fallbackWorks = wRes.data.length > 0 ? wRes.data : [
        { id: 1, work_id: 'WRK-001', client: 1, client_name: 'Apex Health Partners', process: 1, process_name: 'Claims Verification', work_type: 'Verification', priority: 'high', due_date: '2026-08-30', target_quantity: 50, actual_quantity: 25, progress: 50, status: 'in_progress', employee_name: 'Neelam Gupta', tl_name: 'Vikram Rathore', estimated_effort_hours: 8, actual_effort_hours: 4 }
      ];

      const fallbackProjects = projRes.data.length > 0 ? projRes.data : [
        { id: 1, name: 'Apex Claims Project', client: 1, client_name: 'Apex Health Partners', status: 'active', description: 'Standard claims processing and eligibility checking.' },
        { id: 2, name: 'Beacon Payment Posting Project', client: 2, client_name: 'Beacon Medical Group', status: 'active', description: 'Processing daily medical payment posting and denial handling.' }
      ];

      setWorks(fallbackWorks as any[]);
      setEmployees(fallbackEmployees as any[]);
      setDbClients(fallbackClients as any[]);
      setDbProcesses(fallbackProcesses as any[]);
      setDbProjects(fallbackProjects as any[]);
    } catch (err) {
      console.error("Error loading Operations data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllOpsData();
  }, []);

  // Sync state modifications to local storage
  useEffect(() => {
    localStorage.setItem('ops_jira_tasks', JSON.stringify(jiraTasks));
  }, [jiraTasks]);

  useEffect(() => {
    localStorage.setItem('ops_escalations', JSON.stringify(escalations));
  }, [escalations]);

  useEffect(() => {
    localStorage.setItem('ops_sop_documents', JSON.stringify(sopDocuments));
  }, [sopDocuments]);

  useEffect(() => {
    localStorage.setItem('ops_daily_reports', JSON.stringify(dailyReports));
  }, [dailyReports]);

  useEffect(() => {
    localStorage.setItem('ops_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Operations Head metrics calculations
  const totalClients = dbClients.length;
  const totalProjects = dbProjects.length;
  const totalTLs = employees.filter(e => e.user_details.role === 'tl').length;
  const totalStaffCount = employees.length;

  const totalTargetQuantity = works.reduce((sum, w) => sum + (w.target_quantity || w.target_count || 50), 0);
  const totalActualQuantity = works.reduce((sum, w) => sum + (w.actual_quantity || w.completed_count || 25), 0);
  const overallTargetRate = totalTargetQuantity > 0 ? Math.round((totalActualQuantity / totalTargetQuantity) * 100) : 50;

  const openEscalations = escalations.filter(e => e.status === 'Open' || e.status === 'In Progress').length;

  // Actions
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.client_id) return;
    const clientItem: Client = {
      id: Date.now(),
      client_id: newClient.client_id,
      name: newClient.name,
      status: newClient.status as any,
      ops_head: 'opshead',
      ops_head_name: 'Sanjay Sharma',
      tl: 'tl1',
      tl_name: 'Vikram Rathore'
    };

    setDbClients(prev => [...prev, clientItem]);
    setShowAddClientModal(false);
    setNewClient({ name: '', client_id: '', industry: 'Medical Billing', status: 'active', renewal_date: '', notes: '' });
    
    // Log to audit log
    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'CLIENT_CREATION',
      actor: 'Sanjay Sharma (Ops Head)',
      details: `Registered new medical billing client account: ${clientItem.name} (${clientItem.client_id})`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setMsg('New client account registered successfully.');
  };

  const handleCreateProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcess.name || !newProcess.process_id) return;
    const processItem: Process = {
      id: Date.now(),
      process_id: newProcess.process_id,
      name: newProcess.name,
      client: selectedClient ? selectedClient.id : 1,
      client_name: selectedClient ? selectedClient.name : 'Apex Health Partners',
      target: Number(newProcess.daily_target),
      status: 'active',
      sop: newProcess.sop_text || 'Standard Verification instructions.'
    };

    setDbProcesses(prev => [...prev, processItem]);
    setShowAddProcessModal(false);
    setNewProcess({ name: '', process_id: '', daily_target: 50, sla: '24h', priority: 'medium', sop_text: '' });
    
    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'PROCESS_CREATION',
      actor: 'Sanjay Sharma (Ops Head)',
      details: `Added process code ${processItem.process_id} under client ${processItem.client_name}`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setMsg('Medical Billing process SOP registered.');
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;
    const projectItem: Project = {
      id: Date.now(),
      name: newProject.name,
      client: 1,
      client_name: newProject.client_name || 'Apex Health Partners',
      status: 'active',
      description: `Billing project using process ${newProject.process_name}. Target lead: ${newProject.tl_name || 'Vikram Rathore'}`
    };

    setDbProjects(prev => [...prev, projectItem]);
    setShowAddProjectModal(false);
    setNewProject({ name: '', client_name: '', process_name: '', volume: 10000, target_date: '', priority: 'medium', tl_name: '' });

    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'PROJECT_CREATION',
      actor: 'Sanjay Sharma (Ops Head)',
      details: `Created project ${projectItem.name} under client ${projectItem.client_name}`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setMsg('New operational campaign project launched!');
  };

  const handleAssignProjectToTL = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = dbProjects.find(p => p.id === assignForm.project_id);
    if (!proj) return;

    // Log target project assignment in audit log
    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'PROJECT_ASSIGNED_TO_TL',
      actor: 'Sanjay Sharma (Ops Head)',
      details: `Assigned project ${proj.name} to Team Lead ${assignForm.tl_name} with target quota of ${assignForm.target} claims.`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setShowAssignModal(false);
    setMsg(`Assigned campaign ${proj.name} successfully to TL ${assignForm.tl_name}.`);
  };

  const handleResolveEscalation = (id: number) => {
    setEscalations(prev => prev.map(esc => esc.id === id ? { ...esc, status: 'Resolved' } : esc));
    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'ESCALATION_RESOLVED',
      actor: 'Sanjay Sharma (Ops Head)',
      details: `Resolved operational escalation ticket ID: ${id}`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setMsg('Escalation resolved successfully.');
  };

  const handleReviewTLReport = (id: number) => {
    setDailyReports(prev => prev.map(rep => rep.id === id ? { ...rep, status: 'Reviewed' } : rep));
    setMsg('Daily Operations Team Report reviewed and archived.');
  };

  // CSV Exporters
  const exportClientsToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Client ID,Client Name,Status,Ops Head,Team Lead"].join(",") + "\n"
      + dbClients.map(c => `${c.client_id},${c.name},${c.status},${c.ops_head_name},${c.tl_name}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `easytrack_clients_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportProjectsToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Project Name,Client,Status,Description"].join(",") + "\n"
      + dbProjects.map(p => `${p.name},${p.client_name},${p.status},${p.description || ''}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `easytrack_projects_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Date presets header block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-normal font-sans">Operations Command Center</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">Administer client profiles, define workflow SOPs, allocate project queues, and inspect daily TL reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={exportProjectsToCSV}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Download className="h-3.5 w-3.5 mr-2 text-brand-primary" />
            Export Campaigns CSV
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

      {/* Tabs strip */}
      <div className="flex overflow-x-auto space-x-1 border-b border-gray-200 dark:border-slate-800 pb-px scrollbar-none">
        {[
          { id: 'dashboard', label: 'Operations Dashboard', icon: Activity },
          { id: 'clients', label: 'Clients & Processes', icon: UserSquare2 },
          { id: 'projects', label: 'Project Campaigns', icon: FolderKanban },
          { id: 'queues', label: 'Work Operations Queue', icon: ClipboardList },
          { id: 'teams', label: 'Teams & TL Reports', icon: Users },
          { id: 'tasks', label: 'Jira Task board', icon: CheckSquare },
          { id: 'escalations', label: 'Escalations & SLA risks', icon: ShieldAlert },
          { id: 'documents', label: 'SOP Versioning', icon: BookOpen }
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

      {/* Tab 1: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-stretch">
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('clients')}>
              <div className="p-3 bg-brand-primary-light text-brand-primary rounded-lg flex-shrink-0">
                <UserSquare2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Active Clients</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{totalClients}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">SLA profiles verified</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('projects')}>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg flex-shrink-0 dark:bg-emerald-950/20">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Active Projects</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{totalProjects}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Department campaigns</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('teams')}>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0 dark:bg-amber-950/20">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Active TLs</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{totalTLs}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{totalStaffCount} total agents</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('escalations')}>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg flex-shrink-0 dark:bg-rose-950/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Open Escalations</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{openEscalations}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">VPN/Claims blockers</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => setActiveTab('queues')}>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0 dark:bg-indigo-950/20">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-455 capitalize">Queue Target Rate</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{overallTargetRate}%</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Overall claims verified</p>
              </div>
            </div>

          </div>

          {/* Operations summary banner */}
          <div className="p-4 bg-brand-primary-light border border-brand-primary/30 rounded-xl">
            <p className="text-xs font-medium text-brand-primary leading-relaxed font-sans">
              ◈ Operations summary: Today, {totalClients} client accounts and {totalProjects} active projects are running. Production target rate stands at {overallTargetRate}%. {openEscalations} critical VPN blocker remains active. 1 TL report awaits validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Active Clients */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4 md:col-span-2">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Active Clients Directory</h3>
              <div className="divide-y divide-gray-100 dark:divide-slate-750">
                {dbClients.map(c => (
                  <div key={c.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-400">ID: {c.client_id} • Assigned Lead: {c.tl_name || 'Vikram Rathore'}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Log shortcuts */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">Operations Audit Trails</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {auditLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="text-[11px] leading-relaxed border-b border-gray-150 dark:border-slate-700 pb-2">
                    <span className="text-slate-400 font-mono text-[9px] block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <p className="font-medium text-slate-750 dark:text-slate-200 mt-0.5">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Clients & Processes */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Medical Clients</h3>
                <p className="text-xs text-slate-500 mt-1">Manage billing organization profiles and SLAs.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportClientsToCSV}
                  className="px-3 py-1.5 border border-gray-300 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 rounded text-xs font-semibold"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => setShowAddClientModal(true)}
                  className="flex items-center px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Client
                </button>
              </div>
            </div>

            {/* Add Client Modal */}
            {showAddClientModal && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <form onSubmit={handleCreateClient} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 p-6 w-full max-w-md space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white font-sans">Add Client Account</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Client ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CLI-APEX"
                      value={newClient.client_id}
                      onChange={(e) => setNewClient(prev => ({ ...prev, client_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Client Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Health Partners"
                      value={newClient.name}
                      onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddClientModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Register Client
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbClients.map(c => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedClient(c); setClientWorkspaceTab('overview'); }}
                  className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 hover:border-brand-primary rounded-xl cursor-pointer hover:shadow transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h4>
                      <p className="text-xs text-slate-455">ID: {c.client_id} • Target lead: {c.tl_name}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-250">
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Active Campaigns</h3>
                <p className="text-xs text-slate-500 mt-1">Convert process guidelines into target campaigns.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold"
                >
                  Assign Campaign to TL
                </button>
                <button
                  onClick={() => setShowAddProjectModal(true)}
                  className="flex items-center px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Launch Project
                </button>
              </div>
            </div>

            {/* Launch Project Modal */}
            {showAddProjectModal && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <form onSubmit={handleCreateProject} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 p-6 w-full max-w-md space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Launch Campaign Project</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Project Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Claims verification"
                      value={newProject.name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-455">Client Account</label>
                      <select
                        value={newProject.client_name}
                        onChange={(e) => setNewProject(prev => ({ ...prev, client_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      >
                        {dbClients.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-455">Process SOP</label>
                      <select
                        value={newProject.process_name}
                        onChange={(e) => setNewProject(prev => ({ ...prev, process_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      >
                        {dbProcesses.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Assign Team Lead</label>
                    <select
                      value={newProject.tl_name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, tl_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      <option value="Vikram Rathore">Vikram Rathore</option>
                      <option value="Meera Joshi">Meera Joshi</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProjectModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Launch Campaign
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Assign Project to TL Modal */}
            {showAssignModal && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <form onSubmit={handleAssignProjectToTL} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 p-6 w-full max-w-md space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Assign Campaign to Team Lead</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Select Campaign Project</label>
                    <select
                      value={assignForm.project_id}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, project_id: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      {dbProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Assign to TL</label>
                    <select
                      value={assignForm.tl_name}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, tl_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      <option value="Vikram Rathore">Vikram Rathore</option>
                      <option value="Meera Joshi">Meera Joshi</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Active Claims Volume Target</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={assignForm.target}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, target: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Confirm Assignment
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbProjects.map(p => {
                const progress = 82;
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProject(p); setProjDetailTab('overview'); }}
                    className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 hover:border-brand-primary rounded-xl cursor-pointer hover:shadow transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white font-sans">{p.name}</h4>
                        <p className="text-xs text-slate-455">Client Account: {p.client_name}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-250">
                        {p.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Project Progress</span>
                        <span className="font-bold">{progress}%</span>
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

      {/* Tab 4: Work Operations Queue */}
      {activeTab === 'queues' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Organization-wide Work Queue</h3>
            
            <div className="space-y-3">
              {works.map(w => (
                <div key={w.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] text-brand-primary font-bold">{w.work_id}</span>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{w.client_name} - {w.process_name}</h4>
                    <p className="text-[10px] text-slate-455">Assigned Agent: {w.employee_name || 'Awaiting Allocation'} • TL Lead: {w.tl_name}</p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold">Target: {w.target_quantity || w.target_count} claims</p>
                      <p className="text-[10px] text-brand-primary">{w.progress}% completed</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase text-[10px]">
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Tab 5: Teams & TL Reports */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          
          {/* TL report review queue */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">TL Daily Operations Reports review</h3>
            <div className="space-y-3">
              {dailyReports.map(rep => (
                <div key={rep.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-brand-primary font-mono">{rep.date}</span>
                      <span className="text-slate-400">• Submitter: {rep.tl} ({rep.department})</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 font-medium">{rep.remarks}</p>
                    <p className="text-[10px] text-slate-455">Completed Volume: {rep.completed} / {rep.target} Claims</p>
                  </div>
                  
                  <div>
                    {rep.status === 'Submitted' ? (
                      <button
                        onClick={() => handleReviewTLReport(rep.id)}
                        className="px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded text-xs"
                      >
                        Approve & Archive
                      </button>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase">
                        Reviewed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Active Team Leads Matrix</h3>
            <div className="divide-y divide-gray-100 dark:divide-slate-750">
              {employees.filter(e => e.user_details.role === 'tl').map(tl => (
                <div key={tl.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{tl.user_details.first_name} {tl.user_details.last_name}</h4>
                    <p className="text-[10px] text-slate-400">ID: {tl.employee_id} • Assigned Department: {tl.department}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 6: Jira Task board */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Operations Jira board</h3>
                <p className="text-xs text-slate-500 mt-1">Assign operational tasks to Team Leads.</p>
              </div>
              <button
                onClick={() => {
                  const newTask = {
                    id: Date.now(),
                    key: `TASK-20${jiraTasks.length + 1}`,
                    title: 'Review Apex Denial Escalation Log',
                    description: 'Verify if recent codes comply with contract rules.',
                    status: 'backlog',
                    priority: 'high',
                    assignee: 'Vikram Rathore (TL)',
                    project: 'Apex Claims Project',
                    due_date: '2026-09-05'
                  };
                  setJiraTasks(prev => [newTask, ...prev]);
                  setMsg('Added new task to TL backlog.');
                }}
                className="flex items-center px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Jira Task
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch text-xs">
              
              {/* Backlog */}
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-750 rounded-xl space-y-3 flex flex-col min-h-[300px]">
                <h4 className="font-bold text-xs uppercase text-slate-455 border-b border-gray-200 dark:border-slate-800 pb-1.5">Backlog</h4>
                {jiraTasks.filter(t => t.status === 'backlog').map(t => (
                  <div key={t.id} className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-750 rounded-lg space-y-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono font-bold text-brand-primary">{t.key}</span>
                      <button
                        onClick={() => setJiraTasks(prev => prev.map(item => item.id === t.id ? { ...item, status: 'in_progress' } : item))}
                        className="px-1.5 py-0.5 bg-slate-950 text-white rounded font-bold"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* In Progress */}
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-750 rounded-xl space-y-3 flex flex-col min-h-[300px]">
                <h4 className="font-bold text-xs uppercase text-slate-455 border-b border-gray-200 dark:border-slate-800 pb-1.5">In Progress</h4>
                {jiraTasks.filter(t => t.status === 'in_progress').map(t => (
                  <div key={t.id} className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-750 rounded-lg space-y-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono font-bold text-brand-primary">{t.key}</span>
                      <button
                        onClick={() => setJiraTasks(prev => prev.map(item => item.id === t.id ? { ...item, status: 'completed' } : item))}
                        className="px-1.5 py-0.5 bg-emerald-600 text-white rounded font-bold"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completed */}
              <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-750 rounded-xl space-y-3 flex flex-col min-h-[300px]">
                <h4 className="font-bold text-xs uppercase text-slate-455 border-b border-gray-200 dark:border-slate-800 pb-1.5">Completed</h4>
                {jiraTasks.filter(t => t.status === 'completed').map(t => (
                  <div key={t.id} className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-750 rounded-lg space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                    <span className="font-mono font-bold text-slate-455 text-[9px]">{t.key}</span>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Tab 7: Escalations & SLA risks */}
      {activeTab === 'escalations' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Operational Escalations</h3>
            
            <div className="space-y-3">
              {escalations.map(esc => (
                <div key={esc.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold uppercase border border-rose-250">{esc.priority} Priority</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">{esc.title} ({esc.key})</h4>
                      <p className="text-xs text-slate-455 mt-0.5">Reported by: {esc.reporter} | Assigned: {esc.assignee}</p>
                    </div>
                    {esc.status === 'Open' ? (
                      <button
                        onClick={() => handleResolveEscalation(esc.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                      >
                        Resolve Blocker
                      </button>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase">
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-550 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-750 leading-relaxed font-normal">{esc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: SOP Versioning */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Active Client SOPs & Guidelines</h3>
                <p className="text-xs text-slate-500 mt-1">Version control for medical billing guidelines.</p>
              </div>
              <button
                onClick={() => {
                  const doc = {
                    id: Date.now(),
                    title: 'New Billing Guidelines SOP V3',
                    version: `V${sopDocuments.length + 1}.0`,
                    effective_date: new Date().toISOString().split('T')[0],
                    status: 'active',
                    process: 'Claims Verification'
                  };
                  setSopDocuments(prev => [doc, ...prev]);
                  setMsg('Uploaded new version of billing SOP guidelines.');
                }}
                className="flex items-center px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
              >
                Upload SOP Version
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {sopDocuments.map(doc => (
                <div key={doc.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{doc.title}</h4>
                      <p className="text-xs text-slate-455">Process: {doc.process} • Version: {doc.version}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-250">
                      {doc.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 border-t border-gray-100 dark:border-slate-800 pt-2 flex justify-between items-center">
                    <span>Effective: {doc.effective_date}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ----------------- CLIENT WORKSPACE DIALOG DRAWER ----------------- */}
      {selectedClient && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-800 shadow-2xl border-l border-gray-200 dark:border-slate-700 z-50 flex flex-col h-full text-xs">
          
          {/* Header */}
          <div className="p-6 bg-slate-950 text-white flex justify-between items-start border-b border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] tracking-wider text-slate-400 font-medium uppercase">{selectedClient.client_id}</span>
              <h3 className="text-base font-semibold leading-normal">{selectedClient.name}</h3>
              <p className="text-xs text-slate-350">Status: {selectedClient.status} • Assigned TL: {selectedClient.tl_name}</p>
            </div>
            <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer tabs */}
          <div className="flex border-b border-gray-150 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 px-4">
            {['overview', 'projects', 'processes', 'sop'].map((tab) => (
              <button
                key={tab}
                onClick={() => setClientWorkspaceTab(tab as any)}
                className={`px-4 py-3 font-semibold transition border-b-2 capitalize ${
                  clientWorkspaceTab === tab 
                    ? 'border-brand-primary text-brand-primary font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Scrollable contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700 dark:text-slate-200">
            {clientWorkspaceTab === 'overview' && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Client Account Profile</p>
                <p className="leading-relaxed font-normal">Active medical billing agreement for billing services. Operational support Noida center.</p>
              </div>
            )}

            {clientWorkspaceTab === 'projects' && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Assigned Projects</p>
                {dbProjects.filter(p => p.client_name === selectedClient.name).map(p => (
                  <div key={p.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-150 dark:border-slate-750 flex justify-between items-center">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">{p.status}</span>
                  </div>
                ))}
              </div>
            )}

            {clientWorkspaceTab === 'processes' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">Associated Billing Processes</p>
                  <button
                    onClick={() => setShowAddProcessModal(true)}
                    className="px-2.5 py-1 bg-brand-primary text-slate-950 font-bold rounded text-[10px]"
                  >
                    Add Process SOP
                  </button>
                </div>

                {/* Add Process Modal */}
                {showAddProcessModal && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-750 space-y-3.5">
                    <h4 className="font-bold">Add Process Guideline</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Process Code (e.g. PRC-003)"
                        value={newProcess.process_id}
                        onChange={(e) => setNewProcess(prev => ({ ...prev, process_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Process Name (e.g. Charge Entry)"
                        value={newProcess.name}
                        onChange={(e) => setNewProcess(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded text-xs"
                      />
                      <textarea
                        placeholder="SOP Guidelines text..."
                        value={newProcess.sop_text}
                        onChange={(e) => setNewProcess(prev => ({ ...prev, sop_text: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAddProcessModal(false)} className="px-3 py-1 bg-gray-100 text-slate-700 rounded text-[10px]">Cancel</button>
                        <button type="button" onClick={handleCreateProcess} className="px-3 py-1 bg-brand-primary text-slate-950 rounded text-[10px] font-bold">Save Process</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {dbProcesses.filter(p => p.client_name === selectedClient.name).map(p => (
                    <div key={p.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-150 dark:border-slate-750 space-y-1">
                      <p className="font-semibold">{p.name} ({p.process_id})</p>
                      <p className="text-[10px] text-slate-500">SOP: {p.sop}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clientWorkspaceTab === 'sop' && (
              <div className="space-y-3">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Active SOP Documents</p>
                {sopDocuments.filter(d => d.process.includes('Claims') || d.process.includes('Payment')).map(doc => (
                  <div key={doc.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-150 dark:border-slate-750 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{doc.title}</p>
                      <p className="text-[10px] text-slate-400">Ver: {doc.version} | Effective: {doc.effective_date}</p>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">{doc.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-end border-t border-gray-150 dark:border-slate-750">
            <button
              onClick={() => setSelectedClient(null)}
              className="px-5 py-2 bg-slate-950 text-white rounded-lg font-bold"
            >
              Close Client Workspace
            </button>
          </div>

        </div>
      )}

      {/* ----------------- PROJECT DETAIL MODAL ----------------- */}
      {selectedProject && (() => {
        return (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 dark:border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] text-xs">
              
              <div className="p-6 bg-slate-950 text-white flex justify-between items-start border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] tracking-wider text-slate-400 font-medium uppercase">Project record details</span>
                  <h3 className="text-lg font-semibold leading-normal">{selectedProject.name}</h3>
                  <p className="text-xs text-slate-350">Client: {selectedProject.client_name} • Status: {selectedProject.status}</p>
                </div>
                <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

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

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700 dark:text-slate-200">
                {projDetailTab === 'overview' && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Campaign Overview</p>
                    <p className="leading-relaxed font-normal">{selectedProject.description || 'Medical claims verification project.'}</p>
                  </div>
                )}

                {projDetailTab === 'team' && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Assigned operational leads</p>
                    <div className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-150 rounded-xl">
                      <p className="font-semibold">Vikram Rathore (Team Lead)</p>
                      <p className="text-slate-400">Claims verification lead Noida center</p>
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
