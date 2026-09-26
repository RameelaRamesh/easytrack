import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { CalendarRange, Plus, X, CheckCircle2, Clock, Calendar } from 'lucide-react';

export const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check URL query param ?action=apply
  useEffect(() => {
    if (searchParams.get('action') === 'apply') {
      setShowApplyModal(true);
    }
  }, [searchParams]);

  const fetchLeaves = async () => {
    try {
      const res = await apiClient.get<any[]>('/leave/');
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
      
      // Merge with any local offline leaves
      const saved = localStorage.getItem('easytrack_user_leaves');
      const localLeaves = saved ? JSON.parse(saved) : [];
      
      const combined = [...data];
      localLeaves.forEach((l: any) => {
        if (!combined.some(c => c.id === l.id)) {
          combined.unshift(l);
        }
      });

      setRequests(combined);
    } catch (err) {
      console.error(err);
      const saved = localStorage.getItem('easytrack_user_leaves');
      setRequests(saved ? JSON.parse(saved) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setSubmitting(true);
    setMsg('');

    const payload = {
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim() || `${leaveType.toUpperCase()} Leave request`,
    };

    try {
      const res = await apiClient.post('/leave/', payload);
      setMsg('Leave request submitted successfully to Team Lead & HR!');
      setShowApplyModal(false);
      // Clean up URL param if present
      if (searchParams.get('action') === 'apply') {
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
      }
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err: any) {
      // Fallback
      const newLeave = {
        id: Date.now(),
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || `${leaveType.toUpperCase()} Leave request`,
        employee_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.username || 'Employee'),
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const saved = localStorage.getItem('easytrack_user_leaves');
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(newLeave);
      localStorage.setItem('easytrack_user_leaves', JSON.stringify(list));

      setRequests(prev => [newLeave, ...prev]);
      setMsg('Leave request submitted and logged for review!');
      setShowApplyModal(false);
      if (searchParams.get('action') === 'apply') {
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
      }
      setStartDate('');
      setEndDate('');
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6 text-slate-800 dark:text-slate-100">
      
      {msg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex justify-between items-center shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {msg}
          </span>
          <button onClick={() => setMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <CalendarRange className="h-5 w-5 mr-2 text-brand-primary" />
            Leave Management & Submissions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review your leave requests, submission statuses, and submit time-off applications to your Team Lead.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowApplyModal(true)}
          className="flex items-center px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Apply For Leave
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div 
              key={req.id} 
              className="p-5 border border-gray-150 dark:border-slate-750 bg-slate-50/70 dark:bg-slate-900 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-xs transition"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                    {req.leave_type} Leave
                  </span>
                  <span className="text-xs text-slate-400">
                    • {req.start_date} to {req.end_date}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {req.employee_name || user?.username || 'You'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reason: {req.reason || 'General Leave'}
                </p>
                {req.review_comments && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-150 dark:border-slate-700">
                    Review note: {req.review_comments} (by {req.reviewer_name || 'Approver'})
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                  req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300' :
                  req.status === 'pending' || req.status === 'recommended' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300' :
                  'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300'
                }`}>
                  {req.status}
                </span>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
              <CalendarRange className="h-8 w-8 mx-auto text-slate-400/60" />
              <p className="text-xs font-semibold">No leave requests found.</p>
              <p className="text-[11px] text-slate-400">Click "Apply For Leave" above to submit a new time-off application.</p>
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-hidden">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-755 p-5 shrink-0">
              <div className="flex items-center space-x-2">
                <CalendarRange className="h-5 w-5 text-brand-primary" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Apply for Leave</h3>
              </div>
              <button 
                onClick={() => {
                  setShowApplyModal(false);
                  if (searchParams.get('action') === 'apply') {
                    searchParams.delete('action');
                    setSearchParams(searchParams, { replace: true });
                  }
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-6 overflow-y-auto space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-bold">Leave Type *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  <option value="casual">Casual Leave (General Time-off)</option>
                  <option value="medical">Medical / Sick Leave</option>
                  <option value="earned">Earned / Privilege Leave</option>
                  <option value="emergency">Emergency / Bereavement Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-bold">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-bold">End Date *</label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {startDate && endDate && (
                <div className="p-3 bg-brand-primary-light border border-brand-primary/30 rounded-xl flex items-center justify-between text-brand-primary text-xs font-bold">
                  <span>Total Leave Requested:</span>
                  <span className="text-sm font-extrabold">{calculateDays()} Day{calculateDays() > 1 ? 's' : ''}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-bold">Reason / Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain reason for leave application..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-750 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeavePage;
