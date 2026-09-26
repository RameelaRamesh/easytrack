import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { ClipboardList, Plus, X, Search, Calendar, Save, Trash2, CheckCircle, Eye } from 'lucide-react';
import { BillingWork, EmployeeProfile, Client, Process } from '../../types';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadData = async () => {
    try {
      const [wRes, eRes, cRes, pRes] = await Promise.all([
        apiClient.get<BillingWork[]>('/billing/'),
        apiClient.get<EmployeeProfile[]>('/employees/'),
        apiClient.get<Client[]>('/clients/'),
        apiClient.get<Process[]>('/processes/')
      ]);

      const fallbackEmployees = eRes.data.length > 0 ? eRes.data : [
        { id: 1, employee_id: 'EMP-001', user_details: { username: 'ceo', email: 'ceo@medicalbilling.com', first_name: 'Ramesh', last_name: 'Kumar', role: 'ceo' }, department: 'Executive', designation: 'CEO', base_salary: 150000, status: 'active' },
        { id: 2, employee_id: 'EMP-002', user_details: { username: 'hrmanager', email: 'hr@medicalbilling.com', first_name: 'Aditi', last_name: 'Sharma', role: 'hr' }, department: 'HR', designation: 'HR Lead', base_salary: 65000, status: 'active' },
        { id: 3, employee_id: 'EMP-003', user_details: { username: 'opshead', email: 'ops@medicalbilling.com', first_name: 'Sanjay', last_name: 'Sharma', role: 'operations_head' }, department: 'Operations', designation: 'Ops Head', base_salary: 80000, status: 'active' },
        { id: 4, employee_id: 'EMP-004', user_details: { username: 'tl1', email: 'tl1@medicalbilling.com', first_name: 'Vikram', last_name: 'Rathore', role: 'tl' }, department: 'Claims', designation: 'Team Lead', base_salary: 50000, status: 'active' },
        { id: 5, employee_id: 'EMP-005', user_details: { username: 'emp3', email: 'emp3@medicalbilling.com', first_name: 'Neelam', last_name: 'Gupta', role: 'employee' }, department: 'Claims', designation: 'Billing Associate', base_salary: 30000, status: 'active' },
      ];

      const fallbackClients = cRes.data.length > 0 ? cRes.data : [
        { id: 1, name: 'Apex Health Partners', client_id: 'CLI-APEX', status: 'active', ops_head_name: 'Sanjay Sharma', tl_name: 'Vikram Rathore' },
        { id: 2, name: 'Beacon Medical Group', client_id: 'CLI-BEAC', status: 'active', ops_head_name: 'Sanjay Sharma', tl_name: 'Vikram Rathore' }
      ];

      const fallbackProcesses = pRes.data.length > 0 ? pRes.data : [
        { id: 1, name: 'Claims Verification', process_id: 'PRC-001', client_name: 'Apex Health Partners', target: 50, sop: 'Verify claim details against patient record.' },
        { id: 2, name: 'Payment Posting', process_id: 'PRC-002', client_name: 'Beacon Medical Group', target: 30, sop: 'Post received checks to patient ledgers.' }
      ];

      const fallbackWorks = wRes.data.length > 0 ? wRes.data : [
        { id: 1, work_id: 'WRK-001', client_name: 'Apex Health Partners', process_name: 'Claims Verification', work_type: 'Verification', priority: 'high', due_date: '2026-08-30', target_count: 50, completed_count: 25, progress: 50, status: 'in_progress', employee_name: 'Neelam Gupta', tl_name: 'Vikram Rathore' }
      ];

      setWorks(fallbackWorks as any[]);
      setEmployees(fallbackEmployees as any[]);
      setClients(fallbackClients as any[]);
      setProcesses(fallbackProcesses as any[]);
    } catch (err) {
      console.error(err);
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

  const filteredWorks = works.filter((w) => {
    const matchesSearch = w.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.process_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.work_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || w.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const canAllocate = user?.role === 'operations_head' || user?.role === 'ceo';

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <ClipboardList className="h-5 w-5 mr-2 text-brand-primary" />
            Work Allocation Workspace
          </h2>
          <p className="text-sm text-slate-500 mt-1">Assign claims targets, allocation buckets, and track work progress.</p>
        </div>
        {canAllocate && (
          <button
            onClick={() => setShowAllocateModal(true)}
            className="flex items-center px-4 py-2 bg-brand-primary bg-brand-primary-hover text-white rounded-lg text-sm font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Allocate New Task
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Client / Process / Batch ID..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div>
            <label className="text-xs font-bold uppercase text-slate-455 mr-2">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-455 mr-2">Status</label>
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

      {/* Main List */}
      <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Client / Process</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-750 font-medium text-slate-700 dark:text-slate-200">
                {filteredWorks.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30">
                    <td className="py-3 px-4 font-mono text-brand-primary">{w.work_id}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{w.client_name}</p>
                        <p className="text-xs text-slate-400 font-normal">{w.process_name} • {w.work_type}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-xs font-semibold">{w.employee_name || 'Unassigned'}</p>
                        <p className="text-[10px] text-slate-400">TL: {w.tl_name || 'Unassigned'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-brand-primary-light text-brand-primary`}>
                        {w.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">{w.due_date || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-slate-750 h-2 rounded-full overflow-hidden">
                          <div className="bg-brand-primary h-full rounded-full" style={{ width: `${w.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-bold font-mono">{w.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        w.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        w.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedWorkDetails(w)}
                        className="text-xs text-brand-primary hover:underline font-bold"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredWorks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">No work batches matched.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Allocate Task Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-755 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Allocate Operational Task</h3>
              <button onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 text-xs rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleAllocateWork} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1">Work Type</label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  >
                    <option value="Verification">Verification</option>
                    <option value="Claims Entry">Claims Entry</option>
                    <option value="Coding">Coding</option>
                    <option value="AR Follow Up">AR Follow Up</option>
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
                    onChange={(e) => setTargetCount(parseInt(e.target.value))}
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 rounded-lg text-slate-650"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-brand-primary bg-brand-primary-hover text-white rounded-lg"
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
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Batch Details ({selectedWorkDetails.work_id})</h3>
              <button onClick={() => setSelectedWorkDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
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
                  <p className="font-bold capitalize text-rose-600 mt-0.5">{selectedWorkDetails.priority}</p>
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
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedWorkDetails.target_count} claims</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Completed Count</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedWorkDetails.completed_count || 0} claims</p>
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
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedWorkDetails(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded text-slate-700 dark:text-slate-200 font-semibold"
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
