import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PartyPopper, CheckCircle2, ShieldCheck, AlertCircle, Volume2, VolumeX, XCircle, Clock } from 'lucide-react';
import { playSynthesizedChime, triggerDesktopNotification } from '../../utils/soundUtils';
import { Holiday, DEFAULT_HOLIDAYS_2026 } from './HolidayCalendarView';

const getFormattedTimestamp = (): string => {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const da = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${yr}-${mo}-${da} ${hh}:${mm}`;
};

export const HolidayApprovalsView: React.FC = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const loadHolidays = () => {
    try {
      const saved = localStorage.getItem('easytrack_holidays');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const dummyIds = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
          const filtered = parsed.filter((h: any) => !(dummyIds.has(String(h.id)) && h.updated_by_id === 'HR_ADMIN'));
          setHolidays(filtered);
          localStorage.setItem('easytrack_holidays', JSON.stringify(filtered));
        } else {
          setHolidays([]);
          localStorage.setItem('easytrack_holidays', JSON.stringify([]));
        }
      } else {
        setHolidays([]);
        localStorage.setItem('easytrack_holidays', JSON.stringify([]));
      }
    } catch {
      setHolidays([]);
    }
  };

  useEffect(() => {
    loadHolidays();
    const handleUpdate = () => loadHolidays();
    window.addEventListener('easytrack_holidays_updated', handleUpdate);
    return () => window.removeEventListener('easytrack_holidays_updated', handleUpdate);
  }, []);

  const saveHolidaysList = (updated: Holiday[]) => {
    setHolidays(updated);
    localStorage.setItem('easytrack_holidays', JSON.stringify(updated));
    window.dispatchEvent(new Event('easytrack_holidays_updated'));
  };

  const handleApprove = (id: string) => {
    const currentTs = getFormattedTimestamp();
    const currentUserId = user?.username || user?.role || 'APPROVER';
    const currentUserName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || user?.role || 'Approver';

    let approvedName = '';
    let approvedDate = '';

    const updated = holidays.map(h => {
      if (h.id === id) {
        approvedName = h.name;
        approvedDate = h.date;
        return {
          ...h,
          status: 'approved' as const,
          approved_by_id: currentUserId,
          approved_by_name: currentUserName,
          approved_at: currentTs,
          rejected_by_id: undefined,
          rejected_by_name: undefined,
          rejected_at: undefined,
        };
      }
      return h;
    });

    saveHolidaysList(updated);

    // Audio & Desktop Notification
    if (localStorage.getItem('easytrack_sound_muted') !== 'true') {
      playSynthesizedChime();
    }
    triggerDesktopNotification('Holiday Approved!', `Holiday "${approvedName}" on ${approvedDate} approved by @${currentUserId}.`);

    // In-app Notification
    try {
      const existingNotifs = JSON.parse(localStorage.getItem('easytrack_notifications') || '[]');
      const newNotif = {
        id: `notif-appr-${Date.now()}`,
        title: 'Holiday Approved',
        description: `Holiday "${approvedName}" (${approvedDate}) was approved by @${currentUserId} and published.`,
        created_at: currentTs,
        unread: true,
        target_roles: ['all'],
      };
      localStorage.setItem('easytrack_notifications', JSON.stringify([newNotif, ...existingNotifs]));
      window.dispatchEvent(new Event('easytrack_notifications_updated'));
    } catch {}
  };

  const handleReject = (id: string) => {
    const currentTs = getFormattedTimestamp();
    const currentUserId = user?.username || user?.role || 'APPROVER';
    const currentUserName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || user?.role || 'Approver';

    let rejectedName = '';
    let rejectedDate = '';

    const updated = holidays.map(h => {
      if (h.id === id) {
        rejectedName = h.name;
        rejectedDate = h.date;
        return {
          ...h,
          status: 'rejected' as const,
          rejected_by_id: currentUserId,
          rejected_by_name: currentUserName,
          rejected_at: currentTs,
          approved_by_id: undefined,
          approved_by_name: undefined,
          approved_at: undefined,
        };
      }
      return h;
    });

    saveHolidaysList(updated);

    if (localStorage.getItem('easytrack_sound_muted') !== 'true') {
      playSynthesizedChime();
    }
    triggerDesktopNotification('Holiday Rejected', `Holiday "${rejectedName}" on ${rejectedDate} was rejected by @${currentUserId}.`);
  };

  const userRole = user?.role || '';
  const userUsername = user?.username || '';

  const relevantHolidays = holidays.filter(h => {
    const isTargeted = (h.target_approvers || []).includes(userRole);
    const isApprovedByMe = h.approved_by_id === userUsername || h.approved_by_id === userRole;
    const isRejectedByMe = h.rejected_by_id === userUsername || h.rejected_by_id === userRole;
    return isTargeted || isApprovedByMe || isRejectedByMe;
  });

  const pendingApprovals = relevantHolidays.filter(h => h.status === 'pending_approval');
  const approvedRecords = relevantHolidays.filter(h => h.status === 'approved');
  const rejectedRecords = relevantHolidays.filter(h => h.status === 'rejected');

  const displayedHolidays = activeTab === 'pending'
    ? pendingApprovals
    : activeTab === 'approved'
    ? approvedRecords
    : activeTab === 'rejected'
    ? rejectedRecords
    : relevantHolidays;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-500" />
            Holiday Approval Requests & Records
            {pendingApprovals.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-xs animate-pulse">
                {pendingApprovals.length} Pending
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review pending requests and inspect permanent records of approved and rejected holiday requests.
          </p>
        </div>

      </div>

      {/* Record Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-slate-700 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <span>Pending Requests</span>
          {pendingApprovals.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white text-amber-700 font-extrabold text-[10px]">
              {pendingApprovals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <span>Approved Records ({approvedRecords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <span>Rejected Records ({rejectedRecords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'all'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <span>All Records ({relevantHolidays.length})</span>
        </button>
      </div>

      {/* Approvals List Grid */}
      {displayedHolidays.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500/80" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
            No {activeTab === 'pending' ? 'Pending' : activeTab === 'approved' ? 'Approved' : activeTab === 'rejected' ? 'Rejected' : ''} Holiday Records Found
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'You are all caught up! No pending holiday creation requests require your review right now.'
              : 'There are no recorded holiday requests in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedHolidays.map((holiday) => {
            const [yr, mo, da] = holiday.date.split('-');
            const monthName = new Date(Number(yr), Number(mo) - 1, Number(da)).toLocaleString('default', { month: 'short' });
            const isPending = holiday.status === 'pending_approval';
            const isApproved = holiday.status === 'approved';
            const isRejected = holiday.status === 'rejected';

            return (
              <div
                key={holiday.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 shadow-xs ${
                  isPending
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                    : isApproved
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Date Box */}
                  <div
                    className={`flex flex-col items-center justify-center min-w-[60px] h-16 border rounded-2xl shrink-0 shadow-2xs ${
                      isPending
                        ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                        : isApproved
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <span className="text-[11px] font-extrabold uppercase leading-none">{monthName}</span>
                    <span className="text-xl font-black leading-none mt-1">{da}</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {holiday.name}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                          {holiday.type}
                        </span>

                        {isPending && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-400">
                            Pending
                          </span>
                        )}

                        {isApproved && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900 border border-emerald-400">
                            Approved
                          </span>
                        )}

                        {isRejected && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-200 text-rose-900 border border-rose-400">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {holiday.day} • {holiday.description}
                    </p>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Requested by @{holiday.updated_by_id || 'HR'}</p>
                    <p className="text-[9px]">Submitted: {holiday.updated_at}</p>
                  </div>

                  {isPending ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReject(holiday.id)}
                        className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprove(holiday.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                    </div>
                  ) : isApproved ? (
                    <div className="text-right text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approved by @{holiday.approved_by_id || holiday.approved_by_name} on {holiday.approved_at}</span>
                    </div>
                  ) : (
                    <div className="text-right text-[10px] font-mono text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Rejected by @{holiday.rejected_by_id || holiday.rejected_by_name} on {holiday.rejected_at}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HolidayApprovalsView;
