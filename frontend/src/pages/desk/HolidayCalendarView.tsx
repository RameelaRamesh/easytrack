import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, PartyPopper, Search, Sparkles, Plus, Trash2, CheckCircle2, ShieldCheck, AlertCircle, Volume2, VolumeX, Bell, XCircle, X } from 'lucide-react';
import { playSynthesizedChime, triggerDesktopNotification } from '../../utils/soundUtils';

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  day: string;
  type: string; // HR custom typed or selected
  description: string;
  status: 'approved' | 'pending_approval' | 'rejected';
  target_approvers?: string[]; // ['ceo', 'tl', 'operations_head']
  updated_by_id?: string;
  updated_by_name?: string;
  updated_at?: string; // YYYY-MM-DD HH:mm (2-digit hours & minutes, no seconds)
  approved_by_id?: string;
  approved_by_name?: string;
  approved_at?: string; // YYYY-MM-DD HH:mm
  rejected_by_id?: string;
  rejected_by_name?: string;
  rejected_at?: string; // YYYY-MM-DD HH:mm
}

export const getHolidayYear = (dateStr: string): number => {
  if (!dateStr) return 2026;
  const parts = dateStr.split(/[-/]/);
  if (parts[0] && parts[0].length === 4) {
    const yr = Number(parts[0]);
    if (!isNaN(yr) && yr > 2000) return yr;
  }
  if (parts[2] && parts[2].length === 4) {
    const yr = Number(parts[2]);
    if (!isNaN(yr) && yr > 2000) return yr;
  }
  const d = new Date(dateStr);
  const yr = d.getFullYear();
  return (isNaN(yr) || yr < 2000) ? 2026 : yr;
};

export const DEFAULT_HOLIDAYS_2026: Holiday[] = [];

const getFormattedTimestamp = (): string => {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const da = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${yr}-${mo}-${da} ${hh}:${mm}`;
};

export const HolidayCalendarView: React.FC = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newType, setNewType] = useState<string>('Public Holiday');
  const [newDesc, setNewDesc] = useState<string>('');

  // Target Approvers Checkboxes
  const [approverRoles, setApproverRoles] = useState<{ ceo: boolean; tl: boolean; operations_head: boolean }>({
    ceo: true,
    tl: true,
    operations_head: true,
  });

  const canManageHolidays = ['hr', 'ceo', 'operations_head', 'tl'].includes(user?.role || '');

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

  // Direct Submit by HR (Published immediately)
  const handleDirectSubmit = () => {
    if (!newDate || !newName.trim()) return;

    const dateObj = new Date(newDate);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTs = getFormattedTimestamp();
    const currentUserId = user?.username || 'HR_ADMIN';
    const currentUserName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'HR Admin';

    const holidayYr = Number(newDate.split('-')[0]);
    if (holidayYr && !isNaN(holidayYr)) {
      setSelectedYear(holidayYr);
    }

    const newHoliday: Holiday = {
      id: `hol-${Date.now()}`,
      date: newDate,
      name: newName.trim(),
      day: dayName,
      type: newType.trim() || 'General Holiday',
      description: newDesc.trim() || 'Official Holiday',
      status: 'approved',
      updated_by_id: currentUserId,
      updated_by_name: currentUserName,
      updated_at: currentTs,
    };

    const updated = [...holidays, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
    saveHolidaysList(updated);

    // Audio & Desktop Notification
    if (localStorage.getItem('easytrack_sound_muted') !== 'true') {
      playSynthesizedChime();
    }
    triggerDesktopNotification('Holiday Published', `Holiday "${newName.trim()}" on ${newDate} has been published.`);

    closeModal();
  };

  // Request Approval by HR (Sent to selected roles: CEO, TL, Ops Head)
  const handleRequestApproval = () => {
    if (!newDate || !newName.trim()) return;

    const selectedRoles: string[] = [];
    if (approverRoles.ceo) selectedRoles.push('ceo');
    if (approverRoles.tl) selectedRoles.push('tl');
    if (approverRoles.operations_head) selectedRoles.push('operations_head');

    if (selectedRoles.length === 0) {
      alert('Please select at least one role to send the approval request to.');
      return;
    }

    const dateObj = new Date(newDate);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTs = getFormattedTimestamp();
    const currentUserId = user?.username || 'HR_ADMIN';
    const currentUserName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'HR Admin';

    const holidayYr = Number(newDate.split('-')[0]);
    if (holidayYr && !isNaN(holidayYr)) {
      setSelectedYear(holidayYr);
    }

    const newHoliday: Holiday = {
      id: `hol-${Date.now()}`,
      date: newDate,
      name: newName.trim(),
      day: dayName,
      type: newType.trim() || 'General Holiday',
      description: newDesc.trim() || 'Official Holiday',
      status: 'pending_approval',
      target_approvers: selectedRoles,
      updated_by_id: currentUserId,
      updated_by_name: currentUserName,
      updated_at: currentTs,
    };

    const updated = [...holidays, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
    saveHolidaysList(updated);

    // Dispatch System Notification to Target Roles
    try {
      const existingNotifs = JSON.parse(localStorage.getItem('easytrack_notifications') || '[]');
      const notifItem = {
        id: `notif-hol-${Date.now()}`,
        title: 'Holiday Approval Request',
        message: `HR requested approval for holiday "${newName.trim()}" (${newDate}).`,
        created_at: currentTs,
        unread: true,
        target_roles: selectedRoles,
      };
      localStorage.setItem('easytrack_notifications', JSON.stringify([notifItem, ...existingNotifs]));
      window.dispatchEvent(new Event('easytrack_notifications_updated'));
    } catch {
      // Storage fallback
    }

    // Play Sound & Trigger Desktop Notification
    if (localStorage.getItem('easytrack_sound_muted') !== 'true') {
      playSynthesizedChime();
    }
    triggerDesktopNotification(
      'Holiday Approval Request',
      `HR requested approval for "${newName.trim()}" (${newDate}) sent to ${selectedRoles.map(r => r.toUpperCase()).join(', ')}.`
    );

    closeModal();
  };

  // Approver Action (CEO, TL, Ops Head)
  const handleApproveHoliday = (id: string) => {
    const currentTs = getFormattedTimestamp();
    const currentUserId = user?.username || user?.role || 'APPROVER';
    const currentUserName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || user?.role || 'Approver';

    let approvedHolidayName = '';
    let approvedHolidayDate = '';

    const updated = holidays.map(h => {
      if (h.id === id) {
        approvedHolidayName = h.name;
        approvedHolidayDate = h.date;
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

    if (approvedHolidayDate) {
      const yr = Number(approvedHolidayDate.split('-')[0]);
      if (yr && !isNaN(yr)) {
        setSelectedYear(yr);
      }
    }

    saveHolidaysList(updated);

    // Audio & Notifications for Approval
    if (localStorage.getItem('easytrack_sound_muted') !== 'true') {
      playSynthesizedChime();
    }
    triggerDesktopNotification('Holiday Approved!', `Holiday "${approvedHolidayName}" on ${approvedHolidayDate} has been approved by @${currentUserId}.`);

    try {
      const existingNotifs = JSON.parse(localStorage.getItem('easytrack_notifications') || '[]');
      const notifItem = {
        id: `notif-appr-${Date.now()}`,
        title: 'Holiday Approved',
        message: `Holiday "${approvedHolidayName}" on ${approvedHolidayDate} was approved by @${currentUserId}.`,
        created_at: currentTs,
        unread: true,
        target_roles: ['all'],
      };
      localStorage.setItem('easytrack_notifications', JSON.stringify([notifItem, ...existingNotifs]));
      window.dispatchEvent(new Event('easytrack_notifications_updated'));
    } catch {
      // Storage fallback
    }
  };

  const handleDeleteHoliday = (id: string) => {
    const updated = holidays.filter(h => h.id !== id);
    saveHolidaysList(updated);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setNewDate('');
    setNewName('');
    setNewType('Public Holiday');
    setNewDesc('');
    setApproverRoles({ ceo: true, tl: true, operations_head: true });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const availableYears = Array.from(
    new Set([
      ...holidays.map(h => getHolidayYear(h.date)).filter(y => y > 2020),
      2024, 2025, 2026, 2027, 2028, 2029, 2030
    ])
  ).sort((a, b) => a - b);

  const userRole = user?.role || '';
  const yearHolidays = holidays.filter(h => {
    const holidayYr = getHolidayYear(h.date);
    if (holidayYr !== selectedYear) return false;
    if (userRole === 'hr') return true;
    return h.status === 'approved';
  });

  const filteredHolidays = yearHolidays.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) || h.description.toLowerCase().includes(searchTerm.toLowerCase()) || h.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const upcomingHolidays = yearHolidays.filter(h => h.date >= todayStr && h.status === 'approved');
  const nextHoliday = upcomingHolidays[0] || yearHolidays.find(h => h.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-brand-primary" />
            Official Holiday Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            List of official company holidays and approvals.
          </p>
        </div>

        {/* Search & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search holiday..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-brand-primary-light text-brand-primary border border-brand-primary/30 rounded-xl text-xs font-bold cursor-pointer"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Year {yr}</option>
            ))}
          </select>

          {canManageHolidays && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Holiday</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-750 p-4 sm:p-5 shrink-0">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PartyPopper className="h-5 w-5 text-brand-primary" />
                Add Official Holiday
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-bold">Holiday Title *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. New Year / Diwali / Corporate Off"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-bold">Date *</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Type / Category Field with Dropdown + Free Typing Combo */}
              <div className="space-y-1">
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-bold">Type / Category *</label>
                <div className="flex gap-2">
                  <select
                    value={['Public Holiday', 'National Holiday', 'Festival Holiday', 'Company Off', 'Optional Holiday'].includes(newType) ? newType : 'Custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'Custom') {
                        setNewType(e.target.value);
                      }
                    }}
                    className="px-2.5 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary shrink-0"
                  >
                    <option value="Public Holiday">Public Holiday</option>
                    <option value="National Holiday">National Holiday</option>
                    <option value="Festival Holiday">Festival Holiday</option>
                    <option value="Company Off">Company Off</option>
                    <option value="Optional Holiday">Optional Holiday</option>
                    <option value="Custom">Custom...</option>
                  </select>

                  <input
                    type="text"
                    list="category-suggestions"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="Select or type custom category..."
                    className="flex-1 px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <datalist id="category-suggestions">
                    <option value="Public Holiday" />
                    <option value="National Holiday" />
                    <option value="Festival Holiday" />
                    <option value="Company Off" />
                    <option value="Optional Holiday" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-bold">Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description of the holiday"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-750 shrink-0 flex flex-col sm:flex-row justify-end gap-2 bg-slate-50 dark:bg-slate-850">
              <button
                type="button"
                onClick={closeModal}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDirectSubmit}
                className="px-3.5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-xs shadow-xs transition"
              >
                Submit Holiday
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-brand-primary-light text-brand-primary rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Holidays ({selectedYear})</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{yearHolidays.filter(h => h.status === 'approved').length} Days</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Upcoming Holidays</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{upcomingHolidays.length} Days</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl">
            <PartyPopper className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Next Holiday</p>
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate">{nextHoliday ? nextHoliday.name : '—'}</p>
            {nextHoliday && <p className="text-[10px] text-slate-500 font-mono">{nextHoliday.date} ({nextHoliday.day})</p>}
          </div>
        </div>
      </div>

      {/* Holidays List Grid */}
      {filteredHolidays.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 text-center text-slate-400 space-y-2">
          <PartyPopper className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No Holidays Scheduled for Year {selectedYear}</h4>
          <p className="text-xs">Management has not added any holidays for this year yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHolidays.map((holiday) => {
            const isPassed = holiday.date < todayStr;
            const [yr, mo, da] = holiday.date.split('-');
            const monthName = new Date(Number(yr), Number(mo) - 1, Number(da)).toLocaleString('default', { month: 'short' });

            const isPending = holiday.status === 'pending_approval';
            const isRejected = holiday.status === 'rejected';
            const userRole = user?.role || '';
            const canApproveThis = isPending && (holiday.target_approvers || []).includes(userRole);

            return (
              <div
                key={holiday.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                  isPending
                    ? 'bg-amber-50/70 dark:bg-amber-950/40 border-dashed border-amber-400 dark:border-amber-600 backdrop-blur-md opacity-75 filter blur-[0.5px]'
                    : isRejected
                    ? 'bg-rose-50/70 dark:bg-rose-950/40 border-dashed border-rose-400 dark:border-rose-600 backdrop-blur-md opacity-75 filter blur-[0.5px]'
                    : isPassed
                    ? 'bg-slate-50/70 dark:bg-slate-900/40 border-gray-200 dark:border-slate-750 opacity-70'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Date Box */}
                  <div className="flex flex-col items-center justify-center min-w-[56px] h-14 bg-brand-primary-light border border-brand-primary/30 rounded-xl text-brand-primary shrink-0">
                    <span className="text-[10px] font-extrabold uppercase leading-none">{monthName}</span>
                    <span className="text-lg font-black leading-none mt-1">{da}</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {holiday.name}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                          {holiday.type}
                        </span>

                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300">
                            Pending Approval (Blurred)
                          </span>
                        )}

                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300">
                            Rejected (Blurred)
                          </span>
                        )}

                        {canManageHolidays && (
                          <button
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition rounded"
                            title="Delete Holiday"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {holiday.day} • {holiday.description}
                    </p>
                  </div>
                </div>

                {/* Approver action button if target role */}
                {canApproveThis && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleApproveHoliday(holiday.id)}
                      className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Approve Holiday</span>
                    </button>
                  </div>
                )}

                {/* Bottom Metadata Timestamp Footer */}
                <div className="pt-2 border-t border-gray-150 dark:border-slate-750 text-[10px] font-mono text-slate-400 flex flex-wrap justify-between items-center gap-1">
                  {holiday.status === 'approved' && (holiday.approved_at || holiday.approved_by_id) ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved by @{holiday.approved_by_id || holiday.approved_by_name} on {holiday.approved_at}
                    </span>
                  ) : holiday.status === 'rejected' && (holiday.rejected_at || holiday.rejected_by_id) ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Rejected by @{holiday.rejected_by_id || holiday.rejected_by_name} on {holiday.rejected_at}
                    </span>
                  ) : isPending ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Pending Approval (Sent to {holiday.target_approvers?.map(r => r.toUpperCase()).join(', ')}) • Updated by @{holiday.updated_by_id} on {holiday.updated_at}
                    </span>
                  ) : (
                    <span>
                      Updated by @{holiday.updated_by_id || holiday.updated_by_name || 'HR_ADMIN'} on {holiday.updated_at || '2026-01-01 09:00'}
                    </span>
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

export default HolidayCalendarView;
