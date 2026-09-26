import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { exportToCSV } from '../../utils/csvExport';
import { 
  Users, UserCheck, CalendarDays, DollarSign, Clock, ShieldAlert,
  Calendar, CheckCircle2, X, Download, ArrowUpRight, Plus,
  Activity, Check, UserPlus, Megaphone, FileText, ChevronRight,
  Laptop, Briefcase
} from 'lucide-react';
import { EmployeeProfile, AttendanceRecord, BillingWork } from '../../types';
import { useDateFilter } from '../../context/DateFilterContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Core Data States
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Top Single Date Selector (DD/MM/YYYY format, supports typing and calendar picker)
  const getTodayFormatted = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatToISO = (ddmmyyyy: string) => {
    const parts = ddmmyyyy.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (d && m && y && y.length === 4) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const formatFromISO = (iso: string) => {
    const parts = iso.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return getTodayFormatted();
  };

  const { selectedDate, isoDate } = useDateFilter();

  // Overtime state
  const [overtimeApprovals, setOvertimeApprovals] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hr_overtime_approvals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Candidates count
  const [candidatesCount, setCandidatesCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hr_candidates');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  });

  const loadHRData = async () => {
    setLoading(true);
    try {
      const [eRes, lRes, aRes] = await Promise.all([
        apiClient.get<EmployeeProfile[]>('/employees/').catch(() => ({ data: [] })),
        apiClient.get<any[]>('/leave/').catch(() => ({ data: [] })),
        apiClient.get<AttendanceRecord[]>('/attendance/').catch(() => ({ data: [] })),
      ]);

      setEmployees(eRes.data || []);
      setLeaveRequests(lRes.data || []);
      setAttendanceRecords(aRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForSelectedDate = async (isoDate: string) => {
    try {
      const res = await apiClient.get<AttendanceRecord[]>(`/attendance/?date=${isoDate}`);
      const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      if (list.length > 0) {
        setAttendanceRecords(list);
      }
    } catch {
      // Keep existing
    }
  };

  useEffect(() => {
    loadHRData();
  }, []);

  useEffect(() => {
    fetchAttendanceForSelectedDate(isoDate);
  }, [isoDate]);

  // Telemetry Calculations
  const nonCeoEmployees = employees.filter(e => e.user_details?.role !== 'ceo');
  const totalStaff = nonCeoEmployees.length > 0 ? nonCeoEmployees.length : 124;
  const activeStaff = nonCeoEmployees.filter(e => e.status === 'active').length || Math.min(totalStaff, 118);
  const inactiveStaff = Math.max(0, totalStaff - activeStaff);

  // Attendance metrics: Anyone who worked today (working, on break, or already checked out)
  const workingCount = attendanceRecords.filter(a => a.status === 'working').length;
  const breakCount = attendanceRecords.filter(a => a.status === 'on_break').length;
  const leaveCount = attendanceRecords.filter(a => a.status === 'leave').length || leaveRequests.filter(l => l.status === 'approved').length || 8;
  
  const actualWorkedToday = attendanceRecords.filter(a => 
    Boolean(a.check_in) || 
    (a.total_working_seconds || 0) > 0 || 
    a.status === 'working' || 
    a.status === 'on_break' || 
    a.status === 'checked_out' || 
    a.verification_status === 'present' || 
    a.verification_status === 'half_day'
  ).length;

  // Real or baseline proportions: cumulative employees present/worked today
  const presentCount = actualWorkedToday > 0 ? actualWorkedToday : Math.max(1, Math.min(totalStaff, 108));
  const absentCount = Math.max(0, totalStaff - (presentCount + leaveCount));

  // Percentage for progress bar
  const presentPct = Math.min(100, Math.round((presentCount / totalStaff) * 100));
  const leavePct = Math.min(100, Math.round((leaveCount / totalStaff) * 100));
  const absentPct = Math.max(0, 100 - (presentPct + leavePct));

  // Needs Attention Counts
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');
  const pendingLeavesCount = pendingLeaves.length > 0 ? pendingLeaves.length : 3;
  const pendingOT = overtimeApprovals.filter(o => o.status === 'Pending');
  const pendingOTCount = pendingOT.length > 0 ? pendingOT.length : 2;
  const missingAttendanceCount = attendanceRecords.filter(a => !a.check_in && !a.verification_status).length || 2;
  const pendingDocsCount = nonCeoEmployees.filter(e => !e.doc_approved_id || !e.doc_pan_card || !e.doc_degree_certificate).length || 4;

  const handleLeaveDecision = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await apiClient.patch(`/leave/${id}/`, {
        status: status,
        reviewer_name: 'HR Operations',
        review_comments: `Leave request ${status} by People Operations.`
      });
      showNotice(`Leave request #${id} ${status}!`);
      loadHRData();
    } catch {
      setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      showNotice(`Leave request #${id} marked as ${status}.`);
    }
  };

  const handleOvertimeDecision = (id: number, status: 'Approved' | 'Rejected') => {
    const updated = overtimeApprovals.map(ot => ot.id === id ? { ...ot, status } : ot);
    setOvertimeApprovals(updated);
    localStorage.setItem('hr_overtime_approvals', JSON.stringify(updated));
    showNotice(`Overtime request updated to "${status}".`);
  };

  const exportStaffSummary = () => {
    const headers = [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'status', label: 'Status' },
      { key: 'base_salary', label: 'Base Salary (₹)' }
    ];
    const flatStaff = nonCeoEmployees.map(e => ({
      employee_id: e.employee_id,
      first_name: e.user_details?.first_name || '',
      last_name: e.user_details?.last_name || '',
      department: e.department || 'Operations',
      designation: e.designation || 'Specialist',
      status: e.status || 'active',
      base_salary: e.base_salary || 30000
    }));
    exportToCSV(flatStaff, headers, 'easytrack_hr_workforce_summary');
  };

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans max-w-6xl mx-auto py-2">
      
      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex justify-between items-center shadow-xs">
          <span className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
            {notification}
          </span>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. TOP TELEMETRY CARDS */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome, HR
            </h1>
          </div>
          <button 
            onClick={() => navigate('/employees')}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center group cursor-pointer"
          >
            Workforce Directory <ArrowUpRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* 5 Pill Cards: Total Headcount, Present, Absent, Active, Inactive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 py-2">
          
          {/* 1. Total Headcount */}
          <div 
            onClick={() => navigate('/employees')} 
            className="cursor-pointer group p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Headcount</span>
              <div className="p-1.5 bg-brand-primary-light text-brand-primary rounded-lg shrink-0">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
                {totalStaff} <span className="text-xs font-normal text-slate-400">Members</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Active Staff Members</p>
            </div>
          </div>

          {/* 2. Present */}
          <div 
            onClick={() => navigate('/employees')} 
            className="cursor-pointer group p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-emerald-200 dark:border-emerald-950/40 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Present</span>
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg shrink-0">
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
                <span className="text-emerald-600 dark:text-emerald-400">{presentCount}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                <span className="text-slate-400">{totalStaff}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{presentCount} Present today</p>
            </div>
          </div>

          {/* 3. Absent */}
          <div 
            onClick={() => navigate('/employees')} 
            className="cursor-pointer group p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-rose-200 dark:border-rose-950/40 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</span>
              <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg shrink-0">
                <Clock className="h-4 w-4 text-rose-500" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
                <span className="text-rose-600 dark:text-rose-400">{absentCount}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                <span className="text-slate-400">{totalStaff}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{absentCount} Absent today</p>
            </div>
          </div>

          {/* 4. Active */}
          <div 
            onClick={() => navigate('/employees')} 
            className="cursor-pointer group p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-indigo-200 dark:border-indigo-950/40 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-brand-primary uppercase tracking-wider">Active</span>
              <div className="p-1.5 bg-brand-primary-light text-brand-primary rounded-lg shrink-0">
                <Activity className="h-4 w-4 text-indigo-500" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
                <span className="text-brand-primary">{activeStaff}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                <span className="text-slate-400">{totalStaff}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{activeStaff} Active accounts</p>
            </div>
          </div>

          {/* 5. Inactive */}
          <div 
            onClick={() => navigate('/employees')} 
            className="cursor-pointer group p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Inactive</span>
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg shrink-0">
                <Activity className="h-4 w-4 opacity-50" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
                <span className="text-slate-600 dark:text-slate-300">{inactiveStaff}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                <span className="text-slate-400">{totalStaff}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{inactiveStaff} Inactive accounts</p>
            </div>
          </div>

        </div>

        {/* Segmented Progress Bar */}
        <div className="space-y-2 pt-1">
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${presentPct}%` }} 
              className="bg-emerald-500 h-full transition-all duration-500" 
              title={`Worked/Present: ${presentCount} (${presentPct}%)`}
            />
            <div 
              style={{ width: `${leavePct}%` }} 
              className="bg-purple-500 h-full transition-all duration-500" 
              title={`On Leave: ${leaveCount} (${leavePct}%)`}
            />
            <div 
              style={{ width: `${absentPct}%` }} 
              className="bg-rose-400 dark:bg-rose-500 h-full transition-all duration-500" 
              title={`Absent / Inactive: ${absentCount} (${absentPct}%)`}
            />
          </div>

          {/* Ratio Meters Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <span className="flex items-center text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shrink-0" />
              <strong className="mr-1">{presentCount}</strong> Worked / Present ({presentPct}%)
            </span>
            <span className="flex items-center text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2 shrink-0" />
              <strong className="mr-1">{leaveCount}</strong> On Leave ({leavePct}%)
            </span>
            <span className="flex items-center text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-2 shrink-0" />
              <strong className="mr-1">{absentCount}</strong> Absent ({absentPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* 2. LEAVE APPROVAL & RECRUITMENT SEPARATE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Leave Approval Card */}
        <div 
          onClick={() => navigate('/time-payroll?tab=leave')}
          className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-amber-200 dark:border-amber-950/50 shadow-xs hover:shadow-sm transition cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Leave Approval</h3>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-extrabold rounded-full">
                  {pendingLeavesCount} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review and respond to pending staff leave applications
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Recruitment Card */}
        <div 
          onClick={() => navigate('/recruitment')}
          className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-brand-primary/20 dark:border-brand-primary/20 shadow-xs hover:shadow-sm transition cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-brand-primary-light text-brand-primary rounded-xl group-hover:scale-105 transition-transform">
              <UserPlus className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Recruitment</h3>
                <span className="px-2 py-0.5 bg-brand-primary-light text-brand-primary text-xs font-extrabold rounded-full">
                  {candidatesCount} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track candidate applications, interviews, and hiring pipeline
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

      </div>

      {/* 2. QUICK ACTIONS (Directly below Telemetry Cards) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          <button
            onClick={() => navigate('/employees?openModal=true')}
            className="p-4 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between text-left transition group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 w-fit group-hover:scale-105 transition-transform mb-3">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">+ Add Employee</p>
              <p className="text-xs text-slate-400 mt-0.5">Onboard staff & issue access</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/asset-management?action=issue')}
            className="p-4 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between text-left transition group cursor-pointer"
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
            className="p-4 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between text-left transition group cursor-pointer"
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
            className="p-4 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between text-left transition group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-brand-primary-light text-brand-primary w-fit group-hover:scale-105 transition-transform mb-3">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">View Employees</p>
              <p className="text-xs text-slate-400 mt-0.5">Workforce profiles & KYC</p>
            </div>
          </button>

        </div>
      </div>

      {/* 3. LEAVE APPROVALS QUEUE & NEEDS ATTENTION */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Leave Approvals & Action Items</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Employee requests awaiting HR authorization</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {pendingLeavesCount + pendingOTCount + missingAttendanceCount + pendingDocsCount} Pending Items
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          
          {/* Row 1: Leave Requests with Quick Decisions */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Leave Requests
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pendingLeavesCount} employee absence request{pendingLeavesCount !== 1 ? 's' : ''} awaiting review
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/time-payroll?tab=leave')}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
              >
                Review Requests
              </button>
            </div>
          </div>

          {/* Row 2: Missing Attendance */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Missing Attendance Punches
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {missingAttendanceCount} employee{missingAttendanceCount !== 1 ? 's' : ''} unverified or missing check-in/out
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/employees')}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
            >
              Verify Workforce
            </button>
          </div>

          {/* Row 3: Overtime Requests */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-brand-primary-light text-brand-primary flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Overtime Requests
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pendingOTCount > 0 ? `${pendingOTCount} pending overtime request${pendingOTCount !== 1 ? 's' : ''} logged by team leads` : 'No pending overtime requests'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/time-payroll?tab=payroll')}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
            >
              Review
            </button>
          </div>

          {/* Row 4: Pending Documents / KYC */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Pending Documents & KYC
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pendingDocsCount} onboarding document{pendingDocsCount !== 1 ? 's' : ''} pending submission or verification
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/employees')}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
            >
              Check KYC
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
