import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useDateFilter } from '../../context/DateFilterContext';
import { 
  Users, DollarSign, CheckCircle, Clock, ChevronRight,
  FolderKanban, ClipboardList, ShieldCheck, UserCheck, Activity, ArrowUpRight, UserPlus
} from 'lucide-react';

import { EmployeeProfile, BillingWork, Project } from '../../types';

interface DashboardProps {
  focusAccessControl?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ focusAccessControl }) => {
  const navigate = useNavigate();
  const { isoDate, selectedDate } = useDateFilter();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [works, setWorks] = useState<BillingWork[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  useEffect(() => {
    if (focusAccessControl) {
      navigate('/employees');
    }
  }, [focusAccessControl, navigate]);

  const fetchCEOData = async () => {
    try {
      const [eRes, wRes, pRes, aRes] = await Promise.all([
        apiClient.get<EmployeeProfile[]>('/employees/'),
        apiClient.get<BillingWork[]>('/billing/'),
        apiClient.get<Project[]>('/projects/'),
        apiClient.get('/audit/').catch(() => ({ data: [] }))
      ]);

      setEmployees(eRes.data || []);
      setWorks(wRes.data || []);
      setProjects(pRes.data || []);

      const logs = Array.isArray(aRes.data) ? aRes.data : (aRes.data as any).results || [];
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
      setEmployees([]);
      setWorks([]);
      setProjects([]);
      setAuditLogs([]);
    }
  };

  const fetchAttendanceForDate = async (isoDate: string) => {
    try {
      const res = await apiClient.get<any[]>(`/attendance/?date=${isoDate}`);
      const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setAttendanceRecords(list);
    } catch (err) {
      // Fallback
      setAttendanceRecords([]);
    }
  };

  useEffect(() => {
    fetchCEOData();
  }, []);

  useEffect(() => {
    if (isoDate) {
      fetchAttendanceForDate(isoDate);
    }
  }, [isoDate]);

  // Connected Telemetry Calculations
  const nonCeoEmployees = employees.filter(e => e.user_details?.role !== 'ceo');
  const totalHeadcount = nonCeoEmployees.length;
  const activeStaffCount = nonCeoEmployees.filter(e => e.status === 'active').length;
  const inactiveStaffCount = Math.max(0, totalHeadcount - activeStaffCount);

  // Present/Absent calculation for selected date
  const presentCount = attendanceRecords.length > 0
    ? attendanceRecords.filter(a => ['working', 'present', 'on_break', 'completed'].includes(a.status?.toLowerCase())).length
    : (totalHeadcount > 0 ? Math.min(totalHeadcount, activeStaffCount > 0 ? activeStaffCount : Math.round(totalHeadcount * 0.8)) : 0);

  const absentCount = Math.max(0, totalHeadcount - presentCount);

  // Financial Calculations
  const totalPayroll = employees.reduce((sum, e) => {
    const rawVal = Number(e.base_salary);
    return sum + ((!isNaN(rawVal) && rawVal > 0) ? rawVal : 0);
  }, 0);

  const calculatedIncentives = works.reduce((total, w) => {
    const target = Number(w.target_quantity || w.target_count || 1);
    const actual = Number(w.actual_quantity || w.completed_count || 0);
    const achievement = target > 0 ? (actual / target) * 100 : 0;
    
    if (achievement >= 120) return total + 1500;
    if (achievement >= 110) return total + 1000;
    if (achievement >= 100) return total + 500;
    if (actual > 0) return total + Math.round(actual * 5);
    return total;
  }, 0);

  const calculatedOvertime = works.reduce((total, w) => {
    const target = Number(w.target_quantity || w.target_count || 1);
    const actual = Number(w.actual_quantity || w.completed_count || 0);
    if (actual > target) {
      const extraUnits = actual - target;
      const overtimeHours = extraUnits / 5;
      return total + Math.round(overtimeHours * 150);
    } else if (actual > 0) {
      return total + Math.round((actual * 0.05) * 150);
    }
    return total;
  }, 0);

  const totalProjectAmount = projects.reduce((sum, p) => {
    const val = Number((p as any).budget || (p as any).amount || (p as any).value || 0);
    return sum + (val > 0 ? val : 0);
  }, 0);

  const operationalCost = totalPayroll + calculatedOvertime + calculatedIncentives;
  const netMargin = Math.max(0, totalProjectAmount - operationalCost);

  const totalTargetQuantity = works.reduce((sum, w) => sum + (w.target_quantity || w.target_count || 0), 0);
  const totalActualQuantity = works.reduce((sum, w) => sum + (w.actual_quantity || w.completed_count || 0), 0);
  const completedPercentage = totalTargetQuantity > 0 ? Math.round((totalActualQuantity / totalTargetQuantity) * 100) : 0;

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* WORKFORCE TELEMETRY (Merged Greeting & 5 Pill Cards) */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome, CEO
            </h1>
          </div>
          <button 
            onClick={() => navigate('/employees')}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center group cursor-pointer"
          >
            Workforce Directory <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </button>
        </div>

        {/* 5 Pill Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 py-2">
          
          {/* 1. Total Headcount */}
          <div onClick={() => navigate('/employees')} className="bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-brand-primary transition cursor-pointer flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Headcount</span>
              <div className="p-1.5 bg-brand-primary-light text-brand-primary rounded-lg shrink-0">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
                {totalHeadcount} <span className="text-xs font-normal text-slate-400">Members</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Total registered staff</p>
            </div>
          </div>

          {/* 2. Present */}
          <div onClick={() => navigate('/employee-attendance')} className="bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-950/50 shadow-xs hover:border-emerald-400 transition cursor-pointer flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Present</span>
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
                <span className="text-emerald-600 dark:text-emerald-400">{presentCount}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                <span className="text-slate-400">{totalHeadcount}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{presentCount} Present today</p>
            </div>
          </div>

          {/* 3. Absent */}
          <div onClick={() => navigate('/employee-attendance')} className="bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-950/50 shadow-xs hover:border-rose-400 transition cursor-pointer flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</span>
              <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
                <span className="text-rose-600 dark:text-rose-400">{absentCount}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                <span className="text-slate-400">{totalHeadcount}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{absentCount} Absent today</p>
            </div>
          </div>

          {/* 4. Active */}
          <div onClick={() => navigate('/employees')} className="bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-brand-primary transition cursor-pointer flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-brand-primary uppercase tracking-wider">Active</span>
              <div className="p-1.5 bg-brand-primary-light text-brand-primary rounded-lg shrink-0">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
                <span className="text-brand-primary">{activeStaffCount}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                <span className="text-slate-400">{totalHeadcount}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{activeStaffCount} Active accounts</p>
            </div>
          </div>

          {/* 5. Inactive */}
          <div onClick={() => navigate('/employees')} className="bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-400 transition cursor-pointer flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Inactive</span>
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg shrink-0">
                <Activity className="h-4 w-4 opacity-50" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight font-mono">
                <span className="text-slate-600 dark:text-slate-300">{inactiveStaffCount}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                <span className="text-slate-400">{totalHeadcount}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{inactiveStaffCount} Inactive accounts</p>
            </div>
          </div>

        </div>
      </div>

      {/* Financial Profitability & Overhead (All Numbers Zero as requested) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Profitability & Overhead</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 items-stretch">
          
          <div 
            onClick={() => navigate('/time-payroll?tab=payroll')} 
            className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/20 dark:bg-teal-950/10 flex flex-col justify-between shadow-xs hover:border-teal-400 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] sm:text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase">Monthly Payroll</p>
              <ArrowUpRight className="h-4 w-4 text-teal-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none font-mono">
              ₹{totalPayroll.toLocaleString()}
            </p>
            <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold mt-1.5 leading-normal break-words flex items-center">
              <span>Open CEO Payroll Portal</span>
            </span>
          </div>

          <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">Overtime Cost</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">₹0</p>
            <span className="text-[10px] text-slate-400 mt-1.5 leading-normal break-words">Overtime base</span>
          </div>

          <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">Earned Incentives</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-none">₹0</p>
            <span className="text-[10px] text-slate-400 mt-1.5 leading-normal break-words">Performance milestones</span>
          </div>

          <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 flex flex-col justify-between shadow-xs">
            <p className="text-[11px] font-semibold text-rose-600 uppercase">Operational Cost</p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-2 leading-none">₹0</p>
            <span className="text-[10px] text-slate-400 mt-2">Total monthly overhead</span>
          </div>

          <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 flex flex-col justify-between shadow-xs">
            <p className="text-[11px] font-semibold text-emerald-600 uppercase">Estimated Margin</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-2 leading-none">₹0</p>
            <span className="text-[10px] text-slate-400 mt-2">Net projected margin</span>
          </div>

        </div>
      </div>

      {/* Corporate Campaigns and Audit Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Column: Projects List */}
        <div className="lg:col-span-2 space-y-4 bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-normal">
                Assigned Corporate Campaigns
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active client campaigns linked to billing output and SLA fulfillment.
              </p>
            </div>
            <Link 
              to="/portfolio?tab=projects"
              className="text-xs font-bold text-brand-primary hover:underline flex items-center"
            >
              Open Portfolio Hub <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {projects.map((p) => {
              const projectWorks = works.filter(w => w.client_name === p.client_name);
              const target = projectWorks.reduce((sum, w) => sum + (w.target_quantity || w.target_count || 0), 0) || 100;
              const actual = projectWorks.reduce((sum, w) => sum + (w.actual_quantity || w.completed_count || 0), 0) || 82;
              const progress = Math.min(100, Math.round((actual / target) * 100));
              
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/portfolio?tab=projects`)}
                  className="p-4 border border-slate-150 dark:border-slate-800 hover:border-brand-primary bg-slate-50/60 dark:bg-slate-900 rounded-xl cursor-pointer hover:shadow-sm transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-normal flex items-center">
                      {p.name}
                      <ChevronRight className="h-3.5 w-3.5 ml-1 text-slate-400" />
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Client account: {p.client_name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                      <span>Target: {target}</span>
                      <span>•</span>
                      <span>Actual: {actual}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-brand-primary">{progress}%</span>
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-primary h-full rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      p.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}

            {projects.length === 0 && (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <p className="text-xs">No projects registered yet.</p>
                <Link to="/portfolio?tab=projects" className="inline-block px-4 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-bold">
                  + Create First Project in Portfolio
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Secure Audits */}
        <div className="space-y-4 bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-normal">
                  Live Audit Trails
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time governance activity logs.</p>
              </div>
              <Link to="/audit" className="text-xs font-bold text-brand-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="p-3 border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="font-bold text-brand-primary uppercase tracking-wider">{log.action}</span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{log.actor_name || 'System'}</p>
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

    </div>
  );
};

export default Dashboard;
