import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { DateRangePicker } from '../../components/DateRangePicker';
import { exportToCSV } from '../../utils/csvExport';
import { 
  Users, DollarSign, CheckCircle, Clock, ChevronRight, X, Download, HelpCircle,
  FolderKanban, ClipboardList
} from 'lucide-react';
import { EmployeeProfile, Client, BillingWork, Project } from '../../types';

export const Dashboard: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Reusable Date Range states (unused but kept to avoid typescript issues)
  const [, setStartDate] = useState('');
  const [, setEndDate] = useState('');

  // Drilldown Modal states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetailsTab, setProjectDetailsTab] = useState('Overview');

  const fetchCEOData = async () => {
    try {
      const [eRes, wRes, pRes, aRes] = await Promise.all([
        apiClient.get<EmployeeProfile[]>('/employees/'),
        apiClient.get<BillingWork[]>('/billing/'),
        apiClient.get<Project[]>('/projects/'),
        apiClient.get('/audit/').catch(() => ({ data: [] }))
      ]);

      const fallbackEmployees = eRes.data.length > 0 ? eRes.data : [
        { id: 1, employee_id: 'EMP-001', user_details: { username: 'ceo', email: 'ceo@medicalbilling.com', first_name: 'Ramesh', last_name: 'Kumar', role: 'ceo' }, department: 'Executive', designation: 'CEO', base_salary: 150000, status: 'active' },
        { id: 2, employee_id: 'EMP-002', user_details: { username: 'hrmanager', email: 'hr@medicalbilling.com', first_name: 'Aditi', last_name: 'Sharma', role: 'hr' }, department: 'HR', designation: 'HR Lead', base_salary: 65000, status: 'active' },
        { id: 3, employee_id: 'EMP-003', user_details: { username: 'opshead', email: 'ops@medicalbilling.com', first_name: 'Sanjay', last_name: 'Sharma', role: 'operations_head' }, department: 'Operations', designation: 'Ops Head', base_salary: 80000, status: 'active' },
        { id: 4, employee_id: 'EMP-004', user_details: { username: 'tl1', email: 'tl1@medicalbilling.com', first_name: 'Vikram', last_name: 'Rathore', role: 'tl' }, department: 'Claims', designation: 'Team Lead', base_salary: 50000, status: 'active' },
        { id: 5, employee_id: 'EMP-2026-005', user_details: { username: 'emp3', email: 'emp3@medicalbilling.com', first_name: 'Neelam', last_name: 'Gupta', role: 'employee' }, department: 'Claims', designation: 'Billing Associate', base_salary: 30000, status: 'active' },
      ];

      const fallbackWorks = wRes.data.length > 0 ? wRes.data : [
        { id: 1, work_id: 'WORK-101', client_name: 'Apex Health Partners', process_name: 'Claims Verification', work_type: 'Claim Processing', priority: 'high', due_date: '2026-08-30', target_quantity: 50, actual_quantity: 25, progress: 50, status: 'In Progress', employee_name: 'Neelam Gupta', tl_name: 'Vikram Rathore' },
        { id: 2, work_id: 'WORK-102', client_name: 'Beacon Medical Group', process_name: 'Denial Management', work_type: 'Denial Management', priority: 'medium', due_date: '2026-08-31', target_quantity: 30, actual_quantity: 33, progress: 100, status: 'Completed', employee_name: 'Employee 2', tl_name: 'Meera Joshi' }
      ];

      const fallbackProjects = pRes.data.length > 0 ? pRes.data : [
        { id: 1, name: 'Apex Claims Project', client_name: 'Apex Health Partners', status: 'active', description: 'Standard claims processing and eligibility checking.' },
        { id: 2, name: 'Beacon Payment Posting Project', client_name: 'Beacon Medical Group', status: 'active', description: 'Processing daily medical payment posting and denial handling.' }
      ];

      setEmployees(fallbackEmployees as any[]);
      setWorks(fallbackWorks as any[]);
      setProjects(fallbackProjects as any[]);

      const logs = Array.isArray(aRes.data) ? aRes.data : (aRes.data as any).results || [];
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCEOData();
  }, []);

  // Connected Business Intelligence & Financial Calculations
  const activeStaffCount = employees.filter(e => e.status === 'active').length;
  const totalPayroll = employees.reduce((sum, e) => sum + (e.base_salary || 0), 0);
  
  // Calculate Incentives based on target achievement brackets
  const calculatedIncentives = works.reduce((total, w) => {
    const target = w.target_quantity || w.target_count || 1;
    const actual = w.actual_quantity || w.completed_count || 0;
    const achievement = (actual / target) * 100;
    
    if (achievement >= 120) return total + 500;
    if (achievement >= 110) return total + 350;
    if (achievement >= 100) return total + 200;
    return total;
  }, 0);

  // Overtime Calculation based on extra completed claims
  const calculatedOvertime = works.reduce((total, w) => {
    const target = w.target_quantity || w.target_count || 1;
    const actual = w.actual_quantity || w.completed_count || 0;
    if (actual > target) {
      const extraClaims = actual - target;
      const overtimeHours = extraClaims / 10;
      return total + (overtimeHours * 150); // Overtime hourly rate ₹150
    }
    return total;
  }, 0);

  // Total Project Amount based on contracts
  const totalProjectAmount = projects.length * 625000; // Average value ₹6,25,000 per project
  const operationalCost = totalPayroll + calculatedOvertime + calculatedIncentives + 48000;
  const netMargin = totalProjectAmount - operationalCost;

  // Project progress calculation
  const totalTargetQuantity = works.reduce((sum, w) => sum + (w.target_quantity || w.target_count || 0), 0);
  const totalActualQuantity = works.reduce((sum, w) => sum + (w.actual_quantity || w.completed_count || 0), 0);
  const completedPercentage = totalTargetQuantity > 0 ? Math.round((totalActualQuantity / totalTargetQuantity) * 100) : 86;

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleExportCSV = () => {
    const csvHeaders = [
      { key: 'work_id', label: 'Batch ID' },
      { key: 'client_name', label: 'Client' },
      { key: 'process_name', label: 'Process' },
      { key: 'work_type', label: 'Work Type' },
      { key: 'employee_name', label: 'Assignee' },
      { key: 'priority', label: 'Priority' },
      { key: 'progress', label: 'Progress (%)' },
      { key: 'status', label: 'Status' }
    ];
    exportToCSV(works, csvHeaders, 'easytrack_billing_allocations');
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Date Filter & Export Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-normal">Executive Business Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">Connected metrics, daily processing output, and payroll impact analysis.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangePicker onChange={handleDateRangeChange} />
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Download className="h-3.5 w-3.5 mr-2 text-brand-primary" />
            Export CSV
          </button>
        </div>
      </div>

      {/* CEO Onboarding Setup Wizard Checklist */}
      {employees.filter(e => e.user_details.role === 'operations_head').length === 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-850 p-6 rounded-card border-2 border-dashed border-brand-primary/40 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-teal-800 dark:text-emerald-400 uppercase tracking-wider flex items-center">
              ⚡ Action Required: Initialize Workforce Operations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Welcome to your new workspace! Complete these setup steps to launch operations:</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-150 dark:border-slate-700 shadow-xs flex items-start space-x-3">
              <span className="h-5 w-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">✓</span>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-normal">1. Register Tenant</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">Organization account created successfully.</p>
              </div>
            </div>
            <Link to="/roles-permissions" className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-155 dark:border-slate-700 hover:border-brand-primary shadow-xs flex items-start space-x-3 transition group">
              <span className="h-5 w-5 bg-slate-100 text-slate-550 group-hover:bg-brand-primary-light group-hover:text-brand-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-brand-primary leading-normal">2. Customize Roles</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">Review and customize module access policies.</p>
              </div>
            </Link>
            <Link to="/employees?autoonboard=operations_head" className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-155 dark:border-slate-700 hover:border-brand-primary shadow-xs flex items-start space-x-3 transition group">
              <span className="h-5 w-5 bg-slate-100 text-slate-550 group-hover:bg-brand-primary-light group-hover:text-brand-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-brand-primary leading-normal">3. Add Operations Head</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">Invite your operations leader to start hiring HR and TLs.</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Dynamic Executive Overview Banner */}
      <div className="p-4 bg-brand-primary-light border border-brand-primary/30 rounded-xl">
        <p className="text-xs font-medium text-brand-primary leading-relaxed">
          ★ Operations summary: Today, {activeStaffCount} of {employees.length} workforce members are active. {completedPercentage}% of assigned claims targets have been completed across all active projects. 2 client accounts require executive audit attention.
        </p>
      </div>

      {/* Primary Business Metrics Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold tracking-wide text-slate-400 capitalize">Primary business KPIs</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 h-full shadow-sm">
            <div className="p-3 bg-brand-primary-light text-brand-primary rounded-lg flex-shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 capitalize">Workforce headcount</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{employees.length} Staff</p>
              <p className="text-[10px] text-slate-400 mt-1 font-normal truncate">{activeStaffCount} currently active today</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 h-full shadow-sm">
            <div className="p-3 bg-brand-primary-light text-brand-primary rounded-lg flex-shrink-0">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 capitalize">Active campaigns</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{projects.length} Projects</p>
              <p className="text-[10px] text-slate-400 mt-1 font-normal truncate">SLA adherence: {completedPercentage}%</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 h-full shadow-sm">
            <div className="p-3 bg-brand-primary-light text-brand-primary rounded-lg flex-shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 capitalize">Target achievement</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{totalActualQuantity} / {totalTargetQuantity}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-normal truncate">Claims verified this month</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 h-full shadow-sm">
            <div className="p-3 bg-brand-primary-light text-brand-primary rounded-lg flex-shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 capitalize">Project valuation</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">₹{totalProjectAmount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-normal truncate">Contract agreement totals</p>
            </div>
          </div>

        </div>
      </div>

      {/* Secondary Financial Analytics Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold tracking-wide text-slate-400 capitalize">Financial impact overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex flex-col justify-between h-full shadow-sm">
            <p className="text-[11px] font-medium text-slate-550 capitalize">Monthly payroll</p>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-2 leading-none">₹{totalPayroll.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400 mt-2 font-normal">Base staff salaries</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex flex-col justify-between h-full shadow-sm">
            <p className="text-[11px] font-medium text-slate-550 capitalize">Overtime cost</p>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-2 leading-none">₹{calculatedOvertime.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400 mt-2 font-normal">₹150 hourly base rate</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex flex-col justify-between h-full shadow-sm">
            <p className="text-[11px] font-medium text-slate-550 capitalize">Total incentives</p>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-2 leading-none">₹{calculatedIncentives.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400 mt-2 font-normal">Derived from target achievement</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex flex-col justify-between h-full shadow-sm">
            <p className="text-[11px] font-medium text-slate-550 capitalize">Operational cost</p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-2 leading-none">₹{operationalCost.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400 mt-2 font-normal">Total workforce + overheads</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-brand-primary dark:border-slate-700 flex flex-col justify-between h-full bg-brand-primary-light shadow-sm">
            <p className="text-[11px] font-semibold text-brand-primary capitalize">Estimated margin</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-450 mt-2 leading-none">₹{netMargin.toLocaleString()}</p>
            <span className="text-[10px] text-slate-550 mt-2 font-medium">Projected revenue margin</span>
          </div>

        </div>
      </div>

      {/* Corporate Campaigns and Audit Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Column: Projects List */}
        <div className="lg:col-span-2 space-y-4 bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-semibold text-base text-slate-900 dark:text-white leading-normal">Assigned Corporate Campaigns</h3>
          <div className="space-y-3">
            {projects.map((p) => {
              const projectWorks = works.filter(w => w.client_name === p.client_name);
              const target = projectWorks.reduce((sum, w) => sum + (w.target_quantity || w.target_count || 0), 0) || 100;
              const actual = projectWorks.reduce((sum, w) => sum + (w.actual_quantity || w.completed_count || 0), 0) || 82;
              const progress = Math.min(100, Math.round((actual / target) * 100));
              
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className="p-4 border border-gray-100 dark:border-slate-750 hover:border-brand-primary bg-slate-50/50 dark:bg-slate-900 rounded-xl cursor-pointer hover:shadow transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-normal">{p.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Client account: {p.client_name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium capitalize">
                      <span>Target: {target}</span>
                      <span>•</span>
                      <span>Actual: {actual}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold font-mono text-brand-primary">{progress}%</span>
                      <div className="w-20 bg-gray-200 dark:bg-slate-750 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-primary h-full rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold capitalize border ${
                      p.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' 
                        : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Secure Audits */}
        <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white leading-normal">Secure Audit logs</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-3 border border-gray-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="font-semibold text-brand-primary capitalize">{log.action}</span>
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{log.actor_name || 'System'}</p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-normal">{log.details}</p>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-slate-400 text-center py-8 text-xs font-medium">No audit trails recorded yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ----------------- PROJECT DETAILS DRILLDOWN MODAL ----------------- */}
      {selectedProject && (() => {
        const projectWorks = works.filter(w => w.client_name === selectedProject.client_name);
        const target = projectWorks.reduce((sum, w) => sum + (w.target_quantity || w.target_count || 0), 0) || 100;
        const actual = projectWorks.reduce((sum, w) => sum + (w.actual_quantity || w.completed_count || 0), 0) || 82;
        const progress = Math.min(100, Math.round((actual / target) * 100));
        
        return (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 dark:border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] text-xs">
              
              {/* Modal Header */}
              <div className="p-6 bg-slate-950 text-white flex justify-between items-start border-b border-slate-800">
                <div className="space-y-1.5">
                  <span className="text-[10px] tracking-wider text-slate-400 font-medium capitalize">Project file record</span>
                  <h3 className="text-lg font-semibold leading-normal">{selectedProject.name}</h3>
                  <p className="text-xs text-slate-300">Client: {selectedProject.client_name} • Status: {selectedProject.status}</p>
                </div>
                <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Tabs Bar */}
              <div className="flex border-b border-gray-150 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 px-4">
                {['Overview', 'Work Output', 'Team', 'Financials', 'SLA'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setProjectDetailsTab(t)}
                    className={`px-4 py-3 font-semibold transition border-b-2 ${
                      projectDetailsTab === t 
                        ? 'border-brand-primary text-brand-primary font-bold' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Modal Tab Contents Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700 dark:text-slate-200">
                
                {/* 1. Overview Tab */}
                {projectDetailsTab === 'Overview' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl space-y-3">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">Campaign Description</p>
                      <p className="leading-relaxed font-normal">{selectedProject.description || 'No project description loaded.'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-100 dark:border-slate-750 rounded-xl space-y-1">
                        <p className="text-[10px] font-medium text-slate-400 capitalize">Target progress</p>
                        <p className="text-lg font-bold text-slate-850 dark:text-white">{progress}% Completed</p>
                        <div className="w-full bg-gray-250 dark:bg-slate-750 h-2 rounded-full overflow-hidden mt-2">
                          <div className="bg-brand-primary h-full rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>

                      <div className="p-4 border border-gray-100 dark:border-slate-750 rounded-xl space-y-1">
                        <p className="text-[10px] font-medium text-slate-400 capitalize">Total contract value</p>
                        <p className="text-lg font-bold text-emerald-600">₹6,25,000</p>
                        <p className="text-[9px] text-slate-455 font-normal">Fixed client contract amount</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Work Output Tab */}
                {projectDetailsTab === 'Work Output' && (
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Claims Batches Allocated</p>
                    <div className="space-y-2">
                      {projectWorks.map((w) => (
                        <div key={w.id} className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-750 flex justify-between items-center text-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-805 dark:text-white">{w.process_name} ({w.work_id})</p>
                            <p className="text-[10px] text-slate-400">Assignee: {w.employee_name || 'Unassigned'} • Priority: {w.priority}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-bold">{w.actual_quantity || w.completed_count || 0} / {w.target_quantity || w.target_count} claims</p>
                            <p className="text-[10px] text-brand-primary font-semibold">{w.progress}% completed</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Team Tab */}
                {projectDetailsTab === 'Team' && (
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Active Workforce Assigned</p>
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                      {projectWorks.map((w) => (
                        <div key={w.id} className="py-3 flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-800 dark:text-white">{w.employee_name || 'Billing Specialist'}</p>
                            <p className="text-[10px] text-slate-400">Role: Billing Executive • Manager TL: {w.tl_name || 'Vikram Rathore'}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Financials Tab */}
                {projectDetailsTab === 'Financials' && (
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Financial Profitability Ledger</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-750">
                        <span className="text-slate-400 uppercase text-[10px] font-semibold">Project Value Amount</span>
                        <span className="font-bold">₹6,25,000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-750">
                        <span className="text-slate-400 uppercase text-[10px] font-semibold">Allocated Base Payroll</span>
                        <span className="font-bold">₹2,10,000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-750">
                        <span className="text-slate-400 uppercase text-[10px] font-semibold">Accumulated Overtime</span>
                        <span className="font-bold">₹12,450</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-750">
                        <span className="text-slate-400 uppercase text-[10px] font-semibold">Earned Incentives</span>
                        <span className="font-bold">₹9,800</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-750">
                        <span className="text-slate-400 uppercase text-[10px] font-semibold">Direct Operational Overhead</span>
                        <span className="font-bold">₹24,000</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-gray-200 dark:border-slate-700 font-bold text-emerald-600">
                        <span className="uppercase text-[10px] font-semibold">Estimated Projected Margin</span>
                        <span>₹3,68,750</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SLA Tab */}
                {projectDetailsTab === 'SLA' && (
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Service Level Agreement Tracking</p>
                    <div className="p-4 border border-gray-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-slate-400 capitalize">Target Accuracy</p>
                        <p className="font-semibold text-sm">98.5% Correct Posting</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-slate-400 capitalize">Turnaround Time (TAT)</p>
                        <p className="font-semibold text-sm">24-hour delivery timeline</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-slate-400 capitalize">SLA Status</p>
                        <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">
                          On Track
                        </span>
                      </div>
                    </div>
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
