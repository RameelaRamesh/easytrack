import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, ChevronLeft, ChevronRight, Moon, Sun, ShieldAlert } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const ShiftCalendarView: React.FC = () => {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [assignedRosters, setAssignedRosters] = useState<any[]>([]);

  // Function to load real roster allocations
  const loadRosterData = () => {
    try {
      const saved = localStorage.getItem('easytrack_shift_rosters');
      if (saved) {
        setAssignedRosters(JSON.parse(saved));
      } else {
        setAssignedRosters([]);
      }
    } catch {
      setAssignedRosters([]);
    }
  };

  useEffect(() => {
    loadRosterData();
    const handleUpdate = () => loadRosterData();
    window.addEventListener('easytrack_roster_updated', handleUpdate);
    return () => window.removeEventListener('easytrack_roster_updated', handleUpdate);
  }, []);

  // Check if current user has an assigned shift for the selected month/year
  const userFullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim().toLowerCase();
  const userName = (user?.username || '').toLowerCase();
  const userShiftTiming = (user as any)?.employee_profile?.work_timing || (user as any)?.work_timing;

  // Find assigned roster record for this user
  const matchingRoster = assignedRosters.find(r => {
    const rEmp = (r.employee || '').toLowerCase();
    return (rEmp && (rEmp.includes(userFullName) || rEmp.includes(userName) || userFullName.includes(rEmp)));
  });

  // Determine active shift profile for this month
  const activeShiftName = matchingRoster?.shift || userShiftTiming;
  const isShiftAssigned = Boolean(activeShiftName);

  // Calendar calculations
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Helper to determine shift details for a specific day
  const getShiftForDay = (day: number) => {
    const dateObj = new Date(selectedYear, selectedMonth, day);
    const dayOfWeek = dateObj.getDay();
    
    // Weekend check (Sunday = 0, Saturday = 6)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { isWeekend: true, label: 'Weekly Off' };
    }

    const shiftString = activeShiftName || 'Day Shift (08:00 AM - 05:00 PM)';
    const isNight = shiftString.toLowerCase().includes('night');
    const isEvening = shiftString.toLowerCase().includes('evening');

    return {
      isWeekend: false,
      name: isNight ? 'Night Shift' : isEvening ? 'Evening Shift' : 'Day Shift',
      timing: shiftString.includes('(') ? shiftString.split('(')[1].replace(')', '') : (isNight ? '10:00 PM - 07:00 AM' : isEvening ? '02:00 PM - 11:00 PM' : '08:00 AM - 05:00 PM'),
      isNight,
      isEvening,
      hours: '8.5 hrs'
    };
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      selectedMonth === today.getMonth() &&
      selectedYear === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-primary" />
            My Shift Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View your official shift roster and working schedule published by management.
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {/* Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white px-2 py-1 focus:outline-hidden cursor-pointer"
            >
              {MONTHS.map((month, idx) => (
                <option key={month} value={idx} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  {month}
                </option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white px-2 py-1 focus:outline-hidden cursor-pointer"
            >
              {YEARS.map(yr => (
                <option key={yr} value={yr} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  {yr}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!isShiftAssigned ? (
        /* VECTOR ILLUSTRATION EMPTY STATE (WHEN NO SHIFT IS ASSIGNED) */
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-gray-200 dark:border-slate-700 text-center space-y-5 shadow-xs">
          <div className="mx-auto w-32 h-32 flex items-center justify-center rounded-full bg-brand-primary-light text-brand-primary">
            <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="15" y="25" width="70" height="60" rx="12" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="4"/>
              <path d="M15 40H85" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="35" cy="20" r="5" fill="currentColor"/>
              <circle cx="65" cy="20" r="5" fill="currentColor"/>
              <path d="M35 15V25" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              <path d="M65 15V25" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="68" cy="65" r="18" fill="white" className="dark:fill-slate-800" stroke="currentColor" strokeWidth="4"/>
              <path d="M68 56V65L73 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 55H48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
              <path d="M32 67H45" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              No Shift Assigned Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No shift roster allocation has been assigned for <span className="font-bold text-brand-primary">{MONTHS[selectedMonth]} {selectedYear}</span>. HR, Team Leads, Operations Head, or CEO will publish shift schedules here.
            </p>
          </div>
        </div>
      ) : (
        /* DYNAMIC CALENDAR GRID VIEW */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs overflow-hidden">
          {/* Shift Header Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Shift Roster for {MONTHS[selectedMonth]} {selectedYear}
            </span>
            <div className="flex items-center gap-4 flex-wrap text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary"></span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Assigned Shift: <strong>{activeShiftName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Weekly Off</span>
              </div>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-center font-bold text-xs text-slate-600 dark:text-slate-400 py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-slate-750">
            {/* Empty Padding Cells Before 1st Day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] p-2 bg-slate-50/50 dark:bg-slate-900/30"></div>
            ))}

            {/* Days of the Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const shiftInfo = getShiftForDay(day);
              const activeToday = isToday(day);

              return (
                <div
                  key={day}
                  className={`min-h-[105px] p-2 flex flex-col justify-between transition ${
                    activeToday
                      ? 'bg-brand-primary-light font-semibold'
                      : shiftInfo.isWeekend
                      ? 'bg-slate-50/60 dark:bg-slate-900/40'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        activeToday
                          ? 'bg-brand-primary text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {activeToday && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary-light px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Shift Info Pill */}
                  <div className="mt-2">
                    {shiftInfo.isWeekend ? (
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-center">
                        <span className="text-[10px] font-bold block">{shiftInfo.label}</span>
                        <span className="text-[9px] block text-slate-400 dark:text-slate-500">Rest Day</span>
                      </div>
                    ) : (
                      <div
                        className={`p-1.5 rounded-lg border space-y-0.5 ${
                          shiftInfo.isNight
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                            : shiftInfo.isEvening
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold truncate">{shiftInfo.name}</span>
                          {shiftInfo.isNight ? (
                            <Moon className="h-3 w-3 shrink-0" />
                          ) : (
                            <Sun className="h-3 w-3 shrink-0" />
                          )}
                        </div>
                        <p className="text-[9px] font-mono opacity-85 leading-tight">{shiftInfo.timing}</p>
                        <div className="text-[9px] pt-0.5 font-bold flex justify-between items-center opacity-90">
                          <span>Hours:</span>
                          <span>{shiftInfo.hours}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftCalendarView;
