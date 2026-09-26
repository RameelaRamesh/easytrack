import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { CalendarRange } from 'lucide-react';

export const LeavePage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await apiClient.get<any[]>('/leave/');
        setRequests(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <CalendarRange className="h-5 w-5 mr-2 text-brand-primary" />
          Leave Management
        </h2>
        <p className="text-sm text-slate-500 mt-1">Review leave balances, employee leave submissions, and approvals.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="p-5 border border-gray-100 dark:border-slate-750 bg-gray-50/50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-brand-primary dark:text-brand-primary capitalize">{req.leave_type} Leave</span>
                  <span className="text-xs text-slate-400">• {req.start_date} to {req.end_date}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{req.employee_name}</h3>
                <p className="text-xs text-slate-500 mt-1">Reason: {req.reason}</p>
                {req.review_comments && (
                  <p className="text-[11px] text-slate-450 mt-1.5 italic bg-white dark:bg-slate-800 p-2 rounded border border-gray-50 dark:border-slate-750">
                    Review comment: {req.review_comments} (by {req.reviewer_name})
                  </p>
                )}
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' :
                req.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900' :
                'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400 border-gray-200 dark:border-slate-700'
              }`}>
                {req.status}
              </span>
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-slate-400 text-center py-6">No leave requests found.</p>
          )}
        </div>
      )}
    </div>
  );
};
export default LeavePage;
