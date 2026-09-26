import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { ShieldAlert } from 'lucide-react';

export const EscalationsPage: React.FC = () => {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEscalations = async () => {
      try {
        const res = await apiClient.get<any[]>('/escalations/');
        setEscalations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEscalations();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2 text-rose-600" />
          Escalations Log
        </h2>
        <p className="text-sm text-slate-500 mt-1">Review active, assigned, and critical client billing escalations.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {escalations.map((esc) => (
            <div key={esc.id} className="p-5 border border-gray-100 dark:border-slate-750 bg-gray-50/50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{esc.name}</h3>
                <span className="text-xs text-slate-400">Created: {new Date(esc.created_at).toLocaleDateString()}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                esc.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' :
                'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200 dark:border-rose-900'
              }`}>
                {esc.status}
              </span>
            </div>
          ))}
          {escalations.length === 0 && (
            <p className="text-slate-450 text-center py-6">No pending escalations found.</p>
          )}
        </div>
      )}
    </div>
  );
};
export default EscalationsPage;
