import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  DollarSign, CheckCircle2, XCircle, Clock, Send, 
  RefreshCw, ShieldCheck, AlertCircle, UserCheck, 
  FileText, TrendingUp, Layers, Check, Edit3, Save, X, Lock, Unlock, ArrowUpRight
} from 'lucide-react';

interface SalarySlip {
  id: number;
  employee: number | null;
  employee_id_str?: string;
  employee_name?: string;
  employee_designation?: string;
  employee_department?: string;
  name: string;
  period: string;
  base_salary: number | string;
  overtime_pay: number | string;
  bonus: number | string;
  deductions: number | string;
  net_salary: number | string;
  status: string;
  remarks?: string;
}

export const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  const isCEO = user?.role === 'ceo' || user?.role === 'admin';
  const isHR = user?.role === 'hr' || isCEO;

  const [period, setPeriod] = useState<string>('2026-09');
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // CEO Remarks modal / input
  const [ceoRemarks, setCeoRemarks] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);

  // Edit modal state (String states to prevent '067' leading zero issues)
  const [editingSlip, setEditingSlip] = useState<SalarySlip | null>(null);
  const [editBaseSalaryStr, setEditBaseSalaryStr] = useState<string>('');
  const [editBonusStr, setEditBonusStr] = useState<string>('');
  const [editDeductionsStr, setEditDeductionsStr] = useState<string>('');
  const [editOtStr, setEditOtStr] = useState<string>('');
  const [editRemarks, setEditRemarks] = useState<string>('');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<SalarySlip[]>(`/payroll/?period=${encodeURIComponent(period)}`);
      setSlips(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch payroll slips:', err);
      setSlips([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // Clean leading zeroes from string input (e.g. typing 67 yields '67', not '067')
  const handleNumberInput = (val: string, setter: (v: string) => void) => {
    const cleaned = val.replace(/^0+(?=\d)/, '');
    setter(cleaned);
  };

  // Open Edit Modal for a Slip
  const openEditModal = (slip: SalarySlip) => {
    setEditingSlip(slip);
    const b = Number(slip.base_salary || 0);
    const bon = Number(slip.bonus || 0);
    const d = Number(slip.deductions || 0);
    const ot = Number(slip.overtime_pay || 0);

    setEditBaseSalaryStr(b === 0 ? '' : String(b));
    setEditBonusStr(bon === 0 ? '' : String(bon));
    setEditDeductionsStr(d === 0 ? '' : String(d));
    setEditOtStr(ot === 0 ? '' : String(ot));
    setEditRemarks(slip.remarks || '');
  };

  // Generate / Load Employee Payroll Slips
  const handleGeneratePayroll = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post<SalarySlip[]>('/payroll/generate_payroll/', { period });
      setSlips(res.data || []);
      showNotification(isCEO ? `Loaded active employee payroll batch for ${period}.` : `Payroll batch for ${period} generated successfully.`);
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to generate payroll batch.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // HR Lock Payment
  const handleLockPayment = async () => {
    if (slips.length === 0) {
      showNotification('No payroll slips available to lock. Please generate payroll first.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.post('/payroll/lock_payment/', { period });
      showNotification(`Payroll payment locked by HR for ${period} and sent to CEO for approval.`);
      fetchPayroll();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to lock payment.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // CEO Approve Batch
  const handleApprovePayroll = async () => {
    setActionLoading(true);
    try {
      await apiClient.post('/payroll/approve/', { period, remarks: ceoRemarks || 'Approved by CEO' });
      showNotification(`Payroll batch for ${period} approved by CEO successfully!`);
      setCeoRemarks('');
      fetchPayroll();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to approve payroll.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // CEO Reject Batch
  const handleRejectPayroll = async () => {
    if (!ceoRemarks.trim()) {
      showNotification('Please provide a reason for rejecting the payroll batch.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.post('/payroll/reject/', { period, remarks: ceoRemarks });
      showNotification(`Payroll batch for ${period} returned to HR for edits.`, 'error');
      setShowRejectModal(false);
      setCeoRemarks('');
      fetchPayroll();
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to reject payroll.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Edit Payroll Record (HR or CEO)
  const handleSaveSlipEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlip) return;

    const baseVal = editBaseSalaryStr === '' ? 0 : parseFloat(editBaseSalaryStr) || 0;
    const bonusVal = editBonusStr === '' ? 0 : parseFloat(editBonusStr) || 0;
    const dedVal = editDeductionsStr === '' ? 0 : parseFloat(editDeductionsStr) || 0;
    const otVal = editOtStr === '' ? 0 : parseFloat(editOtStr) || 0;

    const payload: any = {
      bonus: bonusVal,
      deductions: dedVal,
      overtime_pay: otVal,
      remarks: editRemarks
    };

    // Only CEO / Admin is permitted to update base_salary
    if (isCEO) {
      payload.base_salary = baseVal;
    }

    setActionLoading(true);
    try {
      await apiClient.patch(`/payroll/${editingSlip.id}/`, payload);
      showNotification(isCEO ? 'Payroll record and employee base salary updated by CEO.' : 'Employee payroll adjustments updated by HR.');
      setEditingSlip(null);
      fetchPayroll();
    } catch (err: any) {
      showNotification('Failed to update payroll record.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics Calculations
  const totalBaseSalary = slips.reduce((sum, s) => sum + Number(s.base_salary || 0), 0);
  const totalOvertime = slips.reduce((sum, s) => sum + Number(s.overtime_pay || 0), 0);
  const totalBonuses = slips.reduce((sum, s) => sum + Number(s.bonus || 0), 0);
  const totalDeductions = slips.reduce((sum, s) => sum + Number(s.deductions || 0), 0);
  const totalNetPayout = slips.reduce((sum, s) => sum + Number(s.net_salary || 0), 0);

  // Overall Batch Status determination
  const isApprovedByCEO = slips.length > 0 && slips.every(s => s.status === 'Approved by CEO');
  const isLockedByHR = slips.length > 0 && slips.some(s => s.status === 'Locked by HR');
  const isRejectedByCEO = slips.length > 0 && slips.some(s => s.status === 'Rejected by CEO');

  const batchStatusDisplay = slips.length === 0 
    ? 'Not Generated' 
    : isApprovedByCEO
      ? 'Approved by CEO'
      : isLockedByHR
        ? 'Locked by HR'
        : isRejectedByCEO
          ? 'Returned for Edits'
          : 'Draft Payout';

  // Live calculation helper inside edit modal
  const calcModalBase = isCEO ? (editBaseSalaryStr === '' ? 0 : parseFloat(editBaseSalaryStr) || 0) : Number(editingSlip?.base_salary || 0);
  const calcModalOt = editOtStr === '' ? 0 : parseFloat(editOtStr) || 0;
  const calcModalBon = editBonusStr === '' ? 0 : parseFloat(editBonusStr) || 0;
  const calcModalDed = editDeductionsStr === '' ? 0 : parseFloat(editDeductionsStr) || 0;
  const calcModalNet = Math.max(0, calcModalBase + calcModalOt + calcModalBon - calcModalDed);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {notice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm font-semibold transition animate-in fade-in ${
          notice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' 
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center space-x-2">
            {notice.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-rose-600" />}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>{isCEO ? 'CEO Executive Payroll Portal' : 'HR Payroll Management'}</span>
                {isCEO ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                    CEO / Admin View
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60">
                    HR Portal
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCEO 
                  ? 'Set employee base pay, update payroll details received from HR, and approve monthly disbursement.'
                  : 'Generate payroll batch, adjust bonuses/deductions, and lock payment for CEO approval.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Cycle:</span>
            <input 
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none"
            />
          </div>

          <button
            onClick={fetchPayroll}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-750 rounded-xl transition"
            title="Refresh Payroll Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* HR GENERATE BATCH BUTTON (HR Only) */}
          {isHR && !isCEO && (
            <button
              onClick={handleGeneratePayroll}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Generate Batch
            </button>
          )}

          {/* HR LOCK PAYMENT BUTTON (HR Only) */}
          {isHR && !isCEO && slips.length > 0 && !isApprovedByCEO && (
            <button
              onClick={handleLockPayment}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center shadow-sm ${
                isLockedByHR
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              {isLockedByHR ? 'Payment Locked (Re-Submit)' : 'Lock Payment'}
            </button>
          )}
        </div>
      </div>

      {/* CEO Executive Action Banner */}
      {isCEO && slips.length > 0 && (
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isApprovedByCEO
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : isLockedByHR
              ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700/60'
              : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-amber-600" />
              CEO Executive Payroll Controls
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {isLockedByHR 
                ? `HR has locked payment for ${period} and sent it for CEO review. You can edit employee base salary or update any details below.`
                : isApprovedByCEO
                  ? `Payroll batch for ${period} is APPROVED by CEO.`
                  : `Review payroll batch for ${period}. Set base salaries or update details before approving.`
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {slips.length > 0 && (
              <button
                onClick={() => {
                  if (slips[0]) openEditModal(slips[0]);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center shadow-xs"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                Update Payroll
              </button>
            )}

            {!isApprovedByCEO && (
              <>
                <button
                  onClick={handleApprovePayroll}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Approve Payroll Batch
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 transition flex items-center justify-center"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject Batch
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Net Payroll Cost</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ₹{totalNetPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>Base Salary Total:</span>
            <span className="font-mono font-bold">₹{totalBaseSalary.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Employees in Batch</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {slips.length} <span className="text-sm font-medium text-slate-400">Staff Members</span>
          </p>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>Cycle Period:</span>
            <span className="font-mono font-bold">{period}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Additions (OT + Bonuses)</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            +₹{(totalOvertime + totalBonuses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>Total Deductions:</span>
            <span className="font-mono font-bold text-rose-500">-₹{totalDeductions.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Batch Approval Status</span>
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              isApprovedByCEO
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                : isLockedByHR
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                  : isRejectedByCEO
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              {batchStatusDisplay}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {isLockedByHR && 'Payment locked by HR — Sent to CEO'}
            {isApprovedByCEO && 'Approved by CEO'}
            {isRejectedByCEO && 'Returned for HR Edits'}
            {slips.length > 0 && !isLockedByHR && !isApprovedByCEO && !isRejectedByCEO && 'Draft Payout — Awaiting HR Lock'}
            {slips.length === 0 && 'No payroll generated yet'}
          </div>
        </div>
      </div>

      {/* Main Payroll Ledger Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-150 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
              <Layers className="h-4.5 w-4.5 mr-2 text-teal-600" />
              Employee Payroll Set ({period})
            </h3>
            <p className="text-xs text-slate-400">
              {isCEO 
                ? 'Set base salaries and update payroll details received from HR.'
                : 'Base salary is assigned by CEO. HR locks payment for executive review.'
              }
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isCEO && !isApprovedByCEO && slips.length > 0 && (
              <button
                onClick={handleApprovePayroll}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center shadow-sm"
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Approve All Slips
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
          </div>
        ) : slips.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-700 w-12 h-12 rounded-full mx-auto flex items-center justify-center text-slate-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              {isCEO ? `No active payroll slips generated by HR for ${period}` : `No payroll records generated for ${period}`}
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {isCEO 
                ? 'Awaiting HR to lock payment for this period, or click below to load active employee slips to configure base salaries.'
                : 'Click "Generate Batch" above to auto-create salary records using employee base salaries.'
              }
            </p>
            <button
              onClick={handleGeneratePayroll}
              disabled={actionLoading}
              className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              {isCEO ? "Load Active Employee Batch" : "Generate Payroll Now"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-700 font-bold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-850">
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Employee Name</th>
                  <th className="py-3.5 px-4">Designation / Department</th>
                  <th className="py-3.5 px-4">Base Salary</th>
                  <th className="py-3.5 px-4">Overtime Pay</th>
                  <th className="py-3.5 px-4">Bonus / Allowances</th>
                  <th className="py-3.5 px-4">Deductions (LOP)</th>
                  <th className="py-3.5 px-4">Net Salary</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                {slips.map((slip) => {
                  const base = Number(slip.base_salary || 0);
                  const ot = Number(slip.overtime_pay || 0);
                  const bon = Number(slip.bonus || 0);
                  const ded = Number(slip.deductions || 0);
                  const net = Number(slip.net_salary || 0);

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition">
                      <td className="py-4 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {slip.employee_id_str || `EMP-${slip.employee || slip.id}`}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        {slip.employee_name || slip.name}
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        <div>{slip.employee_designation || 'Staff'}</div>
                        <div className="text-[10px] text-slate-400">{slip.employee_department || 'General'}</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        ₹{base.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {base === 0 && (
                          <span className="ml-1.5 text-[10px] text-amber-600 font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200">
                            Set Base Pay
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        +₹{ot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +₹{bon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                        -₹{ded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-mono font-black text-slate-900 dark:text-white text-sm">
                        ₹{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          slip.status === 'Approved by CEO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : slip.status === 'Locked by HR'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                              : slip.status === 'Rejected by CEO'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {slip.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => openEditModal(slip)}
                          className="px-2.5 py-1 text-xs font-bold text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-lg transition inline-flex items-center space-x-1"
                          title={isCEO ? "Update Payroll & Base Salary" : "Edit Adjustments"}
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1" />
                          <span>{isCEO ? "Update Payroll" : "Adjust"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal for CEO */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center">
                <XCircle className="h-5 w-5 mr-2 text-rose-600" />
                Reject Payroll Batch
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                Reason for Rejection / Instructions for HR *
              </label>
              <textarea
                rows={3}
                required
                value={ceoRemarks}
                onChange={(e) => setCeoRemarks(e.target.value)}
                placeholder="e.g. Please check overtime allocations for Operations team..."
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPayroll}
                disabled={actionLoading}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Payroll / HR Adjustments Modal */}
      {editingSlip && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center">
                <Edit3 className="h-5 w-5 mr-2 text-teal-600" />
                {isCEO ? "Update Payroll & Base Salary" : "HR Payroll Adjustments"} for {editingSlip.employee_name}
              </h3>
              <button onClick={() => setEditingSlip(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlipEdit} className="space-y-4">
              {/* Base Salary Input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Base Salary (₹) {isCEO ? <span className="text-teal-600 font-bold">(CEO Editable)</span> : <span className="text-slate-400 font-normal">(CEO Access Only)</span>}
                </label>
                {isCEO ? (
                  <input 
                    type="text"
                    placeholder="0"
                    value={editBaseSalaryStr} 
                    onChange={(e) => handleNumberInput(e.target.value, setEditBaseSalaryStr)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <input 
                    type="text" 
                    disabled 
                    value={`₹${Number(editingSlip.base_salary).toLocaleString()}`} 
                    className="w-full px-3 py-2 border rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-mono font-bold text-slate-500"
                  />
                )}
                {!isCEO && (
                  <p className="text-[10px] text-slate-400 mt-1">Base salary can only be configured or changed by CEO / Admin.</p>
                )}
              </div>

              {/* Bonus and Deductions Inputs (Fixed '067' issue with string state) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Bonus / Allowance (₹)</label>
                  <input 
                    type="text" 
                    placeholder="0"
                    value={editBonusStr}
                    onChange={(e) => handleNumberInput(e.target.value, setEditBonusStr)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Deductions / LOP (₹)</label>
                  <input 
                    type="text" 
                    placeholder="0"
                    value={editDeductionsStr}
                    onChange={(e) => handleNumberInput(e.target.value, setEditDeductionsStr)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-rose-600 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Overtime Pay (₹)</label>
                <input 
                  type="text" 
                  placeholder="0"
                  value={editOtStr}
                  onChange={(e) => handleNumberInput(e.target.value, setEditOtStr)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Remarks / Note</label>
                <input 
                  type="text" 
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="e.g. CEO base salary adjustment / Monthly bonus"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-medium"
                />
              </div>

              {/* Calculated Net Salary Live Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between items-center text-xs font-bold border border-slate-150 dark:border-slate-800">
                <span>Calculated Net Salary:</span>
                <span className="font-mono text-teal-600 text-sm">
                  ₹{calcModalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSlip(null)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {isCEO ? "Update Payroll" : "Save Adjustments"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
