import React, { useState, useEffect } from 'react';
import { ShieldCheck, Save, Users, AlertCircle, X, ShieldAlert, RefreshCw, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api/client';
import { EmployeeProfile } from '../../types';

interface RolePermissionMap {
  [module: string]: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    export: boolean;
  };
}

interface RolesPermissions {
  [role: string]: RolePermissionMap;
}

export const RolesPermissionsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeRole, setActiveRole] = useState<string>('operations_head');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Transfer Ownership State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [adminsList, setAdminsList] = useState<EmployeeProfile[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.is_owner) {
      apiClient.get<EmployeeProfile[]>('/employees/').then(res => {
        const eligible = res.data.filter(e => 
          e.user_details && 
          e.user_details.id !== user.id && 
          ['admin', 'ceo', 'operations_head'].includes(e.user_details.role) && 
          !e.user_details.is_owner &&
          e.status !== 'terminated'
        );
        setAdminsList(eligible);
        if (eligible.length > 0) {
          setSelectedAdminId(eligible[0].user_details.id);
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminId) {
      setTransferError('Please select an eligible Admin to receive ownership.');
      return;
    }
    if (!confirmChecked) {
      setTransferError('Please confirm the transfer checkbox before continuing.');
      return;
    }

    setTransferSubmitting(true);
    setTransferError(null);
    try {
      const res = await apiClient.post('/auth/transfer-ownership/', {
        target_user_id: selectedAdminId,
      });

      if (res.data.previous_owner) {
        updateUser(res.data.previous_owner);
      }
      setSuccessMsg(res.data.message || 'Ownership transferred successfully!');
      setShowTransferModal(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      let errMsg = 'Failed to transfer ownership.';
      if (err.response?.data?.error) errMsg = err.response.data.error;
      else if (err.response?.data?.detail) errMsg = err.response.data.detail;
      setTransferError(errMsg);
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Initial permission mapping (as frozen defaults)
  const [permissions, setPermissions] = useState<RolesPermissions>({
    ceo: {
      Dashboard: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Users: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Employees: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Recruitment: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Attendance: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Leave: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Payroll: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Projects: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Clients: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Tasks: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Targets: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Productivity: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      QA: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Reports: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Messages: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Documents: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Settings: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      AuditLogs: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Finance: { view: true, create: true, edit: true, delete: true, approve: true, export: true }
    },
    operations_head: {
      Dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
      Users: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Employees: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Recruitment: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Attendance: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
      Leave: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
      Payroll: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Projects: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Clients: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Tasks: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Targets: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Productivity: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      QA: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
      Reports: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Messages: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
      Documents: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Settings: { view: true, create: false, edit: true, delete: false, approve: false, export: false },
      AuditLogs: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Finance: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
    },
    hr: {
      Dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Users: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Employees: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Recruitment: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Attendance: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
      Leave: { view: true, create: false, edit: true, delete: false, approve: true, export: true },
      Payroll: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
      Projects: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Clients: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Tasks: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Targets: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Productivity: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      QA: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Reports: { view: true, create: true, edit: false, delete: false, approve: false, export: true },
      Messages: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
      Documents: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      Settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      AuditLogs: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Finance: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
    },
    tl: {
      Dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Users: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Employees: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Recruitment: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Attendance: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Leave: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
      Payroll: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Projects: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Clients: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Tasks: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Targets: { view: true, create: true, edit: true, delete: false, approve: false, export: true },
      Productivity: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
      QA: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Reports: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
      Messages: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
      Documents: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      AuditLogs: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Finance: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
    },
    employee: {
      Dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Employees: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Recruitment: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Attendance: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
      Leave: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
      Payroll: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Projects: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Clients: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Tasks: { view: true, create: false, edit: true, delete: false, approve: false, export: false },
      Targets: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Productivity: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      QA: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Reports: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Messages: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
      Documents: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
      Settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      AuditLogs: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Finance: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
    },
    qa: {
      Dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Employees: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Recruitment: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Attendance: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Leave: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Payroll: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Projects: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Clients: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Tasks: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Targets: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Productivity: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      QA: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
      Reports: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      Messages: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
      Documents: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      AuditLogs: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      Finance: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
    }
  });

  const handleToggle = (module: string, permission: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export') => {
    if (activeRole === 'ceo') return; // CEO permissions are absolute and locked
    setPermissions(prev => {
      const roleMap = { ...prev[activeRole] };
      const current = { ...roleMap[module] };
      current[permission] = !current[permission];
      roleMap[module] = current;
      return { ...prev, [activeRole]: roleMap };
    });
  };

  const handleSave = () => {
    setSuccessMsg('Permissions policies mapped and saved to client config.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const roles = [
    { key: 'ceo', name: 'Admin (Finance Access / CEO)' },
    { key: 'operations_head', name: 'Admin (Operations)' },
    { key: 'tl', name: 'Team Lead' },
    { key: 'hr', name: 'HR' },
    { key: 'employee', name: 'Employee' },
    { key: 'qa', name: 'Quality Auditor (QA)' }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-brand-primary" />
            Roles & Permissions Policy Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">Review system roles, configure active action controls, and view module restriction matrices.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center px-4 py-2 bg-brand-primary bg-brand-primary-hover text-white font-bold rounded-lg text-xs transition"
        >
          <Save className="h-4 w-4 mr-1.5" />
          Save Configurations
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl animate-bounce">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Selector */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2">Select Role to Customize</p>
          <div className="flex flex-col gap-1">
            {roles.map(r => (
              <button
                key={r.key}
                onClick={() => setActiveRole(r.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between border ${
                  activeRole === r.key 
                    ? 'bg-brand-primary-light border-brand-primary text-brand-primary font-bold' 
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{r.name}</span>
                {r.key === 'ceo' && (
                  <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded uppercase font-bold">Locked</span>
                )}
              </button>
            ))}
          </div>
          {activeRole === 'ceo' && (
            <div className="p-3 bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-lg text-[10px] text-slate-500 leading-normal flex items-start space-x-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Admin with Finance Access represents root executive authorizations. Policies are absolute and cannot be restricted.</span>
            </div>
          )}
        </div>

        {/* Permissions Table Grid */}
        <div className="lg:col-span-3 border border-gray-200 dark:border-slate-750 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                <tr>
                  <th className="py-3 px-4">System Module</th>
                  <th className="py-3 px-4 text-center">View</th>
                  <th className="py-3 px-4 text-center">Create</th>
                  <th className="py-3 px-4 text-center">Edit</th>
                  <th className="py-3 px-4 text-center">Delete</th>
                  <th className="py-3 px-4 text-center">Approve</th>
                  <th className="py-3 px-4 text-center">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-slate-750 font-semibold text-slate-800 dark:text-slate-200">
                {Object.keys(permissions[activeRole]).map(mod => {
                  const perm = permissions[activeRole][mod];
                  return (
                    <tr key={mod} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30">
                      <td className="py-3 px-4 font-bold">{mod}</td>
                      {['view', 'create', 'edit', 'delete', 'approve', 'export'].map((p) => {
                        const val = (perm as any)[p];
                        const isCeo = activeRole === 'ceo';
                        return (
                          <td key={p} className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={val}
                              disabled={isCeo}
                              onChange={() => handleToggle(mod, p as any)}
                              className={`h-4 w-4 rounded text-brand-primary border-gray-300 focus:ring-brand-primary cursor-pointer ${
                                isCeo ? 'cursor-not-allowed opacity-60' : ''
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Organisation Settings & Company Profile Section */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Organization Settings & Company Profile</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Manage entity branding, corporate tax parameters, domain credentials, and workplace details.</p>
        </div>
        <a
          href="/company-profile"
          className="px-3.5 py-1.5 bg-brand-primary bg-brand-primary-hover text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap"
        >
          Open Company Profile
        </a>
      </div>

      {/* Organization Ownership & Access Governance */}
      {user?.is_owner && (
        <div className="p-5 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Organization Ownership</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                  You are Owner
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                You hold the primary <strong>Owner + Admin</strong> authority with root <strong>Finance Access</strong> for {user?.organization_name || 'this organization'}.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Ownership can be safely transferred to another active Administrator. You will remain an Admin without Owner status or automatic Finance Access.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setTransferError(null); setConfirmChecked(false); setShowTransferModal(true); }}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Transfer Ownership</span>
          </button>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-200 dark:border-purple-900/50 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    Transfer Organization Ownership
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Assign primary ownership credentials and Finance Access to another Admin
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransferOwnership} className="p-5 space-y-4 overflow-y-auto flex-1">
              {transferError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {/* Current Owner Details */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Current Owner</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {user?.first_name} {user?.last_name} <span className="font-mono text-purple-600 dark:text-purple-400">(@{user?.username})</span>
                </p>
                <p className="text-[11px] text-slate-500">{user?.organization_name || 'Organization'}</p>
              </div>

              {/* Select Recipient Admin */}
              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-bold">
                  Select Target Admin User *
                </label>
                {adminsList.length > 0 ? (
                  <select
                    value={selectedAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select an Admin to receive ownership --</option>
                    {adminsList.map(admin => (
                      <option key={admin.user_details?.id} value={admin.user_details?.id}>
                        {admin.user_details?.first_name} {admin.user_details?.last_name} (@{admin.user_details?.username}) - {admin.designation || 'Administrator'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold">No other Admin users found.</p>
                    <p className="text-[11px]">Ownership can only be transferred to an existing Admin in your organization. Please add or assign the Admin role to an employee first in Workforce.</p>
                  </div>
                )}
              </div>

              {/* Ownership Policy Rules */}
              <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 rounded-xl text-xs space-y-2 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-purple-900 dark:text-purple-300 block">
                  Ownership Transfer Policy:
                </span>
                <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                  <li>The selected Admin will immediately become <strong>Owner & Admin</strong> with default <strong>Finance Access</strong>.</li>
                  <li>You will remain an active <strong>Admin</strong> in the organization, but will lose Owner status and automatic Finance Access.</li>
                  <li>Organization settings and Company Profile remain separate and intact.</li>
                </ul>
              </div>

              {/* Acknowledge Checkbox */}
              {adminsList.length > 0 && (
                <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    I confirm that I want to transfer organization ownership to this administrator.
                  </span>
                </label>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-750">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting || !selectedAdminId || !confirmChecked}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  {transferSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Confirm Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RolesPermissionsPage;
