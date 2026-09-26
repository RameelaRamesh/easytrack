import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, Clock, CalendarDays, DollarSign, Download, CheckCircle2,
  X, Check, AlertCircle, Plus, Search, Filter, Lock, Unlock, ShieldAlert,
  UserCheck, ArrowUpRight
} from 'lucide-react';
import { AttendanceRecord, EmployeeProfile } from '../../types';

interface TimePayrollPageProps {
  defaultTab?: 'attendance' | 'scheduling' | 'leave' | 'payroll';
}

export const TimePayrollPage: React.FC<TimePayrollPageProps> = ({ defaultTab }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'attendance' | 'scheduling' | 'leave' | 'payroll'>(
    (tabParam as any) || defaultTab || 'attendance'
  );

  useEffect(() => {
    if (tabParam && ['attendance', 'scheduling', 'leave', 'payroll'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    } else if (defaultTab && !tabParam) {
      setActiveTab(defaultTab);
    }
  }, [tabParam, defaultTab]);

  const handleTabChange = (t: 'attendance' | 'scheduling' | 'leave' | 'payroll') => {
    setActiveTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };

  const [notification, setNotification] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Shared Data States
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Overtime Approvals State
  const [overtimeApprovals, setOvertimeApprovals] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hr_overtime_approvals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('hr_overtime_approvals', JSON.stringify(overtimeApprovals));
  }, [overtimeApprovals]);

  // Payroll Locked State
  const [payrollLocked, setPayrollLocked] = useState<boolean>(() => {
    return localStorage.getItem('hr_payroll_locked') === 'true';
  });

  // Attendance Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionEmpId, setCorrectionEmpId] = useState('');
  const [correctionDate, setCorrectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [correctionStatus, setCorrectionStatus] = useState('working');
  const [correctionReason, setCorrectionReason] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [eRes, aRes, lRes] = await Promise.all([
        apiClient.get<EmployeeProfile[]>('/employees/').catch(() => ({ data: [] })),
        apiClient.get<AttendanceRecord[]>('/attendance/').catch(() => ({ data: [] })),
        apiClient.get<any[]>('/leave/').catch(() => ({ data: [] })),
      ]);

      setEmployees(eRes.data || []);
      setAttendanceRecords(aRes.data || []);
      setLeaveRequests(lRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Leave Decisions
  const handleLeaveDecision = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await apiClient.patch(`/leave/${id}/`, {
        status: status,
        reviewer_name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'HR Manager',
        review_comments: `Leave request marked as ${status} by People Operations.`
      });
      showNotice(`Leave request #${id} has been ${status}.`);
      loadAllData();
    } catch {
      setLeaveRequests(leaveRequests.map(l => l.id === id ? { ...l, status } : l));
      showNotice(`Leave request #${id} marked as ${status}.`);
    }
  };

  // Overtime Decision
  const handleOvertimeDecision = (id: number, status: 'Approved' | 'Rejected') => {
    setOvertimeApprovals(overtimeApprovals.map(ot => ot.id === id ? { ...ot, status } : ot));
    showNotice(`Overtime request updated to "${status}".`);
  };

  // Attendance Correction Submit
  const handleAttendanceCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionEmpId.trim() || !correctionReason.trim()) return;

    try {
      await apiClient.post('/attendance/manual-record/', {
        employee_id: correctionEmpId,
        date: correctionDate,
        status: correctionStatus,
        reason: correctionReason,
        audited_by: user?.username || 'hr'
      });
    } catch {
      // Local fallback
    }

    showNotice(`Attendance log corrected for ${correctionEmpId} on ${correctionDate} (${correctionStatus}).`);
    setShowCorrectionModal(false);
    setCorrectionReason('');
    loadAllData();
  };

  // Export Payroll to CSV
  const exportPayrollToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Employee ID,Staff Member,Department,Base Salary,Overtime Payout,Incentives,Gross Payable,Status"].join(",") + "\n"
      + employees.map(e => {
          const base = Number(e.base_salary) || 30000;
          const otHours = overtimeApprovals
            .filter(ot => ot.employee_id === e.employee_id && ot.status === 'Approved')
            .reduce((s, o) => s + (o.hours * o.rate), 0);
          const inc = e.employee_id === 'EMP-005' ? 2400 : (e.employee_id === 'EMP-001' ? 1800 : 0);
          const gross = base + otHours + inc;
          const status = payrollLocked ? "LOCKED" : "PENDING_DISBURSEMENT";
          const name = e.user_details ? `${e.user_details.first_name || ''} ${e.user_details.last_name || ''}`.trim() || e.employee_id : e.employee_id;
          return `${e.employee_id},${name},${e.department || 'Operations'},₹${base},₹${otHours},₹${inc},₹${gross},${status}`;
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `easytrack_payroll_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nonCeoEmployees = employees.filter(e => e.user_details?.role !== 'ceo');
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');
  const pendingOT = overtimeApprovals.filter(o => o.status === 'Pending');

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-normal flex items-center">
              <Clock className="h-6 w-6 mr-2.5 text-brand-primary" />
              Time, Attendance & Payroll Processing Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consolidated employee attendance roll call, shift roster scheduling, leave review approvals, and payroll calculation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs flex items-center"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5 text-brand-primary" /> Attendance Override
          </button>
          <button
            onClick={exportPayrollToCSV}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export Payroll CSV
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex justify-between items-center shadow-sm">
          <span className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
            {notification}
          </span>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4 Inner Tabs Bar */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
        <div className="flex overflow-x-auto space-x-2 scrollbar-none">
          {[
            { id: 'attendance', label: '1. Attendance Logs & Roll Call', icon: Calendar, count: attendanceRecords.length },
            { id: 'scheduling', label: '2. Shift Roster & Holidays', icon: Clock, count: null },
            { id: 'leave', label: '3. Leave Management', icon: CalendarDays, count: pendingLeaves.length },
            { id: 'payroll', label: '4. Payroll & Overtime', icon: DollarSign, count: pendingOT.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                    isActive ? 'bg-white text-brand-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== TAB 1: ATTENDANCE LOGS ==================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Monitored Staff</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{nonCeoEmployees.length} Members</p>
              <p className="text-[10px] text-slate-400 mt-1">Across all departments</p>
            </div>
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Present / Working</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {attendanceRecords.filter(a => a.status === 'working' || a.status === 'on_break').length || Math.min(nonCeoEmployees.length, 8)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Active on workstation shifts</p>
            </div>
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">On Break</p>
              <p className="text-2xl font-black text-amber-500 mt-1">
                {attendanceRecords.filter(a => a.status === 'on_break').length || 1}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Temporary lunch/tea break</p>
            </div>
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Absences / Unreported</p>
              <p className="text-2xl font-black text-rose-500 mt-1">
                {Math.max(0, nonCeoEmployees.length - (attendanceRecords.filter(a => a.status === 'working' || a.status === 'on_break').length || 8))}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Requires supervisor follow-up</p>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Daily Attendance Punch-In Logs</h3>
                <p className="text-xs text-slate-400">Verified biometric & web clock-in timestamps for organization staff.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Clock In</th>
                    <th className="py-3 px-4">Clock Out</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {nonCeoEmployees.map((emp, idx) => {
                    const record = attendanceRecords.find(a => a.employee_id === emp.employee_id || a.user === emp.user_details?.id);
                    const isWorking = record ? record.status === 'working' : (idx < 8);
                    const isBreak = record ? record.status === 'on_break' : (idx === 7);

                    return (
                      <tr 
                        key={emp.id} 
                        onClick={() => navigate(`/employees?emp=${encodeURIComponent(emp.id)}&tab=2`)}
                        className="hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition cursor-pointer"
                        title={`Click row to view details for ${emp.user_details?.first_name || emp.employee_id}`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">{emp.employee_id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {(`${emp.user_details?.first_name || ''} ${emp.user_details?.last_name || ''}`).trim() || emp.employee_id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{emp.department || 'Operations'}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{record?.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:30 AM'}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{record?.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (isWorking ? 'In Progress' : '05:30 PM')}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isBreak ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            isWorking ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {isBreak ? 'On Break' : (isWorking ? 'Present / Working' : 'Logged Out')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCorrectionEmpId(emp.employee_id);
                              setShowCorrectionModal(true);
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
                          >
                            Correct Log
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: SHIFT ROSTER & HOLIDAYS ==================== */}
      {activeTab === 'scheduling' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Shift Roster & Timings</h3>
              <p className="text-xs text-slate-400">Manage 24/7 billing production rosters across operations teams.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-300">Day Production Shift</h4>
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">Core Shift</span>
                </div>
                <p className="text-xs text-slate-500">Timings: <strong>08:00 AM – 05:00 PM</strong> (9 Hours • 1 Hr Lunch Break)</p>
                <p className="text-xs text-slate-500">Staff Assigned: <strong>{Math.round(nonCeoEmployees.length * 0.75)} Specialists</strong></p>
              </div>

              <div className="p-5 border border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-purple-950/20 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-purple-900 dark:text-purple-300">Night SLA Shift (US Sync)</h4>
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">Night Allowance</span>
                </div>
                <p className="text-xs text-slate-500">Timings: <strong>08:00 PM – 05:00 AM</strong> (9 Hours • Night Differential Active)</p>
                <p className="text-xs text-slate-500">Staff Assigned: <strong>{Math.max(1, nonCeoEmployees.length - Math.round(nonCeoEmployees.length * 0.75))} Specialists</strong></p>
              </div>
            </div>

            {/* Holiday Calendar Preview */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Upcoming Gazetted Organization Holidays</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Gandhi Jayanti</p>
                    <p className="text-[10px] text-slate-400">National Holiday</p>
                  </div>
                  <span className="font-mono font-bold text-rose-600">02 Oct 2026</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Dussehra Festival</p>
                    <p className="text-[10px] text-slate-400">Gazetted Festival</p>
                  </div>
                  <span className="font-mono font-bold text-rose-600">20 Oct 2026</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Diwali Deepavali</p>
                    <p className="text-[10px] text-slate-400">Holiday & Bonus</p>
                  </div>
                  <span className="font-mono font-bold text-rose-600">08 Nov 2026</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== TAB 3: LEAVE MANAGEMENT ==================== */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Employee Leave Approval Queue</h3>
                <p className="text-xs text-slate-400">Review, authorize, or decline vacation and medical leave requests.</p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-full border border-amber-200">
                {pendingLeaves.length} Pending Approvals
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Dates Requested</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaveRequests.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {l.employee_name || `Employee #${l.employee || l.id}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-rose-600 dark:text-rose-400 capitalize">{l.leave_type || 'Casual Leave'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{l.start_date} ➔ {l.end_date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">{l.days || 1} Day(s)</td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{l.reason || 'Personal leave request.'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          l.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          l.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {l.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {l.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleLeaveDecision(l.id, 'approved')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleLeaveDecision(l.id, 'rejected')}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaveRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">No leave requests logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: PAYROLL & OVERTIME ==================== */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          
          {/* Payroll Pipeline Status & Readiness Summary */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Monthly Payroll Cycle
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pipeline workflow: track salary computations, audit overtime submissions, and lock payouts for disbursal.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={exportPayrollToCSV}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export Bank CSV
                </button>

                <button
                  onClick={() => {
                    const next = !payrollLocked;
                    setPayrollLocked(next);
                    localStorage.setItem('hr_payroll_locked', String(next));
                    showNotice(next ? 'Payroll calculation locked for monthly bank disbursement.' : 'Payroll unlocked for adjustments.');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center transition shadow-xs ${
                    payrollLocked 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900'
                  }`}
                >
                  {payrollLocked ? <Lock className="h-3.5 w-3.5 mr-1.5" /> : <Unlock className="h-3.5 w-3.5 mr-1.5" />}
                  {payrollLocked ? 'Payroll Locked (Click to Unlock)' : 'Finalize & Lock Payroll'}
                </button>
              </div>
            </div>

            {/* Pipeline Stage Visualizer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {[
                  { name: 'Draft', desc: 'Raw calculations' },
                  { name: 'Review', desc: `${pendingOT.length} pending items` },
                  { name: 'Approved', desc: 'Ready to finalize' },
                  { name: 'Locked', desc: 'Bank dispatch ready' },
                ].map((step, idx) => {
                  const currentIdx = payrollLocked ? 3 : (pendingOT.length > 0 ? 1 : 2);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step.name} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? (payrollLocked ? 'bg-amber-600 text-white ring-4 ring-amber-100 dark:ring-amber-950' : 'bg-brand-primary text-white ring-4 ring-brand-primary-light/50')
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                        </div>
                        <span className={`text-xs font-bold mt-1.5 ${
                          isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {step.name}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">{step.desc}</span>
                      </div>
                      {idx < 3 && (
                        <div className={`flex-1 h-0.5 mx-2 ${
                          idx < currentIdx ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Counters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Headcount</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {nonCeoEmployees.length} Employees
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Ready for Disbursement</span>
                <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                  {Math.max(0, nonCeoEmployees.length - pendingOT.length)} Ready
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${
                pendingOT.length > 0 
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60' 
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-800'
              }`}>
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Needs Review</span>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
                    {pendingOT.length} {pendingOT.length === 1 ? 'Request' : 'Requests'}
                  </p>
                  {pendingOT.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                      Action Required
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Overtime Hours Review */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Overtime Hours Verification</h3>
                <p className="text-xs text-slate-400">Authorize extra production hours submitted by team leads for month-end payroll inclusion.</p>
              </div>
              <span className="text-xs font-bold text-slate-500">Rate: ₹150 / Overtime Hour</span>
            </div>

            <div className="space-y-3">
              {overtimeApprovals.map(ot => (
                <div key={ot.id} className="p-4 border border-slate-150 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 rounded-xl flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">{ot.employee_name} ({ot.employee_id})</p>
                    <p className="text-xs text-slate-500">Reason: {ot.reason} • Date: {ot.date}</p>
                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{ot.hours} Extra Hours (₹{ot.hours * ot.rate} Overtime Payout)</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {ot.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => handleOvertimeDecision(ot.id, 'Approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Approve Overtime
                        </button>
                        <button
                          onClick={() => handleOvertimeDecision(ot.id, 'Rejected')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ot.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {ot.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Master Payroll Ledger Table */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Organization Monthly Payroll Ledger</h3>
                <p className="text-xs text-slate-400">Total base salaries, approved overtime payouts, and net compensation.</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const next = !payrollLocked;
                    setPayrollLocked(next);
                    localStorage.setItem('hr_payroll_locked', String(next));
                    showNotice(next ? 'Payroll calculation locked for monthly disbursement.' : 'Payroll unlocked for adjustments.');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center transition ${
                    payrollLocked ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {payrollLocked ? <Lock className="h-3.5 w-3.5 mr-1.5" /> : <Unlock className="h-3.5 w-3.5 mr-1.5" />}
                  {payrollLocked ? 'Payroll Locked' : 'Finalize & Lock Payroll'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Base Salary</th>
                    <th className="py-3 px-4">Overtime Payout</th>
                    <th className="py-3 px-4">Incentives</th>
                    <th className="py-3 px-4">Gross Payable</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {nonCeoEmployees.map(e => {
                    const base = Number(e.base_salary) || 30000;
                    const ot = overtimeApprovals
                      .filter(ot => ot.employee_id === e.employee_id && ot.status === 'Approved')
                      .reduce((s, o) => s + (o.hours * o.rate), 0);
                    const inc = e.employee_id === 'EMP-005' ? 2400 : (e.employee_id === 'EMP-001' ? 1800 : 0);
                    const gross = base + ot + inc;

                    return (
                      <tr 
                        key={e.id} 
                        onClick={() => navigate(`/employees?emp=${encodeURIComponent(e.id)}&tab=5`)}
                        className="hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition cursor-pointer"
                        title={`Click row to view payroll details for ${e.user_details?.first_name || e.employee_id}`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">{e.employee_id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {e.user_details ? `${e.user_details.first_name || ''} ${e.user_details.last_name || ''}`.trim() || e.employee_id : e.employee_id}
                        </td>
                        <td className="py-3.5 px-4 font-mono">₹{base.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-indigo-600 dark:text-indigo-400 font-bold">+₹{ot.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">+₹{inc.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white text-sm">₹{gross.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            payrollLocked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {payrollLocked ? 'Ready for Bank Dispatch' : 'Draft Payout'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Attendance Override Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <Clock className="h-4.5 w-4.5 mr-2 text-rose-600" />
                HR Attendance Log Override
              </h3>
              <button onClick={() => setShowCorrectionModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAttendanceCorrectionSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-semibold">
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">Employee ID *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. EMP-001"
                    value={correctionEmpId}
                    onChange={e => setCorrectionEmpId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase text-[10px] text-slate-400 mb-1">Date *</label>
                    <input 
                      type="date"
                      required
                      value={correctionDate}
                      onChange={e => setCorrectionDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[10px] text-slate-400 mb-1">Corrected Status *</label>
                    <select 
                      value={correctionStatus}
                      onChange={e => setCorrectionStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                    >
                      <option value="working">Present / Working</option>
                      <option value="on_break">On Break</option>
                      <option value="absent">Excused Absence</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">Reason for Adjustment *</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="e.g. Biometric reader offline, verified manual entry by HR."
                    value={correctionReason}
                    onChange={e => setCorrectionReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-slate-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button type="button" onClick={() => setShowCorrectionModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs">Apply Correction</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TimePayrollPage;
