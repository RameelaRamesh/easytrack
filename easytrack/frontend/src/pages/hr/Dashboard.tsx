import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { 
  Users, FileText, CalendarDays, Award, Check, X, CreditCard, ChevronRight, MessageSquare,
  Briefcase, UserCheck, ShieldAlert, Plus, Download, Filter, Search, Calendar, ChevronLeft,
  Lock, Trash2, AlertTriangle, Play, HelpCircle, Activity, UserPlus, CheckSquare, Settings
} from 'lucide-react';
import { EmployeeProfile, BillingWork, AttendanceRecord } from '../../types';

export const Dashboard: React.FC = () => {
  // Navigation tabs within HR panel
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'recruitment' | 'onboarding' | 'attendance' | 'leave' | 'payroll' | 'relations' | 'training'>('dashboard');

  // Core Data States (Fetched from backend)
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Search, Filter & Drawer States
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'all' | 'active' | 'probation' | 'leave' | 'notice' | 'inactive' | 'exited'>('all');
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('all');
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [empDetailTab, setEmpDetailTab] = useState<'profile' | 'attendance' | 'payroll' | 'training' | 'onboarding'>('profile');

  // Recruitment and Onboarding States (Mocked & Persisted locally)
  const [jobOpenings, setJobOpenings] = useState<any[]>(() => {
    const saved = localStorage.getItem('hr_jobs');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Medical Billing Specialist', department: 'Claims', vacancies: 3, experience: '2+ Years', location: 'Office - Noida', type: 'Full-time', target_date: '2026-09-15', status: 'open' },
      { id: 2, title: 'AR Follow Up Executive', department: 'Accounts', vacancies: 2, experience: '1-3 Years', location: 'Remote', type: 'Full-time', target_date: '2026-09-10', status: 'open' }
    ];
  });

  const [candidates, setCandidates] = useState<any[]>(() => {
    const saved = localStorage.getItem('hr_candidates');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Ananya Roy', email: 'ananya@gmail.com', phone: '9876543210', job_id: 1, stage: 'Interview', score: 85, feedback: 'Strong communication, experienced in denial handling.', offer_details: null },
      { id: 2, name: 'Rahul Sen', email: 'rahul@gmail.com', phone: '9123456789', job_id: 1, stage: 'Selected', score: 90, feedback: 'Selected for claims verification batch.', offer_details: { amount: 35000, date: '2026-09-01' } },
      { id: 3, name: 'Pooja Nair', email: 'pooja@gmail.com', phone: '9988776655', job_id: 2, stage: 'Applied', score: 70, feedback: 'Screening resume.', offer_details: null }
    ];
  });

  const [onboardings, setOnboardings] = useState<any[]>(() => {
    const saved = localStorage.getItem('hr_onboardings');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        name: 'Rahul Sen', 
        job: 'Medical Billing Specialist', 
        start_date: '2026-09-01',
        checklist: {
          personal_info: true,
          identity_proof: true,
          education_docs: true,
          bank_details: true,
          policy_ack: false,
          system_setup: false,
          tl_assignment: false
        }
      }
    ];
  });

  // Grievance / Employee Relations States
  const [grievances, setGrievances] = useState<any[]>(() => {
    const saved = localStorage.getItem('hr_grievances');
    return saved ? JSON.parse(saved) : [
      { id: 1, employee: 'EMP-005 (Neelam Gupta)', category: 'Payroll Discrepancy', priority: 'high', details: 'incentive payout from previous month was not added in salary slip.', status: 'open', comments: [] }
    ];
  });

  // Training & QA States
  const [trainings, setTrainings] = useState<any[]>(() => {
    const saved = localStorage.getItem('hr_trainings');
    return saved ? JSON.parse(saved) : [
      { id: 1, topic: 'HIPAA & Compliance training', trainer: 'Aditi Sharma (HR)', schedule: '2026-08-28', attendees: ['EMP-005'], status: 'completed' },
      { id: 2, topic: 'Denial Management SOP V2', trainer: 'Vikram Rathore (TL)', schedule: '2026-09-03', attendees: ['EMP-005'], status: 'scheduled' }
    ];
  });

  // Payroll finalized indicator
  const [payrollLocked, setPayrollLocked] = useState(false);

  // New Openings / Candidate Forms states
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', department: 'Claims', vacancies: 1, experience: '1-3 Years', location: 'Office', type: 'Full-time', target_date: '' });
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '', job_id: 1 });
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [newGrievance, setNewGrievance] = useState({ employee: '', category: 'General', priority: 'medium', details: '' });

  // Overtime Hours Validation states
  const [overtimeApprovals, setOvertimeApprovals] = useState<any[]>([
    { id: 1, employee_id: 'EMP-005', employee_name: 'Neelam Gupta', hours: 8, rate: 150, status: 'pending', reason: 'Claim batch backlog clearing' }
  ]);

  // Attendance Correction state
  const [showAttendanceCorrection, setShowAttendanceCorrection] = useState(false);
  const [attendanceCorrection, setAttendanceCorrection] = useState({ employee_id: '', date: '', new_status: 'working', reason: '' });

  // Exits states
  const [exitRequests, setExitRequests] = useState<any[]>([
    { id: 1, employee_id: 'EMP-004', employee_name: 'Vikram Rathore', resignation_date: '2026-08-25', exit_date: '2026-09-25', status: 'Notice Period', clearance: { it: false, finance: false, operations: false } }
  ]);

  // Date Range presets
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const loadAllHRData = async () => {
    setLoading(true);
    try {
      const [eRes, lRes, aRes, wRes, auditRes] = await Promise.all([
        apiClient.get<EmployeeProfile[]>('/employees/'),
        apiClient.get<any[]>('/leave/'),
        apiClient.get<AttendanceRecord[]>('/attendance/'),
        apiClient.get<BillingWork[]>('/billing/'),
        apiClient.get('/audit/').catch(() => ({ data: [] }))
      ]);

      const fallbackEmployees = eRes.data.length > 0 ? eRes.data : [
        { id: 1, employee_id: 'EMP-001', user_details: { id: '1', username: 'ceo', email: 'ceo@medicalbilling.com', first_name: 'Ramesh', last_name: 'Kumar', role: 'ceo' }, department: 'Executive', designation: 'CEO', base_salary: 150000, status: 'active', leave_balance: 14 },
        { id: 2, employee_id: 'EMP-002', user_details: { id: '2', username: 'hrmanager', email: 'hr@medicalbilling.com', first_name: 'Aditi', last_name: 'Sharma', role: 'hr' }, department: 'HR', designation: 'HR Lead', base_salary: 65000, status: 'active', leave_balance: 18 },
        { id: 3, employee_id: 'EMP-003', user_details: { id: '3', username: 'opshead', email: 'ops@medicalbilling.com', first_name: 'Sanjay', last_name: 'Sharma', role: 'operations_head' }, department: 'Operations', designation: 'Ops Head', base_salary: 80000, status: 'active', leave_balance: 15 },
        { id: 4, employee_id: 'EMP-004', user_details: { id: '4', username: 'tl1', email: 'tl1@medicalbilling.com', first_name: 'Vikram', last_name: 'Rathore', role: 'tl' }, department: 'Claims', designation: 'Team Lead', base_salary: 50000, status: 'active', leave_balance: 12 },
        { id: 5, employee_id: 'EMP-005', user_details: { id: '5', username: 'emp3', email: 'emp3@medicalbilling.com', first_name: 'Neelam', last_name: 'Gupta', role: 'employee' }, department: 'Claims', designation: 'Billing Associate', base_salary: 30000, status: 'active', leave_balance: 10 }
      ];

      const fallbackLeaves = lRes.data.length > 0 ? lRes.data : [
        { id: 1, employee_name: 'Neelam Gupta', employee_id: 'EMP-005', start_date: '2026-08-28', end_date: '2026-08-29', leave_type: 'medical', reason: 'Flu symptoms', status: 'pending' },
        { id: 2, employee_name: 'Vikram Rathore', employee_id: 'EMP-004', start_date: '2026-08-26', end_date: '2026-08-26', leave_type: 'casual', reason: 'Personal errand', status: 'approved' }
      ];

      const fallbackAttendance = aRes.data.length > 0 ? aRes.data : [
        { id: 1, user: '5', employee_name: 'Neelam Gupta', date: '2026-08-26', check_in: '09:00:00', check_out: '18:00:00', status: 'working', total_break_seconds: 3600, total_working_seconds: 32400, overtime_seconds: 0, shift: 'Day Shift' },
        { id: 2, user: '4', employee_name: 'Vikram Rathore', date: '2026-08-26', status: 'leave', total_break_seconds: 0, total_working_seconds: 0, overtime_seconds: 0, shift: 'Day Shift' }
      ];

      setEmployees(fallbackEmployees as any[]);
      setLeaveRequests(fallbackLeaves);
      setAttendanceRecords(fallbackAttendance as any[]);
      setWorks(wRes.data);

      const logs = Array.isArray(auditRes.data) ? auditRes.data : (auditRes.data as any).results || [];
      setAuditLogs(logs);
    } catch (err) {
      console.error("Error loading HR dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllHRData();
  }, []);

  // Sync state changes to local storage
  useEffect(() => {
    localStorage.setItem('hr_jobs', JSON.stringify(jobOpenings));
  }, [jobOpenings]);

  useEffect(() => {
    localStorage.setItem('hr_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('hr_onboardings', JSON.stringify(onboardings));
  }, [onboardings]);

  useEffect(() => {
    localStorage.setItem('hr_grievances', JSON.stringify(grievances));
  }, [grievances]);

  useEffect(() => {
    localStorage.setItem('hr_trainings', JSON.stringify(trainings));
  }, [trainings]);

  // HR metrics calculation
  const totalStaff = employees.length;
  const activeStaff = employees.filter(e => e.status === 'active').length;
  const leavesPending = leaveRequests.filter(l => l.status === 'pending').length;
  const onboardingPending = onboardings.filter(o => {
    const checkValues = Object.values(o.checklist);
    const complete = checkValues.filter(v => v === true).length;
    return complete < checkValues.length;
  }).length;
  const presentCount = attendanceRecords.filter(a => a.status === 'working' || a.status === 'on_break').length;
  const absentCount = attendanceRecords.filter(a => a.status === 'absent').length;
  const onBreakCount = attendanceRecords.filter(a => a.status === 'on_break').length;

  // Actions
  const handleLeaveDecision = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await apiClient.patch(`/leave/${id}/`, {
        status: status,
        reviewer_name: 'People Operations Team',
        review_comments: `Leave request has been ${status} by HR.`
      });
      setMsg(`Leave request successfully ${status}!`);
      loadAllHRData();
    } catch (err) {
      setMsg(`Leave request marked as ${status} locally.`);
      setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status: status } : l));
    }
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title) return;
    const newOpening = {
      id: Date.now(),
      title: newJob.title,
      department: newJob.department,
      vacancies: Number(newJob.vacancies),
      experience: newJob.experience,
      location: newJob.location,
      type: newJob.type,
      target_date: newJob.target_date || new Date().toISOString().split('T')[0],
      status: 'open'
    };
    setJobOpenings(prev => [newOpening, ...prev]);
    setShowAddJobModal(false);
    setNewJob({ title: '', department: 'Claims', vacancies: 1, experience: '1-3 Years', location: 'Office', type: 'Full-time', target_date: '' });
    setMsg('New job vacancy posted successfully!');
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.email) return;
    const item = {
      id: Date.now(),
      name: newCandidate.name,
      email: newCandidate.email,
      phone: newCandidate.phone,
      job_id: Number(newCandidate.job_id),
      stage: 'Applied',
      score: null,
      feedback: 'Awaiting screening.',
      offer_details: null
    };
    setCandidates(prev => [item, ...prev]);
    setShowAddCandidateModal(false);
    setNewCandidate({ name: '', email: '', phone: '', job_id: 1 });
    setMsg('Candidate profile registered successfully!');
  };

  const handleUpdateCandidateStage = (id: number, nextStage: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        let offer = c.offer_details;
        if (nextStage === 'Selected' && !offer) {
          offer = { amount: 28000, date: new Date().toISOString().split('T')[0] };
        }
        return { ...c, stage: nextStage, offer_details: offer };
      }
      return c;
    }));
    setMsg(`Candidate pipeline status updated to ${nextStage}`);
  };

  const handleConvertCandidateToEmployee = (c: any) => {
    const newEmpId = `EMP-00${employees.length + 1}`;
    const newStaffMember: EmployeeProfile = {
      id: Date.now(),
      employee_id: newEmpId,
      user_details: {
        id: String(Date.now()),
        username: c.name.toLowerCase().replace(' ', ''),
        email: c.email,
        first_name: c.name.split(' ')[0] || c.name,
        last_name: c.name.split(' ')[1] || '',
        role: 'employee',
        organization: null,
        organization_name: null,
        must_change_password: false
      },
      department: 'Claims',
      designation: 'Billing Executive',
      manager: null,
      manager_name: null,
      status: 'active',
      qa_enabled: false,
      leave_balance: 12,
      base_salary: c.offer_details?.amount || 28000
    };

    setEmployees(prev => [...prev, newStaffMember]);
    setCandidates(prev => prev.filter(cand => cand.id !== c.id));
    
    // Create Onboarding task
    const onboardingTask = {
      id: Date.now(),
      name: c.name,
      job: 'Billing Executive',
      start_date: new Date().toISOString().split('T')[0],
      checklist: {
        personal_info: true,
        identity_proof: false,
        education_docs: false,
        bank_details: false,
        policy_ack: false,
        system_setup: false,
        tl_assignment: false
      }
    };
    setOnboardings(prev => [onboardingTask, ...prev]);
    setMsg(`Converted ${c.name} successfully! Created employee profile ${newEmpId} & checklist record.`);
  };

  const toggleOnboardingChecklist = (id: number, key: string) => {
    setOnboardings(prev => prev.map(o => {
      if (o.id === id) {
        const nextChecklist = { ...o.checklist, [key]: !o.checklist[key] };
        return { ...o, checklist: nextChecklist };
      }
      return o;
    }));
  };

  const handleAddGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrievance.details) return;
    const grievance = {
      id: Date.now(),
      employee: newGrievance.employee || 'EMP-005 (Neelam Gupta)',
      category: newGrievance.category,
      priority: newGrievance.priority,
      details: newGrievance.details,
      status: 'open',
      comments: []
    };
    setGrievances(prev => [grievance, ...prev]);
    setShowGrievanceModal(false);
    setNewGrievance({ employee: '', category: 'General', priority: 'medium', details: '' });
    setMsg('Support case registered securely.');
  };

  const handleResolveGrievance = (id: number) => {
    setGrievances(prev => prev.map(g => g.id === id ? { ...g, status: 'resolved' } : g));
    setMsg('Case closed successfully.');
  };

  const handleAttendanceCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceCorrection.employee_id || !attendanceCorrection.date) return;
    
    // Update record locally
    setAttendanceRecords(prev => prev.map(rec => {
      if (rec.employee_name?.toLowerCase().includes(attendanceCorrection.employee_id.toLowerCase())) {
        return { ...rec, status: attendanceCorrection.new_status as any };
      }
      return rec;
    }));

    // Log to audit log
    const auditRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'ATTENDANCE_CORRECTED',
      actor_name: 'Aditi Sharma (HR)',
      details: `Corrected attendance for ${attendanceCorrection.employee_id} on ${attendanceCorrection.date} to ${attendanceCorrection.new_status}. Reason: ${attendanceCorrection.reason}`
    };
    setAuditLogs(prev => [auditRecord, ...prev]);
    setShowAttendanceCorrection(false);
    setAttendanceCorrection({ employee_id: '', date: '', new_status: 'working', reason: '' });
    setMsg('Attendance record corrected and audit log written successfully.');
  };

  // Exits clearing trigger
  const handleExitClearance = (id: number, key: string) => {
    setExitRequests(prev => prev.map(ex => {
      if (ex.id === id) {
        const nextClearance = { ...ex.clearance, [key]: !ex.clearance[key] };
        const allCleared = Object.values(nextClearance).every(v => v === true);
        const status = allCleared ? 'Completed' : 'Notice Period';
        return { ...ex, clearance: nextClearance, status };
      }
      return ex;
    }));
  };

  const handleFinalizeExit = (ex: any) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.employee_id === ex.employee_id) {
        return { ...emp, status: 'terminated' }; // Exited
      }
      return emp;
    }));
    setExitRequests(prev => prev.filter(item => item.id !== ex.id));
    setMsg(`Finalized exit process for ${ex.employee_name}. Account deactivated.`);
  };

  // Overtime Approve / Reject
  const handleOvertimeDecision = (id: number, status: 'Approved' | 'Rejected') => {
    setOvertimeApprovals(prev => prev.map(ot => ot.id === id ? { ...ot, status } : ot));
    setMsg(`Overtime claims updated to ${status}. Values loaded to payroll inputs.`);
  };

  // CSV Exporters
  const exportEmployeesToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Employee ID,Name,Department,Designation,Status,Base Salary,Leave Balance"].join(",") + "\n"
      + employees.map(e => `${e.employee_id},${e.user_details.first_name} ${e.user_details.last_name},${e.department},${e.designation},${e.status},₹${e.base_salary || 0},${e.leave_balance}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `easytrack_workforce_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPayrollToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Employee ID,Name,Department,Base Salary,Overtime Amount,Incentives,Net Payable"].join(",") + "\n"
      + employees.map(e => {
          const base = e.base_salary || 30000;
          const ot = overtimeApprovals.filter(ot => ot.employee_id === e.employee_id && ot.status === 'Approved').reduce((s, o) => s + (o.hours * o.rate), 0);
          const inc = e.employee_id === 'EMP-005' ? 2400 : 0;
          const net = base + ot + inc;
          return `${e.employee_id},${e.user_details.first_name} ${e.user_details.last_name},${e.department},₹${base},₹${ot},₹${inc},₹${net}`;
        }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `easytrack_payroll_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters calculation
  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.user_details.first_name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
                          e.user_details.last_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                          e.employee_id.toLowerCase().includes(employeeSearch.toLowerCase());
    const matchesDept = employeeDeptFilter === 'all' || e.department === employeeDeptFilter;
    const matchesStatus = employeeStatusFilter === 'all' || 
                          (employeeStatusFilter === 'active' && e.status === 'active') ||
                          (employeeStatusFilter === 'inactive' && e.status === 'inactive') ||
                          (employeeStatusFilter === 'exited' && e.status === 'terminated');
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Date Filter & Export Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-normal">People Operations Workspace</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">Administer employee lifecycles, verify attendance corrections, manage job openings, and calculate payroll payouts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 p-1.5 rounded-lg">
            {['all', 'today', 'week'].map((preset) => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset as any)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors capitalize ${
                  datePreset === preset 
                    ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <button
            onClick={exportEmployeesToCSV}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Download className="h-3.5 w-3.5 mr-2 text-brand-primary" />
            Export Staff CSV
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

      {/* HR Module Tab Menu */}
      <div className="flex overflow-x-auto space-x-1 border-b border-gray-200 dark:border-slate-800 pb-px scrollbar-none">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'employees', label: 'Workforce Directory', icon: Users },
          { id: 'attendance', label: 'Attendance logs', icon: Calendar },
          { id: 'leave', label: 'Leave management', icon: CalendarDays },
          { id: 'payroll', label: 'Payroll & Overtime', icon: CreditCard },
          { id: 'recruitment', label: 'Recruitment board', icon: Briefcase },
          { id: 'onboarding', label: 'Onboarding Checklists', icon: UserCheck },
          { id: 'relations', label: 'Support & Grievances', icon: ShieldAlert },
          { id: 'training', label: 'Compliance & Training', icon: Award }
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

      {/* 1. Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Executive metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-stretch">
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => { setActiveTab('employees'); setEmployeeStatusFilter('all'); }}>
              <div className="p-3 bg-brand-primary-light text-brand-primary rounded-lg flex-shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Total headcount</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{totalStaff}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{activeStaff} active profile roles</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => { setActiveTab('attendance'); }}>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg flex-shrink-0 dark:bg-emerald-950/20">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-450 capitalize">Present today</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{presentCount}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{onBreakCount} members currently on break</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => { setActiveTab('leave'); }}>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0 dark:bg-amber-950/20">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-455 capitalize">Pending leaves</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{leavesPending}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Awaiting HR/TL review action</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => { setActiveTab('onboarding'); }}>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0 dark:bg-indigo-950/20">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-455 capitalize">Onboard pending</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{onboardingPending}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Checklist tasks incomplete</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-card border border-gray-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-brand-primary" onClick={() => { setActiveTab('recruitment'); }}>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg flex-shrink-0 dark:bg-rose-950/20">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-455 capitalize">Open vacancies</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-none">{jobOpenings.reduce((sum, j) => sum + j.vacancies, 0)}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Across {jobOpenings.length} posted listings</p>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left 2 cols: Insights */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Daily Operations checklist info */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Active Onboarding Progress tracker</h3>
                <div className="space-y-4">
                  {onboardings.map(o => {
                    const keys = Object.keys(o.checklist);
                    const completed = keys.filter(k => o.checklist[k] === true).length;
                    const percent = Math.round((completed / keys.length) * 100);
                    return (
                      <div key={o.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-800 dark:text-white">{o.name} ({o.job})</span>
                          <span className="font-bold text-brand-primary">{percent}% Completed</span>
                        </div>
                        <div className="w-full bg-gray-150 dark:bg-slate-750 h-2 rounded-full overflow-hidden">
                          <div className="bg-brand-primary h-full rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recruitment Conversion Pipeline */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Recruitment Pipeline Funnel</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{candidates.filter(c => c.stage === 'Applied').length}</p>
                    <p className="text-[10px] text-slate-455 font-semibold uppercase mt-0.5">Applied</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{candidates.filter(c => c.stage === 'Interview').length}</p>
                    <p className="text-[10px] text-slate-455 font-semibold uppercase mt-0.5">Interviews</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl">
                    <p className="text-xl font-bold text-emerald-650 dark:text-emerald-400">{candidates.filter(c => c.stage === 'Selected').length}</p>
                    <p className="text-[10px] text-slate-455 font-semibold uppercase mt-0.5">Selected</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl">
                    <p className="text-xl font-bold text-brand-primary">{employees.filter(e => e.employee_id.includes('EMP-00')).length}</p>
                    <p className="text-[10px] text-slate-455 font-semibold uppercase mt-0.5">Joined</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right column: active lists overview */}
            <div className="space-y-6">
              
              {/* Upcoming Exits & Probations */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Probations & Notices</h3>
                <div className="space-y-3">
                  {exitRequests.map(ex => (
                    <div key={ex.id} className="p-3 border border-red-100 dark:border-red-950/20 bg-red-50/50 dark:bg-red-950/10 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{ex.employee_name}</p>
                        <p className="text-[10px] text-slate-400">Notice period (Ends: {ex.exit_date})</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold uppercase">Notice</span>
                    </div>
                  ))}
                  <div className="p-3 border border-gray-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Neelam Gupta</p>
                      <p className="text-[10px] text-slate-400">Probation review due 2026-09-01</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold uppercase">Review</span>
                  </div>
                </div>
              </div>

              {/* Secure audit trailing shortcut */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white">HR Action logs</h3>
                  <Activity className="h-4 w-4 text-slate-400" />
                </div>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                  {auditLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="text-[11px] leading-relaxed border-b border-gray-100 dark:border-slate-700 pb-2">
                      <span className="text-slate-400 font-mono text-[9px] block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <p className="font-medium text-slate-750 dark:text-slate-200 mt-0.5">{log.details || log.action}</p>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <p className="text-slate-400 text-center py-4 text-xs font-medium">No actions audited yet.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 2. Workforce Directory Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            
            {/* Search and Filters block */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Employee ID, name..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-brand-primary rounded-lg text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={employeeStatusFilter}
                  onChange={(e) => setEmployeeStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="probation">Probation</option>
                  <option value="leave">On Leave</option>
                  <option value="notice">Notice Period</option>
                  <option value="exited">Exited</option>
                </select>

                <select
                  value={employeeDeptFilter}
                  onChange={(e) => setEmployeeDeptFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs"
                >
                  <option value="all">All departments</option>
                  <option value="Claims">Claims</option>
                  <option value="HR">HR</option>
                  <option value="Operations">Operations</option>
                  <option value="Executive">Executive</option>
                </select>

                {employeeSearch || employeeStatusFilter !== 'all' || employeeDeptFilter !== 'all' ? (
                  <button
                    onClick={() => { setEmployeeSearch(''); setEmployeeStatusFilter('all'); setEmployeeDeptFilter('all'); }}
                    className="text-xs text-rose-500 hover:underline font-semibold"
                  >
                    Clear Filters
                  </button>
                ) : null}
              </div>
            </div>

            {/* Employee Data Grid */}
            <div className="overflow-x-auto border border-gray-150 dark:border-slate-750 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-750 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Leave Balance</th>
                    <th className="py-3 px-4">Compensation</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-750">
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => { setSelectedEmp(emp); setEmpDetailTab('profile'); }}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono text-brand-primary font-bold">{emp.employee_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{emp.user_details.first_name} {emp.user_details.last_name}</td>
                      <td className="py-3 px-4">{emp.department}</td>
                      <td className="py-3 px-4">{emp.designation}</td>
                      <td className="py-3 px-4 font-mono">{emp.leave_balance} Days</td>
                      <td className="py-3 px-4 font-mono">₹{(emp.base_salary || 30000).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          emp.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-250' 
                            : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400 border-gray-200'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">No matching employee records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* 3. Attendance Logs & Corrections Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Attendance Verification Logs</h3>
                <p className="text-xs text-slate-500 mt-1">Review punches and issue corrections with audit trail records.</p>
              </div>
              <button
                onClick={() => setShowAttendanceCorrection(true)}
                className="flex items-center px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs transition"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Correct Attendance
              </button>
            </div>

            {/* Attendance correction dialog modal overlay */}
            {showAttendanceCorrection && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <form onSubmit={handleAttendanceCorrectionSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-750 p-6 w-full max-w-md space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Correct Employee Log</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Employee Name/ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Neelam Gupta"
                      value={attendanceCorrection.employee_id}
                      onChange={(e) => setAttendanceCorrection(prev => ({ ...prev, employee_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Log Date</label>
                    <input
                      type="date"
                      required
                      value={attendanceCorrection.date}
                      onChange={(e) => setAttendanceCorrection(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">New Status</label>
                    <select
                      value={attendanceCorrection.new_status}
                      onChange={(e) => setAttendanceCorrection(prev => ({ ...prev, new_status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      <option value="working">Working</option>
                      <option value="absent">Absent</option>
                      <option value="leave">On Leave</option>
                      <option value="on_break">On Break</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Reason for Correction</label>
                    <textarea
                      required
                      placeholder="Punch machine error, forgotten card, etc."
                      value={attendanceCorrection.reason}
                      onChange={(e) => setAttendanceCorrection(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAttendanceCorrection(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Apply Correction
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto border border-gray-150 dark:border-slate-750 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-750 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Check In</th>
                    <th className="py-3 px-4">Check Out</th>
                    <th className="py-3 px-4">Working Time</th>
                    <th className="py-3 px-4">Break Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-750">
                  {attendanceRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4 font-mono">{rec.date}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{rec.employee_name}</td>
                      <td className="py-3 px-4 font-mono">{rec.check_in || '--:--'}</td>
                      <td className="py-3 px-4 font-mono">{rec.check_out || '--:--'}</td>
                      <td className="py-3 px-4 font-mono">{rec.total_working_seconds > 0 ? `${Math.round(rec.total_working_seconds/3600)} Hours` : '0 Hours'}</td>
                      <td className="py-3 px-4 font-mono">{rec.total_break_seconds > 0 ? `${Math.round(rec.total_break_seconds/60)} Mins` : '0 Mins'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          rec.status === 'working' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          rec.status === 'on_break' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* 4. Leave Approval Queue Tab */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">Pending Leave Requests Review Queue</h3>
            
            <div className="space-y-3">
              {leaveRequests.filter(l => l.status === 'pending').map((req) => (
                <div key={req.id} className="p-4 border border-gray-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-brand-primary capitalize">{req.leave_type} Leave</span>
                      <span className="text-xs text-slate-455">• {req.start_date} to {req.end_date}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{req.employee_name} ({req.employee_id})</h4>
                    <p className="text-xs text-slate-500">Reason: {req.reason}</p>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto flex-shrink-0">
                    <button
                      onClick={() => handleLeaveDecision(req.id, 'approved')}
                      className="flex-1 sm:flex-initial flex items-center justify-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={() => handleLeaveDecision(req.id, 'rejected')}
                      className="flex-1 sm:flex-initial flex items-center justify-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {leaveRequests.filter(l => l.status === 'pending').length === 0 && (
                <p className="text-slate-400 text-center py-8 text-xs font-semibold">No pending leaves currently await decision.</p>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
              <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-4">Historical Leave Ledger</h3>
              <div className="overflow-x-auto border border-gray-150 dark:border-slate-750 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-750 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">End Date</th>
                      <th className="py-3 px-4">Decision Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-750">
                    {leaveRequests.filter(l => l.status !== 'pending').map((req) => (
                      <tr key={req.id}>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{req.employee_name}</td>
                        <td className="py-3 px-4 capitalize">{req.leave_type}</td>
                        <td className="py-3 px-4 font-mono">{req.start_date}</td>
                        <td className="py-3 px-4 font-mono">{req.end_date}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. Payroll Calculations & Benefits Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          
          {/* Overtime approvals segment */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">Overtime Approval Review</h3>
            <div className="space-y-3">
              {overtimeApprovals.filter(ot => ot.status === 'pending').map(ot => (
                <div key={ot.id} className="p-4 border border-gray-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{ot.employee_name} ({ot.employee_id})</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Requested: {ot.hours} Hours @ ₹{ot.rate}/hour ({ot.reason})</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOvertimeDecision(ot.id, 'Approved')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleOvertimeDecision(ot.id, 'Rejected')}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {overtimeApprovals.filter(ot => ot.status === 'pending').length === 0 && (
                <p className="text-slate-400 text-center py-4 text-xs font-semibold">No pending overtime sheets require validation.</p>
              )}
            </div>
          </div>

          {/* Salary calculations segment */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Active Period Compensation Sheet</h3>
                <p className="text-xs text-slate-500 mt-1">Direct payout calculation including validated base, OT, and medical billing achievements.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportPayrollToCSV}
                  className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5 text-brand-primary" />
                  Export payroll CSV
                </button>
                <button
                  onClick={() => { setPayrollLocked(!payrollLocked); setMsg(payrollLocked ? 'Payroll period unlocked.' : 'Payroll period locked and finalized successfully.'); }}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    payrollLocked 
                      ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                      : 'bg-brand-primary text-slate-950 hover:bg-brand-primary-hover'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  {payrollLocked ? 'Unlock Period' : 'Finalize & Lock Payouts'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-150 dark:border-slate-750 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-750 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Base Payout</th>
                    <th className="py-3 px-4">Overtime Amount</th>
                    <th className="py-3 px-4">Incentives</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Total Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-750 font-mono">
                  {employees.map(e => {
                    const base = e.base_salary || 30000;
                    const ot = overtimeApprovals.filter(ot => ot.employee_id === e.employee_id && ot.status === 'Approved').reduce((s, o) => s + (o.hours * o.rate), 0);
                    const inc = e.employee_id === 'EMP-005' ? 2400 : 0;
                    const deductions = e.status === 'inactive' ? 2500 : 0;
                    const net = base + ot + inc - deductions;
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">{e.user_details.first_name} {e.user_details.last_name}</td>
                        <td className="py-3 px-4">₹{base.toLocaleString()}</td>
                        <td className="py-3 px-4 text-emerald-600">+₹{ot.toLocaleString()}</td>
                        <td className="py-3 px-4 text-emerald-650">+₹{inc.toLocaleString()}</td>
                        <td className="py-3 px-4 text-rose-600">-₹{deductions.toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">₹{net.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* 6. Recruitment & Vacancy board */}
      {activeTab === 'recruitment' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Open Vacancies</h3>
                <p className="text-xs text-slate-500 mt-1">Manage process-specific job postings and vacancies.</p>
              </div>
              <button
                onClick={() => setShowAddJobModal(true)}
                className="flex items-center px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs transition"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Post New Opening
              </button>
            </div>

            {/* Add Job vacancy Modal */}
            {showAddJobModal && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <form onSubmit={handlePostJob} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 p-6 w-full max-w-md space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Post Vacancy Opening</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Job Designation Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Claims Specialist"
                      value={newJob.title}
                      onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-455">Department</label>
                      <select
                        value={newJob.department}
                        onChange={(e) => setNewJob(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      >
                        <option value="Claims">Claims</option>
                        <option value="Accounts">Accounts</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-455">Vacancies count</label>
                      <input
                        type="number"
                        min={1}
                        value={newJob.vacancies}
                        onChange={(e) => setNewJob(prev => ({ ...prev, vacancies: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddJobModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Post Vacancy
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobOpenings.map(job => (
                <div key={job.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{job.title}</h4>
                      <p className="text-xs text-slate-455">{job.department} department • {job.vacancies} Open Position(s)</p>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      {job.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-gray-100 dark:border-slate-800 pt-2.5">
                    <span>Exp: {job.experience}</span>
                    <span>Target Date: {job.target_date}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Active Candidates Pipeline</h3>
                <p className="text-xs text-slate-500 mt-1">Screen resumes, track feedback, and offer packages.</p>
              </div>
              <button
                onClick={() => setShowAddCandidateModal(true)}
                className="flex items-center px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs transition"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Register Candidate
              </button>
            </div>

            {/* Add Candidate Modal */}
            {showAddCandidateModal && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <form onSubmit={handleAddCandidate} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 p-6 w-full max-w-md space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Add Candidate File</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priyan Singh"
                      value={newCandidate.name}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="email@address.com"
                      value={newCandidate.email}
                      onChange={(e) => setNewCandidate(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-455">Phone Number</label>
                      <input
                        type="text"
                        placeholder="9876..."
                        value={newCandidate.phone}
                        onChange={(e) => setNewCandidate(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-455">Associated Job Opening</label>
                      <select
                        value={newCandidate.job_id}
                        onChange={(e) => setNewCandidate(prev => ({ ...prev, job_id: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      >
                        {jobOpenings.map(j => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCandidateModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Register Candidate
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {candidates.map(c => {
                const job = jobOpenings.find(j => j.id === c.job_id);
                return (
                  <div key={c.id} className="p-4 border border-gray-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{c.name}</h4>
                      <p className="text-xs text-slate-500">Contact: {c.email} | Mobile: {c.phone}</p>
                      <p className="text-[11px] text-slate-450 italic">Feedback: {c.feedback}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-shrink-0">
                      <select
                        value={c.stage}
                        onChange={(e) => handleUpdateCandidateStage(c.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded text-xs"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Screening">Screening</option>
                        <option value="Interview">Interview</option>
                        <option value="Selected">Selected</option>
                        <option value="Offer Accepted">Offer Accepted</option>
                        <option value="Rejected">Rejected</option>
                      </select>

                      {c.stage === 'Selected' || c.stage === 'Offer Accepted' ? (
                        <button
                          onClick={() => handleConvertCandidateToEmployee(c)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                        >
                          Convert to Staff Profile
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* 7. Onboarding Checklists Tab */}
      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">Active Onboarding Checklists</h3>
            
            <div className="space-y-6">
              {onboardings.map(o => (
                <div key={o.id} className="p-5 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{o.name}</h4>
                      <p className="text-xs text-slate-500">Designation: {o.job} • Joined: {o.start_date}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium">
                    {Object.keys(o.checklist).map(key => (
                      <label key={key} className="flex items-center space-x-2.5 p-2 border border-gray-100 dark:border-slate-750 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750/30">
                        <input
                          type="checkbox"
                          checked={o.checklist[key]}
                          onChange={() => toggleOnboardingChecklist(o.id, key)}
                          className="h-4.5 w-4.5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <span className="capitalize text-slate-700 dark:text-slate-350">{key.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 8. Relations & Grievances Tab */}
      {activeTab === 'relations' && (
        <div className="space-y-6">
          
          {/* Exits Segment */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">Exit and Notice Period Clearance</h3>
            <div className="space-y-4">
              {exitRequests.map(ex => (
                <div key={ex.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ex.employee_name} ({ex.employee_id})</h4>
                      <p className="text-xs text-slate-500">Resignation: {ex.resignation_date} • Notice End: {ex.exit_date}</p>
                    </div>
                    {Object.values(ex.clearance).every(v => v === true) ? (
                      <button
                        onClick={() => handleFinalizeExit(ex)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold"
                      >
                        Finalize & Deactivate Profile
                      </button>
                    ) : (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase">
                        Clearance pending
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-slate-800 pt-3 text-xs">
                    {['it', 'finance', 'operations'].map(dept => (
                      <label key={dept} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ex.clearance[dept]}
                          onChange={() => handleExitClearance(ex.id, dept)}
                          className="h-4.5 w-4.5 rounded border-gray-300 text-brand-primary"
                        />
                        <span className="uppercase font-bold tracking-wider text-[10px] text-slate-455">{dept} Clearance</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Confidential Employee Relations Inbox</h3>
                <p className="text-xs text-slate-500 mt-1">Authorized grievance filings, strictly restricted from general notifications or logs.</p>
              </div>
              <button
                onClick={() => setShowGrievanceModal(true)}
                className="flex items-center px-3 py-1.5 bg-brand-primary text-slate-950 hover:bg-brand-primary-hover font-bold rounded-lg text-xs transition"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Record Case
              </button>
            </div>

            {/* Add Grievance Modal */}
            {showGrievanceModal && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <form onSubmit={handleAddGrievance} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-205 p-6 w-full max-w-md space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">File Secure Grievance Record</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Employee Reference</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EMP-005 (Neelam Gupta)"
                      value={newGrievance.employee}
                      onChange={(e) => setNewGrievance(prev => ({ ...prev, employee: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-455">Category</label>
                      <select
                        value={newGrievance.category}
                        onChange={(e) => setNewGrievance(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      >
                        <option value="Payroll Discrepancy">Payroll Discrepancy</option>
                        <option value="Workspace Relations">Workspace Relations</option>
                        <option value="Compliance Audit">Compliance Audit</option>
                        <option value="General">General Support</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-455">Priority</label>
                      <select
                        value={newGrievance.priority}
                        onChange={(e) => setNewGrievance(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-455">Incident Details</label>
                    <textarea
                      required
                      placeholder="Brief description of the support case..."
                      value={newGrievance.details}
                      onChange={(e) => setNewGrievance(prev => ({ ...prev, details: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowGrievanceModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-primary text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Log Case File
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {grievances.map(g => (
                <div key={g.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        g.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
                      }`}>{g.priority} Priority</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">{g.employee}</h4>
                    </div>
                    {g.status === 'open' ? (
                      <button
                        onClick={() => handleResolveGrievance(g.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                      >
                        Resolve Case
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Resolved</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-550 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-750 leading-relaxed font-normal">{g.details}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 9. Training and QA Tab */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white">HIPAA Compliance & Client SOP Training Schedules</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainings.map(t => (
                <div key={t.id} className="p-4 border border-gray-150 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t.topic}</h4>
                      <p className="text-xs text-slate-500">Instructor: {t.trainer} • Scheduled: {t.schedule}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                      t.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-550 pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <span>Attendees: {t.attendees.join(', ')}</span>
                    {t.status === 'scheduled' ? (
                      <button
                        onClick={() => { setTrainings(prev => prev.map(item => item.id === t.id ? { ...item, status: 'completed' } : item)); setMsg('Training program completed.'); }}
                        className="px-2 py-1 bg-brand-primary text-slate-950 font-bold rounded text-[10px]"
                      >
                        Complete Session
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ----------------- EMPLOYEE DETAIL DRAWER ----------------- */}
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
            {['profile', 'attendance', 'payroll', 'training'].map((tab) => (
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
            
            {empDetailTab === 'profile' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl space-y-3 border border-gray-100 dark:border-slate-750">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Profile Credentials</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Username</p>
                      <p className="font-semibold">{selectedEmp.user_details.username}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Email Address</p>
                      <p className="font-semibold truncate">{selectedEmp.user_details.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Employment Status</p>
                      <p className="font-semibold">{selectedEmp.status}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Leave Balance</p>
                      <p className="font-semibold">{selectedEmp.leave_balance} Days</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {empDetailTab === 'attendance' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Punch Records</h4>
                {attendanceRecords.filter(a => a.employee_name?.toLowerCase().includes(selectedEmp.user_details.first_name.toLowerCase())).map(rec => (
                  <div key={rec.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-750 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{rec.date}</p>
                      <p className="text-[10px] text-slate-455">Punches: {rec.check_in || 'N/A'} - {rec.check_out || 'N/A'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">{rec.status}</span>
                  </div>
                ))}
              </div>
            )}

            {empDetailTab === 'payroll' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Compensation Ledger</h4>
                <div className="p-4 border border-gray-150 dark:border-slate-750 rounded-xl space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-750">
                    <span className="text-slate-400">Base Salary</span>
                    <span className="font-bold font-mono">₹{(selectedEmp.base_salary || 30000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-750">
                    <span className="text-slate-400">Allowances</span>
                    <span className="font-bold font-mono">₹3,400</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-750 font-semibold text-emerald-600">
                    <span className="text-slate-400">Target Incentives</span>
                    <span className="font-mono">₹{selectedEmp.employee_id === 'EMP-005' ? '2,400' : '0'}</span>
                  </div>
                </div>
              </div>
            )}

            {empDetailTab === 'training' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Compliance Records</h4>
                {trainings.filter(t => t.attendees.includes(selectedEmp.employee_id)).map(t => (
                  <div key={t.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-150 dark:border-slate-750 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{t.topic}</p>
                      <p className="text-[10px] text-slate-400">Date: {t.schedule}</p>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">{t.status}</span>
                  </div>
                ))}
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

    </div>
  );
};
export default Dashboard;
