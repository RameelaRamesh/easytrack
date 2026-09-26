import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { ClipboardList } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.get<any[]>('/audit/');
        // Check if returns results array or list
        const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <ClipboardList className="h-5 w-5 mr-2 text-brand-primary" />
          Organization Audit Log
        </h2>
        <p className="text-sm text-slate-500 mt-1">Review secure administrative audit records of actions performed inside this tenant.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-750 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-750 font-medium text-slate-700 dark:text-slate-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30">
                  <td className="py-3 px-4 text-xs font-semibold text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold">{log.actor_name || 'System'}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default AuditPage;
