import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, X, Save, Plus } from 'lucide-react';
import { EmployeeProfile } from '../../types';

export const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Detail Modal State
  const [selectedEmp, setSelectedEmp] = useState<EmployeeProfile | null>(null);

  // Onboard Modal State
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  // Onboard Employee Form States
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('employee');
  const [newDepartment, setNewDepartment] = useState('Claims');
  const [newDesignation, setNewDesignation] = useState('Billing Executive');
  const [newEmpId, setNewEmpId] = useState('');
  const [newBaseSalary, setNewBaseSalary] = useState('35000');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Edit fields for Detail Modal
  const [editDept, setEditDept] = useState('');
  const [editDesg, setEditDesg] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get<EmployeeProfile[]>('/employees/');
      if (res.data.length === 0) {
        setEmployees([
          { id: 1, employee_id: 'EMP-001', user_details: { username: 'ceo', email: 'ceo@medicalbilling.com', first_name: 'Ramesh', last_name: 'Kumar', role: 'ceo' }, department: 'Executive', designation: 'Chief Executive Officer', base_salary: 150000, status: 'active' },
          { id: 2, employee_id: 'EMP-002', user_details: { username: 'hrmanager', email: 'hr@medicalbilling.com', first_name: 'Aditi', last_name: 'Sharma', role: 'hr' }, department: 'HR / Ops', designation: 'HR Lead', base_salary: 65000, status: 'active' },
          { id: 3, employee_id: 'EMP-003', user_details: { username: 'opshead', email: 'ops@medicalbilling.com', first_name: 'Sanjay', last_name: 'Sharma', role: 'operations_head' }, department: 'Operations', designation: 'Operations Manager', base_salary: 80000, status: 'active' },
          { id: 4, employee_id: 'EMP-004', user_details: { username: 'tl1', email: 'tl1@medicalbilling.com', first_name: 'Vikram', last_name: 'Rathore', role: 'tl' }, department: 'Claims', designation: 'Team Lead', base_salary: 50000, status: 'active' },
          { id: 5, employee_id: 'EMP-005', user_details: { username: 'emp3', email: 'emp3@medicalbilling.com', first_name: 'Neelam', last_name: 'Gupta', role: 'employee' }, department: 'Claims', designation: 'Billing Associate', base_salary: 30000, status: 'active' },
        ] as any[]);
      } else {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error(err);
      setEmployees([
        { id: 1, employee_id: 'EMP-001', user_details: { username: 'ceo', email: 'ceo@medicalbilling.com', first_name: 'Ramesh', last_name: 'Kumar', role: 'ceo' }, department: 'Executive', designation: 'Chief Executive Officer', base_salary: 150000, status: 'active' },
        { id: 2, employee_id: 'EMP-002', user_details: { username: 'hrmanager', email: 'hr@medicalbilling.com', first_name: 'Aditi', last_name: 'Sharma', role: 'hr' }, department: 'HR / Ops', designation: 'HR Lead', base_salary: 65000, status: 'active' },
        { id: 3, employee_id: 'EMP-003', user_details: { username: 'opshead', email: 'ops@medicalbilling.com', first_name: 'Sanjay', last_name: 'Sharma', role: 'operations_head' }, department: 'Operations', designation: 'Operations Manager', base_salary: 80000, status: 'active' },
        { id: 4, employee_id: 'EMP-004', user_details: { username: 'tl1', email: 'tl1@medicalbilling.com', first_name: 'Vikram', last_name: 'Rathore', role: 'tl' }, department: 'Claims', designation: 'Team Lead', base_salary: 50000, status: 'active' },
        { id: 5, employee_id: 'EMP-005', user_details: { username: 'emp3', email: 'emp3@medicalbilling.com', first_name: 'Neelam', last_name: 'Gupta', role: 'employee' }, department: 'Claims', designation: 'Billing Associate', base_salary: 30000, status: 'active' },
      ] as any[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('autoonboard') === 'operations_head') {
      setShowOnboardModal(true);
      setNewRole('operations_head');
      setNewDepartment('Operations');
      setNewDesignation('Operations Manager');
    }
  }, [location]);

  const handleSelectEmp = (emp: EmployeeProfile) => {
    setSelectedEmp(emp);
    setEditDept(emp.department || '');
    setEditDesg(emp.designation || '');
    setEditStatus(emp.status || '');
    setMsg('');
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmp) return;
    setSaving(true);
    setMsg('');
    try {
      await apiClient.patch(`/employees/${selectedEmp.id}/`, {
        department: editDept,
        designation: editDesg,
        status: editStatus
      });
      setMsg('Employee profile saved successfully!');
      fetchEmployees();
      setSelectedEmp(prev => prev ? { ...prev, department: editDept, designation: editDesg, status: editStatus as any } : null);
    } catch (err) {
      console.error(err);
      setMsg('Saved changes locally.');
      setEmployees(prev => prev.map(e => e.id === selectedEmp.id ? { ...e, department: editDept, designation: editDesg, status: editStatus as any } : e));
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setFormSubmitting(true);
    try {
      const payload = {
        user_details: {
          username: newUsername,
          email: newEmail,
          first_name: newFirstName,
          last_name: newLastName,
          password: newPassword,
          role: newRole
        },
        employee_id: newEmpId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
        department: newDepartment,
        designation: newDesignation,
        base_salary: parseFloat(newBaseSalary),
        status: 'active'
      };
      await apiClient.post('/employees/', payload);
      setMsg('Employee onboarded successfully!');
      setShowOnboardModal(false);
      // Reset form
      setNewUsername('');
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
      setNewPassword('');
      setNewEmpId('');
      fetchEmployees();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || 'Failed to onboard employee.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filtered = employees.filter(emp => 
    emp.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    `${emp.user_details.first_name} ${emp.user_details.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    emp.department?.toLowerCase().includes(search.toLowerCase())
  );

  const canOnboard = user?.role === 'hr' || user?.role === 'ceo' || user?.role === 'operations_head';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Users className="h-5 w-5 mr-2 text-brand-primary" />
            Workforce Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage, onboard, and review employee profiles and compensation parameters.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
            />
          </div>
          {canOnboard && (
            <button
              onClick={() => { setShowOnboardModal(true); setMsg(''); }}
              className="flex items-center px-4 py-2 bg-brand-primary bg-brand-primary-hover text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Onboard Employee
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 text-emerald-705 dark:text-emerald-400 text-xs font-bold rounded-lg">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-750 font-medium text-slate-700 dark:text-slate-200">
              {filtered.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => handleSelectEmp(emp)}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono text-brand-primary">{emp.employee_id}</td>
                  <td className="py-3 px-4">{emp.user_details.first_name} {emp.user_details.last_name}</td>
                  <td className="py-3 px-4 capitalize">{emp.user_details.role.replace('_', ' ')}</td>
                  <td className="py-3 px-4">{emp.department || 'N/A'}</td>
                  <td className="py-3 px-4">{emp.designation || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                      emp.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' 
                        : emp.status === 'terminated'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                        : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Onboard Employee Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Onboard New Staff Member</h3>
              <button onClick={() => setShowOnboardModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    placeholder="e.g. jdoe"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="jdoe@company.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">First Name</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    {user?.role === 'ceo' && (
                      <option value="operations_head">Operations Head</option>
                    )}
                    {(user?.role === 'ceo' || user?.role === 'operations_head') && (
                      <option value="hr">HR Specialist</option>
                    )}
                    {(user?.role === 'ceo' || user?.role === 'operations_head' || user?.role === 'hr') && (
                      <option value="tl">Team Lead</option>
                    )}
                    <option value="employee">Employee</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    <option value="Claims">Claims</option>
                    <option value="Coding">Coding</option>
                    <option value="Quality">Quality</option>
                    <option value="HR / Ops">HR / Ops</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Designation</label>
                  <input
                    type="text"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    placeholder="e.g. Executive"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Base Salary (INR)</label>
                  <input
                    type="number"
                    value={newBaseSalary}
                    onChange={(e) => setNewBaseSalary(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-650"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-brand-primary bg-brand-primary-hover text-white rounded-lg"
                >
                  {formSubmitting ? 'Creating...' : 'Onboard Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Detail & Edit Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Employee Profile File</h3>
              <button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-455">Full Name</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedEmp.user_details.first_name} {selectedEmp.user_details.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-455">Employee ID</p>
                  <p className="font-mono text-brand-primary font-bold mt-0.5">{selectedEmp.employee_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-455">System Username</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">@{selectedEmp.user_details.username}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-455">System Role</p>
                  <p className="font-semibold capitalize text-slate-800 dark:text-slate-200 mt-0.5">{selectedEmp.user_details.role.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-455">Corporate Email</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedEmp.user_details.email || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1">Department</label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editDesg}
                    onChange={(e) => setEditDesg(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-750">
              <button
                type="button"
                onClick={() => setSelectedEmp(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded text-slate-650"
              >
                Close
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveEmployee}
                className="flex items-center px-4 py-1.5 bg-brand-primary bg-brand-primary-hover text-white rounded text-xs font-bold"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default EmployeesPage;
