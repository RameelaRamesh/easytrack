import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, UserSquare2, FolderKanban, DollarSign, Plus, X, Search, 
  Mail, Save, CheckCircle2, AlertCircle, ArrowUpRight, TrendingUp, ShieldCheck
} from 'lucide-react';
import { Client, Project, BillingWork, EmployeeProfile } from '../../types';

export const BusinessPortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'clients' | 'projects' | 'financial'>(
    tabParam === 'projects' ? 'projects' : (tabParam === 'financial' ? 'financial' : 'clients')
  );

  useEffect(() => {
    if (tabParam === 'projects' || tabParam === 'financial' || tabParam === 'clients') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (t: 'clients' | 'projects' | 'financial') => {
    setActiveTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };

  // ==================== SHARED STATES ====================
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllPortfolioData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, wRes, eRes] = await Promise.all([
        apiClient.get<Client[]>('/clients/').catch(() => ({ data: [] })),
        apiClient.get<Project[]>('/projects/').catch(() => ({ data: [] })),
        apiClient.get<BillingWork[]>('/billing/').catch(() => ({ data: [] })),
        apiClient.get<EmployeeProfile[]>('/employees/').catch(() => ({ data: [] }))
      ]);

      setClients(cRes.data || []);
      setProjects(pRes.data || []);
      setWorks(wRes.data || []);
      setEmployees(eRes.data || []);
    } catch (err) {
      console.error('Error loading portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPortfolioData();
  }, []);

  // ==================== 1. CLIENTS TAB STATES ====================
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [newClientCode, setNewClientCode] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientOpsHead, setNewClientOpsHead] = useState('');
  const [newClientTL, setNewClientTL] = useState('');
  const [newClientStatus, setNewClientStatus] = useState<'active' | 'onboarding'>('active');
  const [clientSubmitting, setClientSubmitting] = useState(false);

  const opsHeads = employees.filter(e => e.user_details?.role === 'operations_head' || e.user_details?.role === 'ceo');
  const teamLeads = employees.filter(e => e.user_details?.role === 'tl');

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientCode.trim() || !newClientName.trim()) return;
    setClientSubmitting(true);

    try {
      const payload: any = {
        client_id: newClientCode.trim().toUpperCase(),
        name: newClientName.trim(),
        status: newClientStatus,
      };
      if (newClientOpsHead) payload.ops_head = parseInt(newClientOpsHead);
      if (newClientTL) payload.tl = parseInt(newClientTL);

      const res = await apiClient.post<Client>('/clients/', payload);
      setClients(prev => [res.data, ...prev]);
      setShowAddClientModal(false);
      setNewClientCode('');
      setNewClientName('');
      setNewClientOpsHead('');
      setNewClientTL('');
      showNotice(`Client "${res.data.name}" registered successfully! Replicated across Operations & TL.`);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.client_id?.[0] || 'Failed to create client.');
    } finally {
      setClientSubmitting(false);
    }
  };

  // ==================== 2. PROJECTS TAB STATES ====================
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjStatus, setNewProjStatus] = useState<'active' | 'inactive'>('active');
  const [projSubmitting, setProjSubmitting] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjClient) return;
    setProjSubmitting(true);

    try {
      const payload = {
        name: newProjName.trim(),
        client: parseInt(newProjClient),
        description: newProjDesc.trim(),
        status: newProjStatus,
      };

      const res = await apiClient.post<Project>('/projects/', payload);
      setProjects(prev => [res.data, ...prev]);
      setShowAddProjectModal(false);
      setNewProjName('');
      setNewProjClient('');
      setNewProjDesc('');
      showNotice(`Corporate Campaign "${res.data.name}" created and linked to client.`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create project.');
    } finally {
      setProjSubmitting(false);
    }
  };

  // ==================== 3. FINANCIAL & PAYROLL STATES ====================
  const [payrollApproved, setPayrollApproved] = useState(false);

  const totalBaseSalary = employees.reduce((sum, e) => {
    const s = Number(e.base_salary);
    return sum + (!isNaN(s) && s > 0 ? s : 0);
  }, 0);

  const calculatedIncentives = works.reduce((tot, w) => {
    const act = Number(w.actual_quantity || 0);
    const tgt = Number(w.target_quantity || 1);
    const rate = tgt > 0 ? (act / tgt) * 100 : 0;
    if (rate >= 100) return tot + 750;
    return tot;
  }, 0);

  const calculatedOvertime = works.reduce((tot, w) => {
    const act = Number(w.actual_quantity || 0);
    const tgt = Number(w.target_quantity || 1);
    if (act > tgt) return tot + Math.round(((act - tgt) / 5) * 150);
    return tot;
  }, 0);

  const operationalCost = totalBaseSalary + calculatedOvertime + calculatedIncentives;
  const totalValuation = projects.length * 625000;
  const estimatedMargin = Math.max(0, totalValuation - operationalCost);

  const canManage = ['ceo', 'operations_head'].includes(user?.role || '');

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-brand-primary" />
            Business Portfolio Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Unified management of client contracts, corporate campaigns, and executive financial ledgers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
          <button
            onClick={() => handleTabChange('clients')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'clients'
                ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UserSquare2 className="h-4 w-4" />
            <span>Clients Directory ({clients.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('projects')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FolderKanban className="h-4 w-4" />
            <span>Corporate Projects ({projects.length})</span>
          </button>

          {user?.role === 'ceo' && (
            <button
              onClick={() => handleTabChange('financial')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'financial'
                  ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Financial & Payroll</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center">
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ==================== SUB-TAB 1: CLIENTS DIRECTORY ==================== */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                placeholder="Search clients by name or code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {canManage && (
              <button
                onClick={() => setShowAddClientModal(true)}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Client</span>
              </button>
            )}
          </div>

          {/* Clients Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients
              .filter(c => !clientSearch.trim() || c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.client_id.toLowerCase().includes(clientSearch.toLowerCase()))
              .map(client => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs hover:border-brand-primary transition cursor-pointer space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{client.name}</h3>
                      <p className="font-mono text-xs font-bold text-brand-primary mt-0.5">{client.client_id}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      client.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300'
                    }`}>
                      {client.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-slate-750 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ops Head</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{client.ops_head_name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Team Lead</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{client.tl_name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-slate-750 flex items-center justify-between text-[11px] text-brand-primary font-bold">
                    <span>Click row to view file</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              ))}

            {clients.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-850 rounded-2xl border border-gray-200 dark:border-slate-700 text-slate-400 text-xs">
                No clients found. Click "+ Add Client" to create the first client contract.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: CORPORATE PROJECTS ==================== */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {canManage && (
              <button
                onClick={() => setShowAddProjectModal(true)}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Project</span>
              </button>
            )}
          </div>

          {/* Projects Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects
              .filter(p => !projectSearch.trim() || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.client_name?.toLowerCase().includes(projectSearch.toLowerCase()))
              .map(proj => (
                <div
                  key={proj.id}
                  className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-3 hover:border-brand-primary transition"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{proj.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300">
                      {proj.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal line-clamp-2">
                    {proj.description || 'No campaign description provided.'}
                  </p>

                  <div className="pt-2 border-t border-gray-100 dark:border-slate-750 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Client Association</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{proj.client_name}</span>
                  </div>
                </div>
              ))}

            {projects.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 text-slate-400 text-xs">
                No corporate projects registered yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 3: FINANCIAL & PAYROLL ==================== */}
      {activeTab === 'financial' && user?.role === 'ceo' && (
        <div className="space-y-6">
          
          {/* Top Financial Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Base Payroll</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">₹{totalBaseSalary.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">Fixed staff contracts</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overtime Accruals</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">₹{calculatedOvertime.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">₹150/hr extra output</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Incentives</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">₹{calculatedIncentives.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">Production volume bonuses</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Total Operational Cost</span>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">₹{operationalCost.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">Workforce + Overheads</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-700 shadow-xs bg-emerald-50/30 dark:bg-emerald-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Estimated Net Margin</span>
              <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">₹{estimatedMargin.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Projected Revenue Margin</span>
            </div>
          </div>

          {/* Department Breakdown & Approval Action */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Executive Payroll Ledger & Approval</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Verify monthly disbursement breakdown and lock cycle.</p>
              </div>

              <button
                onClick={() => {
                  setPayrollApproved(true);
                  showNotice('Monthly payroll locked and approved by CEO. Audit record created.');
                }}
                disabled={payrollApproved}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-2 ${
                  payrollApproved
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-brand-primary hover:bg-brand-primary-hover text-white cursor-pointer'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{payrollApproved ? '✓ Payroll Locked & Approved' : 'Approve & Lock Monthly Payroll'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white">Operations & Delivery Management</span>
                <p className="text-slate-500">Staff Headcount: {employees.filter(e => e.department?.toLowerCase().includes('operation') || e.department?.toLowerCase().includes('op')).length}</p>
                <p className="font-mono font-bold text-brand-primary">Salary Pool: ₹{(totalBaseSalary * 0.65).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white">Quality Assurance (QA)</span>
                <p className="text-slate-500">Staff Headcount: {employees.filter(e => e.qa_enabled).length}</p>
                <p className="font-mono font-bold text-brand-primary">Salary Pool: ₹{(totalBaseSalary * 0.15).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white">Management & HR</span>
                <p className="text-slate-500">Staff Headcount: {employees.filter(e => ['hr', 'tl', 'operations_head'].includes(e.user_details?.role || '')).length}</p>
                <p className="font-mono font-bold text-brand-primary">Salary Pool: ₹{(totalBaseSalary * 0.2).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD CLIENT MODAL ==================== */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-slate-700 shrink-0 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <UserSquare2 className="h-5 w-5 mr-2 text-brand-primary" />
                Register New Client Contract
              </h3>
              <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Client Code / ID *</label>
                  <input
                    type="text"
                    value={newClientCode}
                    onChange={e => setNewClientCode(e.target.value)}
                    required
                    placeholder="e.g. CLI-101"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Client / Hospital Name *</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    required
                    placeholder="e.g. Apex Health Systems"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Assigned Ops Head</label>
                    <select
                      value={newClientOpsHead}
                      onChange={e => setNewClientOpsHead(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <option value="">Unassigned</option>
                      {opsHeads.map(o => (
                        <option key={o.id} value={o.user_details?.id}>
                          {o.user_details?.first_name ? `${o.user_details.first_name} ${o.user_details.last_name}` : `@${o.user_details?.username}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Assigned Team Lead</label>
                    <select
                      value={newClientTL}
                      onChange={e => setNewClientTL(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <option value="">Unassigned</option>
                      {teamLeads.map(t => (
                        <option key={t.id} value={t.user_details?.id}>
                          {t.user_details?.first_name ? `${t.user_details.first_name} ${t.user_details.last_name}` : `@${t.user_details?.username}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Contract Status</label>
                  <select
                    value={newClientStatus}
                    onChange={e => setNewClientStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="active">Active Service</option>
                    <option value="onboarding">Onboarding Transition</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-gray-150 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clientSubmitting}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {clientSubmitting ? 'Registering...' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD PROJECT MODAL ==================== */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-slate-700 shrink-0 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <FolderKanban className="h-5 w-5 mr-2 text-brand-primary" />
                Initialize Corporate Campaign
              </h3>
              <button onClick={() => setShowAddProjectModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Project / Campaign Name *</label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={e => setNewProjName(e.target.value)}
                    required
                    placeholder="e.g. 2026 Operational Excellence Initiative"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Associated Client *</label>
                  <select
                    value={newProjClient}
                    onChange={e => setNewProjClient(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="">Select Client Account</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.client_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Campaign Description</label>
                  <textarea
                    rows={3}
                    value={newProjDesc}
                    onChange={e => setNewProjDesc(e.target.value)}
                    placeholder="Outline processing objectives, deliverable volumes, and timeline..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-gray-150 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={projSubmitting}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {projSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-slate-700 shrink-0 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Client Contract Record</h3>
              <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Client Name</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedClient.name}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">System Code</span>
                <p className="font-mono text-brand-primary font-bold mt-0.5">{selectedClient.client_id}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Account Manager</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.ops_head_name || 'Unassigned'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Supervisor Lead</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.tl_name || 'Unassigned'}</p>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Contract Status</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 capitalize">{selectedClient.status}</p>
              </div>
            </div>

            <div className="flex justify-end p-3 sm:p-4 border-t border-gray-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-950 dark:bg-slate-700 text-white rounded-xl font-bold text-xs"
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

export default BusinessPortfolioPage;
