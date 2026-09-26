import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { 
  Users, ClipboardList, Target, ShieldAlert, FolderKanban, UserSquare2, MessageSquare,
  CheckSquare, ChevronRight, Plus, Download, Filter, Search, Calendar, ChevronLeft,
  Lock, Trash2, Play, HelpCircle, Activity, UserCheck, AlertTriangle, ArrowRight,
  FileText, Settings, BookOpen, Clock, ChevronDown, X, Key, UserPlus, Laptop, Briefcase
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { BillingWork, EmployeeProfile, Client, Process, Project } from '../../types';

interface DashboardProps {
  focusAccessControl?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ focusAccessControl }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Navigation tabs within Operations Head panel
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'projects' | 'queues' | 'teams' | 'tasks' | 'escalations' | 'documents'>('dashboard');

  useEffect(() => {
    if (focusAccessControl) {
      setTimeout(() => {
        const el = document.getElementById('access-control');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  }, [focusAccessControl]);


  // Core Data States (Fetched from backend)
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [dbClients, setDbClients] = useState<Client[]>([]);
  const [dbProcesses, setDbProcesses] = useState<Process[]>([]);
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Give Access Modal state for Operations Head
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [targetEmp, setTargetEmp] = useState<EmployeeProfile | null>(null);
  const [targetRole, setTargetRole] = useState<'hr' | 'tl' | 'employee'>('hr');
  const [giveUsername, setGiveUsername] = useState('');
  const [givePassword, setGivePassword] = useState('');
  const [giveEmail, setGiveEmail] = useState('');
  const [accessMsg, setAccessMsg] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);

  const openGiveAccessModal = (emp?: EmployeeProfile, defaultRole: 'hr' | 'tl' | 'employee' = 'hr') => {
    setTargetEmp(emp || null);
    const roleToUse = emp ? (emp.user_details.role as any) : defaultRole;
    setTargetRole(roleToUse);
    setGiveUsername(emp ? emp.user_details.username : '');
    setGiveEmail(emp ? emp.user_details.email : '');
    
    const otp = "OTP-" + Math.floor(100000 + Math.random() * 900000);
    setGivePassword(otp);
    setAccessMsg(null);
    setShowAccessModal(true);
  };

  const handleGrantAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessLoading(true);
    setAccessMsg(null);
    try {
      const res = await apiClient.post('/auth/give-access/', {
        target_user_id: targetEmp ? targetEmp.user_details.id : undefined,
        role: targetRole,
        new_username: giveUsername.trim() || undefined,
        one_time_password: givePassword.trim() || undefined,
        email: giveEmail.trim() || undefined,
      });

      setAccessMsg({
        type: 'success',
        text: res.data.message || 'Access granted! Account credentials generated.',
        details: res.data
      });


      loadAllOpsData();
    } catch (err: any) {
      setAccessMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to grant access.'
      });
    } finally {
      setAccessLoading(false);
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'ceo':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-300">CEO</span>;
      case 'operations_head':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-300">Operations Head</span>;
      case 'hr':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300">HR Manager</span>;
      case 'tl':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300">Team Lead</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">Employee</span>;
    }
  };


  // Selected elements for drawers and workspaces
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientWorkspaceTab, setClientWorkspaceTab] = useState<'overview' | 'projects' | 'processes' | 'sop' | 'team'>('overview');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [projDetailTab, setProjDetailTab] = useState<'overview' | 'team' | 'work' | 'tasks' | 'escalations'>('overview');

  // Form states for creation
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', client_id: '', industry: 'Professional Services', status: 'active', renewal_date: '', notes: '' });
  const [showAddProcessModal, setShowAddProcessModal] = useState(false);
  const [newProcess, setNewProcess] = useState({ name: '', process_id: '', daily_target: 50, sla: '24h', priority: 'medium', sop_text: '' });
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client_name: '', process_name: '', volume: 10000, target_date: '', priority: 'medium', tl_name: '' });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ project_id: 1, tl_name: 'Team Lead', target: 1000, due_date: '', priority: 'medium' });

  // Reassignments and Targets States (Mocked & Persisted locally)
  const [jiraTasks, setJiraTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('ops_jira_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [escalations, setEscalations] = useState<any[]>(() => {
    const saved = localStorage.getItem('ops_escalations');
    return saved ? JSON.parse(saved) : [];
  });

  const [sopDocuments, setSopDocuments] = useState<any[]>(() => {
    const saved = localStorage.getItem('ops_sop_documents');
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyReports, setDailyReports] = useState<any[]>(() => {
    const saved = localStorage.getItem('ops_daily_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('ops_audit_logs');
    return saved ? JSON.parse(saved) : [];
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

      setWorks(wRes.data || []);
      setEmployees(eRes.data || []);
      setDbClients(cRes.data || []);
      setDbProcesses(pRes.data || []);
      setDbProjects(projRes.data || []);
    } catch (err) {
      console.error("Error loading Operations data:", err);
      setWorks([]);
      setEmployees([]);
      setDbClients([]);
      setDbProcesses([]);
      setDbProjects([]);
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
  const nonCeoEmployees = employees.filter(e => e.user_details?.role !== 'ceo');
  const totalClients = dbClients.length;
  const totalProjects = dbProjects.length;
  const totalTLs = nonCeoEmployees.filter(e => e.user_details?.role === 'tl').length;
  const totalStaffCount = nonCeoEmployees.length;

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
      ops_head: user?.id || 'opshead',
      ops_head_name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Operations Head',
      tl: '',
      tl_name: 'Unassigned'
    };

    setDbClients(prev => [...prev, clientItem]);
    setShowAddClientModal(false);
    setNewClient({ name: '', client_id: '', industry: 'Professional Services', status: 'active', renewal_date: '', notes: '' });
    
    // Log to audit log
    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'CLIENT_CREATION',
      actor: user?.first_name ? `${user.first_name} (Ops Head)` : 'Ops Head',
      details: `Registered new client account: ${clientItem.name} (${clientItem.client_id})`
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
      client_name: selectedClient ? selectedClient.name : 'Client',
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
      actor: user?.first_name ? `${user.first_name} (Ops Head)` : 'Ops Head',
      details: `Added process code ${processItem.process_id} under client ${processItem.client_name}`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setMsg('Operational process SOP registered.');
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;
    const projectItem: Project = {
      id: Date.now(),
      name: newProject.name,
      client: 1,
      client_name: newProject.client_name || 'Client',
      status: 'active',
      description: `Billing project using process ${newProject.process_name}. Target lead: ${newProject.tl_name || 'Unassigned'}`
    };

    setDbProjects(prev => [...prev, projectItem]);
    setShowAddProjectModal(false);
    setNewProject({ name: '', client_name: '', process_name: '', volume: 10000, target_date: '', priority: 'medium', tl_name: '' });

    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'PROJECT_CREATION',
      actor: user?.first_name ? `${user.first_name} (Ops Head)` : 'Ops Head',
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
      actor: user?.first_name ? `${user.first_name} (Ops Head)` : 'Ops Head',
      details: `Assigned project ${proj.name} to Team Lead ${assignForm.tl_name} with target of ${assignForm.target} units.`
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
      actor: user?.first_name ? `${user.first_name} (Ops Head)` : 'Ops Head',
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

      {/* Tabs strip */}
      <div 
        className="flex overflow-x-auto space-x-1 border-b border-gray-200 dark:border-slate-800 pb-px scrollbar-none cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleDragScrollMouseDown}
        onMouseLeave={handleDragScrollMouseLeave}
        onMouseUp={handleDragScrollMouseUp}
        onMouseMove={handleDragScrollMouseMove}
      >
        {[
          { id: 'dashboard', label: 'Operations Dashboard', icon: Activity },
          { id: 'clients', label: 'Clients & Processes', icon: UserSquare2 },
          { id: 'projects', label: 'Project Campaigns', icon: FolderKanban },
          { id: 'queues', label: 'Work Operations Queue', icon: ClipboardList },
          { id: 'teams', label: 'Teams & TL Reports', icon: Users },
          { id: 'tasks', label: 'Task board', icon: CheckSquare },
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
        <div className="space-y-4 sm:space-y-6">
          {/* WORKFORCE TELEMETRY (Merged Greeting & 5 Pill Cards) */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome, {user?.first_name || 'Operations Head'}!
                </h1>
              </div>
              <button
                onClick={exportProjectsToCSV}
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Download className="h-3.5 w-3.5 mr-2 text-brand-primary" />
                Export Campaigns CSV
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
                  {totalStaffCount} <span className="text-xs font-normal text-slate-400">Members</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Active workforce</p>
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
                  <span className="text-emerald-600 dark:text-emerald-400">{Math.max(1, Math.round(totalStaffCount * 0.85))}</span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                  <span className="text-slate-400">{totalStaffCount}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{Math.max(1, Math.round(totalStaffCount * 0.85))} Present today</p>
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
                  <span className="text-rose-600 dark:text-rose-400">{Math.max(0, totalStaffCount - Math.round(totalStaffCount * 0.85))}</span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                  <span className="text-slate-400">{totalStaffCount}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{Math.max(0, totalStaffCount - Math.round(totalStaffCount * 0.85))} Absent today</p>
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
                  <span className="text-brand-primary">{nonCeoEmployees.filter(e => e.status === 'active').length}</span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                  <span className="text-slate-400">{totalStaffCount}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{nonCeoEmployees.filter(e => e.status === 'active').length} Active accounts</p>
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
                  <span className="text-slate-600 dark:text-slate-300">{Math.max(0, totalStaffCount - nonCeoEmployees.filter(e => e.status === 'active').length)}</span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                  <span className="text-slate-400">{totalStaffCount}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{Math.max(0, totalStaffCount - nonCeoEmployees.filter(e => e.status === 'active').length)} Inactive accounts</p>
              </div>
            </div>

          </div>
        </div>

        {/* Leave Approval & Operational Campaigns 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Leave Approval Card */}
          <div 
            onClick={() => navigate('/employee-attendance')}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-amber-200 dark:border-amber-950/50 shadow-xs hover:shadow-sm transition cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Leave Approval</h3>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-extrabold rounded-full">
                    Review Pending
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review operations staff leave applications & shift coverage
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Operational Campaigns Card */}
          <div 
            onClick={() => setActiveTab('projects')}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-brand-primary/30 dark:border-slate-700 shadow-xs hover:shadow-sm transition cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-brand-primary-light text-brand-primary rounded-xl group-hover:scale-105 transition-transform">
                <FolderKanban className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Operational Campaigns</h3>
                  <span className="px-2 py-0.5 bg-brand-primary-light text-brand-primary text-xs font-extrabold rounded-full">
                    {dbProjects.length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track client projects, SLAs, and deliverable targets
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Operations Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            
            <button
              onClick={() => openGiveAccessModal(undefined, 'tl')}
              className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between text-left transition group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 w-fit group-hover:scale-105 transition-transform mb-3">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">+ Add User & Access</p>
                <p className="text-xs text-slate-400 mt-0.5">Issue credentials to TL or HR</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/asset-management?action=issue')}
              className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between text-left transition group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-brand-primary-light text-brand-primary w-fit group-hover:scale-105 transition-transform mb-3">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">Issue Asset</p>
                <p className="text-xs text-slate-400 mt-0.5">Deploy laptop or hardware</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/asset-management')}
              className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between text-left transition group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 w-fit group-hover:scale-105 transition-transform mb-3">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">Asset Management</p>
                <p className="text-xs text-slate-400 mt-0.5">Hardware inventory & audits</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/employees')}
              className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between text-left transition group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-brand-primary-light text-brand-primary w-fit group-hover:scale-105 transition-transform mb-3">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">View Workforce</p>
                <p className="text-xs text-slate-400 mt-0.5">Workforce profiles & team list</p>
              </div>
            </button>

          </div>
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
                      <p className="text-[10px] text-slate-400">ID: {c.client_id} • Assigned Lead: {c.tl_name || 'Unassigned'}</p>
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
              <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 pb-2">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Recent Activities & Operations Audit</h3>
                <Link to="/audit" className="text-xs font-bold text-brand-primary hover:underline">View All</Link>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="text-[11px] leading-relaxed border-b border-gray-150 dark:border-slate-700 pb-2">
                    <span className="text-slate-400 font-mono text-[9px] block">{new Date(log.timestamp).toLocaleString()}</span>
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
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Client Accounts</h3>
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
                  className="flex items-center px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Client
                </button>
              </div>
            </div>

            {/* Add Client Modal */}
            {showAddClientModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-205 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white font-sans">Add Client Account</h4>
                    <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateClient} className="flex flex-col flex-1 overflow-hidden min-h-0">
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
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
                          placeholder="e.g. Client Name"
                          value={newClient.name}
                          onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end gap-3 bg-slate-50 dark:bg-slate-850">
                      <button
                        type="button"
                        onClick={() => setShowAddClientModal(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        Register Client
                      </button>
                    </div>
                  </form>
                </div>
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
                  className="flex items-center px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Launch Project
                </button>
              </div>
            </div>

            {/* Launch Project Modal */}
            {showAddProjectModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-205 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">Launch Campaign Project</h4>
                    <button onClick={() => setShowAddProjectModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateProject} className="flex flex-col flex-1 overflow-hidden min-h-0">
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-455">Project Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Deliverable Verification Project"
                          value={newProject.name}
                          onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <option value="Team Lead">Team Lead</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end gap-3 bg-slate-50 dark:bg-slate-850">
                      <button
                        type="button"
                        onClick={() => setShowAddProjectModal(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        Launch Campaign
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Assign Project to TL Modal */}
            {showAssignModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-205 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">Assign Campaign to Team Lead</h4>
                    <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAssignProjectToTL} className="flex flex-col flex-1 overflow-hidden min-h-0">
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
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
                          <option value="Team Lead">Team Lead</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-455">Active Deliverable Target (Units)</label>
                        <input
                          type="number"
                          required
                          min={100}
                          value={assignForm.target}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, target: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end gap-3 bg-slate-50 dark:bg-slate-850">
                      <button
                        type="button"
                        onClick={() => setShowAssignModal(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        Confirm Assignment
                      </button>
                    </div>
                  </form>
                </div>
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
                      <p className="font-bold">Target: {w.target_quantity || w.target_count} units</p>
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
                    <p className="text-[10px] text-slate-455">Completed Volume: {rep.completed} / {rep.target} Units</p>
                  </div>
                  
                  <div>
                    {rep.status === 'Submitted' ? (
                      <button
                        onClick={() => handleReviewTLReport(rep.id)}
                        className="px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-primary-hover font-bold rounded text-xs"
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
                <h3 className="font-semibold text-base text-slate-900 dark:text-white font-sans">Operations Task board</h3>
                <p className="text-xs text-slate-500 mt-1">Assign operational tasks to Team Leads.</p>
              </div>
              <button
                onClick={() => {
                  const newTask = {
                    id: Date.now(),
                    key: `TASK-20${jiraTasks.length + 1}`,
                    title: 'Review Quality Escalation Log',
                    description: 'Verify if recent deliverables comply with contract rules.',
                    status: 'backlog',
                    priority: 'high',
                    assignee: 'Team Lead',
                    project: 'Primary Client Project',
                    due_date: '2026-09-05'
                  };
                  setJiraTasks(prev => [newTask, ...prev]);
                  setMsg('Added new task to TL backlog.');
                }}
                className="flex items-center px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Task
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
                <p className="text-xs text-slate-500 mt-1">Version control for operational process guidelines.</p>
              </div>
              <button
                onClick={() => {
                  const doc = {
                    id: Date.now(),
                    title: 'Standard Operating Guidelines SOP V3',
                    version: `V${sopDocuments.length + 1}.0`,
                    effective_date: new Date().toISOString().split('T')[0],
                    status: 'active',
                    process: 'Quality Verification'
                  };
                  setSopDocuments(prev => [doc, ...prev]);
                  setMsg('Uploaded new version of operating SOP guidelines.');
                }}
                className="flex items-center px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-primary-hover font-bold rounded-lg text-xs"
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
                <p className="leading-relaxed font-normal">Active service agreement for operational services. Operational support Noida center.</p>
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
                    className="px-2.5 py-1 bg-brand-primary text-white font-bold rounded text-[10px]"
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
                        <button type="button" onClick={handleCreateProcess} className="px-3 py-1 bg-brand-primary text-white rounded text-[10px] font-bold">Save Process</button>
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
                {sopDocuments.map(doc => (
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
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-205 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col my-auto text-xs animate-in fade-in zoom-in-95 duration-150">
              
              <div className="p-4 sm:p-6 bg-slate-950 text-white flex justify-between items-start border-b border-slate-800 shrink-0">
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
                    <p className="leading-relaxed font-normal">{selectedProject.description || 'Operational verification project.'}</p>
                  </div>
                )}

                {projDetailTab === 'team' && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Assigned operational leads</p>
                    <div className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-150 rounded-xl">
                      <p className="font-semibold">{selectedProject.tl_name || 'Team Lead'}</p>
                      <p className="text-slate-400">Assigned campaign lead</p>
                    </div>
                  </div>
                )}

                {projDetailTab === 'work' && (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Deliverables Queue</p>
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

      {/* ----------------- GIVE ACCESS / GENERATE PASSWORD MODAL ----------------- */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
                  <Key className="h-4.5 w-4.5 mr-2 text-brand-primary" />
                  Grant Staff Access & Set Password
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Target Role: <span className="font-bold text-brand-primary capitalize">{targetRole.replace('_', ' ')}</span>
                </p>
              </div>
              <button onClick={() => setShowAccessModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGrantAccessSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs font-semibold">
                {accessMsg && (
                  <div className={`p-3 rounded-lg border text-xs font-bold ${
                    accessMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300'
                  }`}>
                    <p>{accessMsg.text}</p>
                    {accessMsg.details && (
                      <div className="mt-2 text-[11px] font-mono bg-white dark:bg-slate-900 p-2 rounded border space-y-1 text-slate-800 dark:text-slate-200">
                        <p>Username: <span className="text-brand-primary font-bold">@{accessMsg.details.username}</span></p>
                        <p>Password: <span className="text-rose-600 font-bold">{accessMsg.details.one_time_password}</span></p>
                        {accessMsg.details.email_sent ? (
                          <p className="text-emerald-600 text-[10px] font-sans">✓ Credentials sent to email: {accessMsg.details.email}</p>
                        ) : accessMsg.details.email ? (
                          <p className="text-amber-600 dark:text-amber-400 text-[10px] font-sans">
                            ⚠️ Mail delivery notice: Email to <span className="underline">{accessMsg.details.email}</span> was not delivered directly{accessMsg.details.email_error ? ` (${accessMsg.details.email_error})` : ''}.
                          </p>
                        ) : (
                          <p className="text-slate-400 text-[10px] font-sans">No email provided. Share credentials with staff directly.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                    Username
                  </label>

                  <input
                    type="text"
                    value={giveUsername}
                    onChange={(e) => setGiveUsername(e.target.value)}
                    placeholder="e.g. hr_manager"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-normal">
                    If unchanged, existing username is retained.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setGivePassword("PASS-" + Math.floor(100000 + Math.random() * 900000))}
                      className="text-[10px] text-brand-primary font-bold hover:underline"
                    >
                      Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={givePassword}
                    onChange={(e) => setGivePassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-mono font-bold text-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                    Recipient Email ID (Optional - Passwords sent here)
                  </label>
                  <input
                    type="email"
                    value={giveEmail}
                    onChange={(e) => setGiveEmail(e.target.value)}
                    placeholder="staff@company.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end gap-2 bg-slate-50 dark:bg-slate-850">
                <button
                  type="button"
                  onClick={() => setShowAccessModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={accessLoading}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold text-xs shadow-xs"
                >
                  {accessLoading ? 'Granting...' : 'Grant Access & Save'}
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

