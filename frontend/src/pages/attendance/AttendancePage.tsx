import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { CalendarDays, RefreshCw, Search } from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { formatISTTime, formatDuration, getEffectiveWorkingSeconds } from '../../utils/timeUtils';
import { useAuth } from '../../context/AuthContext';
import { useDateFilter } from '../../context/DateFilterContext';

interface AttendancePageProps {
  selfOnly?: boolean;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ selfOnly = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isoDate, setIsoDate } = useDateFilter();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setNowTick] = useState(Date.now());

  // Local ISO Date string (YYYY-MM-DD)
  const nowObj = new Date();
  const todayStr = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}-${String(nowObj.getDate()).padStart(2, '0')}`;

  // Filters State - Default dateFilter dynamically to global isoDate or todayStr
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(isoDate || todayStr);
  const [quickFilter, setQuickFilter] = useState<'all' | 'worked' | 'leave' | 'overtime'>('all');

  // Real-time 5-second ticker for live work duration
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isoDate) {
      setDateFilter(isoDate);
    }
  }, [isoDate]);

  const isAuthorizedVerifier = ['ceo', 'operations_head', 'ops_head', 'hr', 'tl'].includes(user?.role || '');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const endpoint = selfOnly ? '/attendance/?self=true' : '/attendance/';
      const res = await apiClient.get<AttendanceRecord[]>(endpoint);
      let records = res.data || [];

      // If not selfOnly, populate checklist for employees who haven't checked in yet today
      if (!selfOnly) {
        try {
          const empRes = await apiClient.get<any[]>('/employees/');
          const empList = Array.isArray(empRes.data) ? empRes.data : (empRes.data as any)?.results || [];
          const targetDate = dateFilter || todayStr;

          empList.forEach((emp: any) => {
            const empUserId = emp.user_details?.id || emp.user || emp.id;
            const empUsername = emp.user_details?.username || emp.employee_id || `EMP-${emp.id}`;
            const empName = emp.user_details 
              ? `${emp.user_details.first_name || ''} ${emp.user_details.last_name || ''}`.trim() || empUsername 
              : empUsername;
            const empCode = emp.employee_id || empUsername;

            const exists = records.some(r => 
              (r.date === targetDate || !r.date) && (
                String(r.user) === String(empUserId) || 
                String(r.user) === String(emp.id) ||
                r.employee_id === empCode || 
                r.employee_name === empName
              )
            );

            if (!exists) {
              records.push({
                id: -(emp.id || Math.floor(Math.random() * 100000)),
                user: empUserId,
                employee_name: empName,
                employee_id: empCode,
                department: emp.department || 'Operations',
                designation: emp.designation || 'Staff',
                role: emp.user_details?.role || 'employee',
                date: targetDate,
                status: 'not_checked_in',
                verification_status: '',
                total_break_seconds: 0,
                total_working_seconds: 0,
                overtime_seconds: 0,
                shift: 'Day Shift'
              } as AttendanceRecord);
            }
          });
        } catch (e) {
          console.error("Error fetching employees list:", e);
        }
      }

      // Merge saved verifications from localStorage fallback
      records = records.map(r => {
        const candidateKeys = [
          `easytrack_verification_${r.date}_${r.user}`,
          `easytrack_verification_${r.date}_${r.employee_id}`,
          `easytrack_verification_${r.date}_${r.employee_name}`,
          `easytrack_verification_${r.date}_${r.user || r.employee_id}`,
          `easytrack_verification_${r.date}_${r.employee_id || r.user}`
        ].filter(Boolean);

        let savedData: any = null;
        for (const key of candidateKeys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const p = JSON.parse(raw);
              if (p && (p.verification_status || p.verified_by_id)) {
                savedData = p;
                break;
              }
            } catch {}
          }
        }

        // Only treat as verified if verified_by_id exists or status was explicitly set
        const isActuallyVerified = Boolean(
          r.verified_by_id || 
          savedData?.verified_by_id || 
          (r.verification_status && r.verification_status !== 'not_informed') ||
          (savedData?.verification_status && savedData?.verification_status !== 'not_informed')
        );

        const effectiveVerStatus = isActuallyVerified 
          ? (r.verification_status || savedData?.verification_status || '') 
          : '';
        const effectiveVerifierId = r.verified_by_id || savedData?.verified_by_id || '';
        const effectiveVerifierName = r.verified_by_name || savedData?.verified_by_name || '';
        const effectiveVerifiedAt = r.verified_at || savedData?.verified_at || '';

        // Keep localStorage candidate keys in sync so checkout or page reload never loses the selection
        if (effectiveVerStatus && isActuallyVerified) {
          const payload = JSON.stringify({
            verification_status: effectiveVerStatus,
            verified_by_id: effectiveVerifierId,
            verified_by_name: effectiveVerifierName,
            verified_at: effectiveVerifiedAt,
          });
          candidateKeys.forEach(k => {
            try { localStorage.setItem(k, payload); } catch {}
          });
        }

        return {
          ...r,
          verification_status: effectiveVerStatus,
          verified_by_id: effectiveVerifierId,
          verified_by_name: effectiveVerifierName,
          verified_at: effectiveVerifiedAt,
        };
      });

      // Check local storage today attendance fallback to ensure active status is never lost
      const localTodayRaw = localStorage.getItem('easytrack_attendance_today');
      if (localTodayRaw) {
        try {
          const localRec = JSON.parse(localTodayRaw);
          if (localRec && localRec.status) {
            const dateStr = localRec.date || todayStr;
            const existingIdx = records.findIndex(r => r.date === dateStr && (
              String(r.user) === String(user?.id) || 
              (r.employee_id && user?.username && r.employee_id.toLowerCase().includes(user.username.toLowerCase()))
            ));
            if (existingIdx >= 0) {
              records[existingIdx] = {
                ...records[existingIdx],
                status: localRec.status || records[existingIdx].status,
                check_in: localRec.check_in || records[existingIdx].check_in,
                check_out: localRec.check_out || records[existingIdx].check_out,
                total_working_seconds: localRec.total_working_seconds ?? records[existingIdx].total_working_seconds,
                total_break_seconds: localRec.total_break_seconds ?? records[existingIdx].total_break_seconds,
              };
            } else if (selfOnly || user?.role === 'employee') {
              records.unshift({
                id: Date.now(),
                user: user?.id || '1',
                employee_name: user?.first_name ? `${user.first_name} ${user.last_name}` : (user?.username || 'Employee'),
                employee_id: (user as any)?.employee_profile?.employee_id || user?.username || 'EMP',
                department: 'Operations',
                designation: 'Staff',
                role: user?.role || 'employee',
                date: dateStr,
                check_in: localRec.check_in || new Date().toISOString(),
                check_out: localRec.check_out || null,
                status: localRec.status,
                total_break_seconds: localRec.total_break_seconds || 0,
                total_working_seconds: localRec.total_working_seconds || 0,
                overtime_seconds: 0,
                shift: 'Day Shift'
              } as AttendanceRecord);
            }
          }
        } catch {}
      }

      setAttendance(records);
    } catch (err) {
      console.error(err);
      const localTodayRaw = localStorage.getItem('easytrack_attendance_today');
      if (localTodayRaw) {
        try {
          const localRec = JSON.parse(localTodayRaw);
          const mockRecord: AttendanceRecord = {
            id: Date.now(),
            user: user?.id || '1',
            employee_name: user?.first_name ? `${user.first_name} ${user.last_name}` : (user?.username || 'Employee'),
            employee_id: (user as any)?.employee_profile?.employee_id || user?.username || 'EMP',
            department: 'Operations',
            designation: 'Staff',
            role: user?.role || 'employee',
            date: localRec.date || todayStr,
            check_in: localRec.check_in || new Date().toISOString(),
            check_out: localRec.check_out || null,
            status: localRec.status || 'working',
            total_break_seconds: localRec.total_break_seconds || 0,
            total_working_seconds: localRec.total_working_seconds || 0,
            overtime_seconds: 0,
            shift: 'Day Shift'
          };
          setAttendance([mockRecord]);
        } catch {
          setAttendance([]);
        }
      } else {
        setAttendance([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();

    const handleUpdated = () => {
      fetchAttendance();
    };

    window.addEventListener('easytrack_attendance_updated', handleUpdated);
    return () => {
      window.removeEventListener('easytrack_attendance_updated', handleUpdated);
    };
  }, [selfOnly, dateFilter]);

  const handleVerificationChange = async (rec: AttendanceRecord, newStatus: string) => {
    let verifierId = (user as any)?.employee_profile?.employee_id;
    if (!verifierId || !verifierId.trim()) {
      verifierId = `@${(user?.username || 'HR').toUpperCase()}`;
    } else if (!verifierId.startsWith('@')) {
      verifierId = `@${verifierId}`;
    }

    const verifierName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'HR';
    const nowIso = new Date().toISOString();

    setAttendance(prev => prev.map(r => {
      const isMatch = (r.id > 0 && rec.id > 0 && r.id === rec.id) ||
        (r.date === rec.date && (
          (r.user && rec.user && String(r.user) === String(rec.user)) ||
          (r.employee_id && rec.employee_id && r.employee_id === rec.employee_id) ||
          (r.employee_name && rec.employee_name && r.employee_name === rec.employee_name)
        ));

      if (isMatch) {
        return {
          ...r,
          verification_status: newStatus,
          verified_by_id: verifierId,
          verified_by_name: verifierName,
          verified_at: nowIso,
        };
      }
      return r;
    }));

    const candidateKeys = [
      `easytrack_verification_${rec.date}_${rec.user}`,
      `easytrack_verification_${rec.date}_${rec.employee_id}`,
      `easytrack_verification_${rec.date}_${rec.employee_name}`,
      `easytrack_verification_${rec.date}_${rec.user || rec.employee_id}`,
      `easytrack_verification_${rec.date}_${rec.employee_id || rec.user}`
    ].filter(Boolean);

    const savedPayload = JSON.stringify({
      verification_status: newStatus,
      verified_by_id: verifierId,
      verified_by_name: verifierName,
      verified_at: nowIso,
    });

    candidateKeys.forEach(k => {
      try { localStorage.setItem(k, savedPayload); } catch {}
    });

    try {
      await apiClient.post('/attendance/verify-record/', {
        id: rec.id > 0 ? rec.id : undefined,
        user_id: rec.user,
        user_username: rec.employee_id || rec.user,
        date: rec.date || dateFilter || todayStr,
        verification_status: newStatus,
      });
    } catch (err) {
      console.error('API Verification update failed, using fallback:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/60">Working</span>;
      case 'on_break':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/60">On Break</span>;
      case 'checked_out':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60">Checked Out</span>;
      case 'leave':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border border-purple-200/60">On Leave</span>;
      case 'absent':
      case 'not_checked_in':
      case 'not_informed':
      case '-':
      case '':
        return <span className="text-slate-400 font-bold font-mono text-sm inline-block px-2 text-center">—</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{status}</span>;
    }
  };

  const getVerificationBadgeStyle = (status?: string) => {
    switch (status) {
      case 'present':
        return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 font-bold';
      case 'absent':
        return 'bg-[#FFD7CC] text-[#7C2D12] dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 font-bold';
      case 'not_informed':
        return 'bg-[#FFE69C] text-[#854D0E] dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-300 font-bold';
      case 'half_day':
        return 'bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 font-bold';
      default: // Unselected / Grey field
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700 font-semibold';
    }
  };

  const formatVerificationLabel = (status?: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'not_informed': return 'Not Informed';
      case 'half_day': return 'Half day';
      default: return 'Select Status';
    }
  };

  // Filter Logic
  const filteredAttendance = attendance.filter(rec => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const empName = (rec.employee_name || '').toLowerCase();
      const empId = (rec.employee_id || '').toLowerCase();
      const desg = (rec.designation || '').toLowerCase();
      const shift = (rec.shift || '').toLowerCase();
      const date = (rec.date || '').toLowerCase();

      const matches = empName.includes(q) || empId.includes(q) || desg.includes(q) || shift.includes(q) || date.includes(q);
      if (!matches) return false;
    }

    if (statusFilter !== 'all') {
      if (rec.status !== statusFilter) return false;
    }

    if (dateFilter) {
      if (rec.date !== dateFilter) return false;
    }

    if (quickFilter === 'worked') {
      const hasWorked = 
        Boolean(rec.check_in) || 
        (rec.total_working_seconds || 0) > 0 || 
        rec.status === 'working' || 
        rec.status === 'on_break' || 
        rec.status === 'checked_out' || 
        rec.verification_status === 'present' || 
        rec.verification_status === 'half_day';
      if (!hasWorked) return false;
    } else if (quickFilter === 'leave') {
      if (rec.status !== 'leave' && !(rec as any).leave_type) return false;
    } else if (quickFilter === 'overtime') {
      let workSec = rec.total_working_seconds || 0;
      let otSec = rec.overtime_seconds || 0;
      if (!rec.check_out && rec.check_in && rec.date === todayStr) {
        const checkInTime = new Date(rec.check_in).getTime();
        const nowTime = new Date().getTime();
        const elapsedSec = Math.max(0, Math.floor((nowTime - checkInTime) / 1000));
        workSec = Math.max(0, elapsedSec - (rec.total_break_seconds || 0));
        if (workSec > 28800) otSec = workSec - 28800;
      }
      const currentHour = new Date().getHours();
      const isPast5PM = currentHour >= 17 && rec.date === todayStr && (rec.status === 'working' || rec.status === 'on_break');
      if (!(otSec > 0 || workSec > 28800 || isPast5PM)) return false;
    }

    return true;
  });

  const dateScopedRecords = attendance.filter(rec => !dateFilter || rec.date === dateFilter);
  const totalRecords = filteredAttendance.length;
  const workingCount = filteredAttendance.filter(r => r.status === 'working').length;
  const breakCount = filteredAttendance.filter(r => r.status === 'on_break').length;
  const checkedOutCount = filteredAttendance.filter(r => 
    r.status === 'checked_out' && (Boolean(r.check_in) || (r.total_working_seconds || 0) > 0)
  ).length;

  // Cumulative members who worked on this date (excluding owner accounts)
  const nonOwnerRecords = dateScopedRecords.filter(r => !r.employee_id?.startsWith('OWNER') && r.role !== 'owner');
  const workedTodayCount = nonOwnerRecords.filter(r => 
    Boolean(r.check_in) || 
    (r.total_working_seconds || 0) > 0 || 
    r.status === 'working' || 
    r.status === 'on_break' || 
    r.status === 'checked_out' || 
    r.verification_status === 'present' || 
    r.verification_status === 'half_day'
  ).length;

  const totalLeave = nonOwnerRecords.filter(r => r.status === 'leave' || (r as any).leave_type).length;

  const totalOvertime = nonOwnerRecords.filter(r => {
    let workSec = r.total_working_seconds || 0;
    let otSec = r.overtime_seconds || 0;
    if (!r.check_out && r.check_in && r.date === todayStr) {
      const checkInTime = new Date(r.check_in).getTime();
      const nowTime = new Date().getTime();
      const elapsedSec = Math.max(0, Math.floor((nowTime - checkInTime) / 1000));
      workSec = Math.max(0, elapsedSec - (r.total_break_seconds || 0));
      if (workSec > 28800) otSec = workSec - 28800;
    }
    const currentHour = new Date().getHours();
    const isPast5PM = currentHour >= 17 && r.date === todayStr && (r.status === 'working' || r.status === 'on_break');
    return otSec > 0 || workSec > 28800 || isPast5PM;
  }).length;

  const myRecord = attendance.find(r => 
    (r.date === dateFilter || r.date === todayStr) && (
      String(r.user) === String(user?.id) || 
      (r.employee_id && user?.username && r.employee_id.toLowerCase().includes(user.username.toLowerCase())) ||
      (r.employee_name && user?.first_name && r.employee_name.toLowerCase().includes(user.first_name.toLowerCase()))
    )
  ) || attendance[0];

  const effectiveMyWorkSec = getEffectiveWorkingSeconds(myRecord);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 dark:border-slate-750 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center">
            <CalendarDays className="h-5 w-5 mr-2.5 text-brand-primary" />
            {selfOnly ? 'My Attendance & Punch Records' : 'Attendance & Shift Records'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {selfOnly 
              ? 'Your personal log of check-ins, check-outs, break durations, and total work hours in Indian Standard Time (IST).'
              : 'Complete log of employee check-ins, check-outs, verification status checklist, and overtime in IST.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => { fetchAttendance(); }}
            className="flex items-center px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      {selfOnly ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">My Shift Status Today</span>
            <p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200 mt-1 capitalize">
              {myRecord?.status === 'working' ? 'Working' : myRecord?.status === 'on_break' ? 'On Break' : myRecord?.status === 'checked_out' ? 'Checked Out' : 'Not Checked In'}
            </p>
            <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 mt-1 font-medium">
              Shift: {myRecord?.shift || 'Day Shift'}
            </p>
          </div>

          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/40 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">My Work Duration</span>
            <p className="text-xl font-extrabold text-blue-800 dark:text-blue-200 mt-1 font-mono">
              {formatDuration(effectiveMyWorkSec)}
            </p>
            <p className="text-[11px] text-blue-600/90 dark:text-blue-400/90 mt-1 font-medium">
              Check-in: {myRecord?.check_in ? formatISTTime(myRecord.check_in) : '—'}
            </p>
          </div>

          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900/40 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">My Break Time</span>
            <p className="text-xl font-extrabold text-amber-800 dark:text-amber-300 mt-1 font-mono">
              {formatDuration(myRecord?.total_break_seconds)}
            </p>
            <p className="text-[11px] text-amber-600/90 dark:text-amber-400/90 mt-1 font-medium">
              Total break duration logged
            </p>
          </div>

          <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-150 dark:border-purple-900/40 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">My Overtime</span>
            <p className="text-xl font-extrabold text-purple-800 dark:text-purple-200 mt-1 font-mono">
              {myRecord?.overtime_seconds ? formatDuration(myRecord.overtime_seconds) : '0 mins'}
            </p>
            <p className="text-[11px] text-purple-600/90 dark:text-purple-400/90 mt-1 font-medium">
              Overtime hours logged
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Worked Today */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Worked Today (Total Present)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                Cumulative
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
              {workedTodayCount} <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-sans">Members</span>
            </p>
            <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 mt-1 font-medium">
              {workingCount} active now • {checkedOutCount} checked out
            </p>
          </div>

          {/* Card 2: Active Right Now */}
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/40 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Active Right Now</span>
            <p className="text-2xl font-black text-blue-800 dark:text-blue-200 mt-1">
              {workingCount + breakCount} <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-sans">Online</span>
            </p>
            <p className="text-[11px] text-blue-600/90 dark:text-blue-400/90 mt-1 font-medium">
              {workingCount} working • {breakCount} on break
            </p>
          </div>

          {/* Card 3: On Leave */}
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900/40 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">On Leave</span>
            <p className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1">
              {totalLeave} <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-sans">Members</span>
            </p>
            <p className="text-[11px] text-amber-600/90 dark:text-amber-400/90 mt-1 font-medium">
              Approved leaves & scheduled time-off
            </p>
          </div>

          {/* Card 4: Overtime */}
          <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-150 dark:border-purple-900/40 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Overtime Members</span>
            <p className="text-2xl font-black text-purple-800 dark:text-purple-200 mt-1">
              {totalOvertime} <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 font-sans">Members</span>
            </p>
            <p className="text-[11px] text-purple-600/90 dark:text-purple-400/90 mt-1 font-medium">
              Over 8 hrs shift or active past 5:00 PM
            </p>
          </div>
        </div>
      )}

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-150 dark:border-slate-750 pb-2 overflow-x-auto">
        <button
          onClick={() => setQuickFilter('all')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shrink-0 ${
            quickFilter === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
          }`}
        >
          <span>All Records</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            quickFilter === 'all' ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {dateScopedRecords.length}
          </span>
        </button>

        <button
          onClick={() => setQuickFilter('worked')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shrink-0 ${
            quickFilter === 'worked'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
          }`}
        >
          <span>Worked Today</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            quickFilter === 'worked' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
          }`}>
            {workedTodayCount}
          </span>
        </button>

        <button
          onClick={() => setQuickFilter('leave')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shrink-0 ${
            quickFilter === 'leave'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
          }`}
        >
          <span>Leave</span>
          {totalLeave > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              quickFilter === 'leave' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300'
            }`}>
              {totalLeave}
            </span>
          )}
        </button>

        <button
          onClick={() => setQuickFilter('overtime')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shrink-0 ${
            quickFilter === 'overtime'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
          }`}
        >
          <span>Overtime</span>
          {totalOvertime > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              quickFilter === 'overtime' ? 'bg-purple-800 text-white' : 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300'
            }`}>
              {totalOvertime}
            </span>
          )}
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-slate-50/70 dark:bg-slate-900 p-4 rounded-xl border border-gray-150 dark:border-slate-750">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Name, ID, Shift..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-750 bg-white dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Shift Statuses</option>
            <option value="working">Working</option>
            <option value="on_break">On Break</option>
            <option value="checked_out">Checked Out</option>
            <option value="absent">Absent</option>
            <option value="leave">On Leave</option>
          </select>

          <div className="relative flex items-center">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setIsoDate(e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-750 bg-white dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
            />
          </div>

          {(search || statusFilter !== 'all' || dateFilter !== todayStr || quickFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setDateFilter(todayStr);
                setIsoDate(todayStr);
                setQuickFilter('all');
              }}
              className="text-xs text-rose-500 hover:underline font-bold px-2 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Attendance Records Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-150 dark:border-slate-750 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-750 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                {!selfOnly && <th className="py-3 px-4 whitespace-nowrap">Staff Member</th>}
                <th className="py-3 px-4 whitespace-nowrap">Shift Timing</th>
                <th className="py-3 px-4 whitespace-nowrap">Check-In</th>
                <th className="py-3 px-4 whitespace-nowrap">Check-Out</th>
                <th className="py-3 px-4 whitespace-nowrap">Break</th>
                <th className="py-3 px-4 whitespace-nowrap">Work Duration</th>
                <th className="py-3 px-4 whitespace-nowrap">Overtime</th>
                <th className="py-3 px-4 whitespace-nowrap">Shift Status</th>
                <th className="py-3 px-4 whitespace-nowrap min-w-[180px]">Verification / Checklist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-750 font-medium text-slate-700 dark:text-slate-200">
              {filteredAttendance.map((record) => {
                const isPastDate = record.date < todayStr;
                const effectiveStatus = (!record.check_in && (record.status === 'absent' || record.status === 'not_checked_in'))
                  ? 'not_checked_in'
                  : ((isPastDate && (record.status === 'working' || record.status === 'on_break')) ? 'checked_out' : record.status);
                
                let workSec = getEffectiveWorkingSeconds(record);
                let otSec = record.overtime_seconds || 0;
                if (workSec > 28800) {
                  otSec = workSec - 28800;
                }

                const currentVerStatus = record.verification_status || '';

                return (
                  <tr 
                    key={record.id || `${record.user}-${record.date}`}
                    onClick={() => {
                      if (!selfOnly && isAuthorizedVerifier) {
                        const empIdentifier = String(record.user || record.employee_id || record.employee_name || '');
                        navigate(`/employees?emp=${encodeURIComponent(empIdentifier)}&tab=2`);
                      }
                    }}
                    className={`transition ${!selfOnly && isAuthorizedVerifier ? 'cursor-pointer hover:bg-slate-100/90 dark:hover:bg-slate-750/60' : 'hover:bg-slate-50/80 dark:hover:bg-slate-750/30'}`}
                    title={!selfOnly && isAuthorizedVerifier ? `Click row to view employee details for ${record.employee_name || 'Staff'}` : undefined}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">{record.date}</td>
                    
                    {!selfOnly && (
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {record.employee_name || 'System User'}
                        </p>
                        {record.employee_id && (
                          <span className="text-[10px] text-brand-primary font-mono font-bold">@{record.employee_id}</span>
                        )}
                      </td>
                    )}

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      {record.shift || 'Day Shift'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                      {record.check_in ? formatISTTime(record.check_in) : '—'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                      {record.check_out ? formatISTTime(record.check_out) : (
                        isPastDate ? <span className="text-slate-500 italic">Shift Completed</span> :
                        record.status === 'working' ? <span className="text-emerald-500 italic">Active Working</span> :
                        record.status === 'on_break' ? <span className="text-amber-500 italic">On Break</span> : '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-amber-600 dark:text-amber-400 font-semibold whitespace-nowrap">
                      {formatDuration(record.total_break_seconds)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatDuration(workSec)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                      {otSec > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-300 font-bold">
                          +{formatDuration(otSec)} OT
                        </span>
                      ) : (
                        <span className="text-slate-400">0 mins</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(effectiveStatus)}
                    </td>

                    {/* Verification Dropdown & Stamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {isAuthorizedVerifier ? (
                        <div className="flex flex-col items-start gap-1">
                          <select
                            value={currentVerStatus}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleVerificationChange(record, e.target.value);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary ${getVerificationBadgeStyle(
                              currentVerStatus
                            )}`}
                          >
                            <option value="" disabled hidden className="bg-slate-100 text-slate-600 font-semibold">Select Status</option>
                            <option value="present" className="bg-gray-100 text-gray-900 font-bold">Present</option>
                            <option value="absent" className="bg-orange-100 text-orange-900 font-bold">Absent</option>
                            <option value="not_informed" className="bg-yellow-100 text-yellow-900 font-bold">Not Informed</option>
                            <option value="half_day" className="bg-emerald-100 text-emerald-900 font-bold">Half day</option>
                          </select>

                          {record.verified_by_id && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                              <span className="font-semibold text-slate-600 dark:text-slate-400">Verified:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{record.verified_by_id}</span>
                              <span>•</span>
                              <span>{record.verified_at ? formatISTTime(record.verified_at) : ''}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getVerificationBadgeStyle(
                            currentVerStatus
                          )}`}>
                            {formatVerificationLabel(currentVerStatus)}
                          </span>
                          {record.verified_by_id && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              <span className="font-semibold text-slate-600 dark:text-slate-400">Verified:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{record.verified_by_id}</span>
                              <span>•</span>
                              <span>{record.verified_at ? formatISTTime(record.verified_at) : ''}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={selfOnly ? 9 : 10} className="text-center py-12 text-slate-400 font-medium">
                    No matching attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
