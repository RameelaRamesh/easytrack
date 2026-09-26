import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { Award } from 'lucide-react';

export const QAPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQA = async () => {
      try {
        const res = await apiClient.get<any[]>('/qa/');
        setReviews(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQA();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <Award className="h-5 w-5 mr-2 text-brand-primary" />
          Quality Assurance (QA) Queue
        </h2>
        <p className="text-sm text-slate-500 mt-1">Verify completed medical billing claims, log severity errors, and track rework.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-5 border border-gray-100 dark:border-slate-750 bg-gray-50/50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{rev.name}</h3>
                <span className="text-xs text-slate-400">Severity Error Category: {rev.details?.error_category || 'None'}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                rev.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' :
                'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900'
              }`}>
                {rev.status}
              </span>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-slate-450 text-center py-6">No pending claims in QA queue.</p>
          )}
        </div>
      )}
    </div>
  );
};
export default QAPage;
