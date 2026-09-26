import React, { useState } from 'react';
import { ShieldCheck, Save, Users, AlertCircle } from 'lucide-react';

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
  const [activeRole, setActiveRole] = useState<string>('operations_head');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    { key: 'ceo', name: 'Chief Executive (CEO)' },
    { key: 'operations_head', name: 'Operations Head' },
    { key: 'hr', name: 'HR Manager' },
    { key: 'tl', name: 'Team Lead (TL)' },
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
          className="flex items-center px-4 py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 font-bold rounded-lg text-xs transition"
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
              <span>CEO roles represent root authorizations. CEO policies are absolute and cannot be restricted.</span>
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
                              className={`h-4 w-4 rounded text-teal-600 border-gray-300 focus:ring-teal-500 cursor-pointer ${
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
    </div>
  );
};

export default RolesPermissionsPage;
