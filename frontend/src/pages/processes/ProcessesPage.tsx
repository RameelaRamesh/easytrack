import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { FileText } from 'lucide-react';
import { Process } from '../../types';

export const ProcessesPage: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const res = await apiClient.get<Process[]>('/processes/');
        setProcesses(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProcesses();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <FileText className="h-5 w-5 mr-2 text-brand-primary" />
          Configured Billing Processes
        </h2>
        <p className="text-sm text-slate-500 mt-1">Review operational workflows, targets, and standard SOP guidelines.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {processes.map((proc) => (
            <div key={proc.id} className="p-5 border border-gray-100 dark:border-slate-750 bg-gray-50/50 dark:bg-slate-900 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-brand-primary dark:text-brand-primary font-mono">{proc.process_id}</span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">{proc.name}</h3>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  Daily Target: {proc.target}
                </span>
              </div>
              
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-750">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-1">Standard Operating Procedure (SOP)</p>
                <p className="whitespace-pre-line leading-relaxed">{proc.sop || 'No SOP guidelines provided.'}</p>
              </div>

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">
                Client: <span className="text-slate-700 dark:text-slate-200">{proc.client_name}</span>
              </div>
            </div>
          ))}
          {processes.length === 0 && (
            <p className="text-slate-400 text-center py-6">No processes configured.</p>
          )}
        </div>
      )}
    </div>
  );
};
export default ProcessesPage;
