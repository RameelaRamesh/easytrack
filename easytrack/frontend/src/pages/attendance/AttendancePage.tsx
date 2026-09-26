import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { CalendarDays } from 'lucide-react';
import { AttendanceRecord } from '../../types';

export const AttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await apiClient.get<AttendanceRecord[]>('/attendance/');
        setAttendance(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <CalendarDays className="h-5 w-5 mr-2 text-brand-primary" />
          Shift Attendance Logs
        </h2>
        <p className="text-sm text-slate-500 mt-1">Review active employee logins, break times, and total shift durations.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-755 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Break Duration</th>
                <th className="py-3 px-4">Shift Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-750 font-medium text-slate-700 dark:text-slate-200">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-755/30">
                  <td className="py-3 px-4 text-xs font-semibold">{record.date}</td>
                  <td className="py-3 px-4 font-semibold">{record.employee_name || 'System'}</td>
                  <td className="py-3 px-4 text-xs">{record.check_in ? new Date(record.check_in).toLocaleTimeString() : 'N/A'}</td>
                  <td className="py-3 px-4 text-xs">{record.check_out ? new Date(record.check_out).toLocaleTimeString() : 'N/A'}</td>
                  <td className="py-3 px-4 text-xs">{(record.total_break_seconds / 60).toFixed(0)} mins</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      record.status === 'working' ? 'bg-brand-primary-light text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450' :
                      record.status === 'on_break' ? 'bg-brand-primary-light text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No attendance logs found.</td>
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
