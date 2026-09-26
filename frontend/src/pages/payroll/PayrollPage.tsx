import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { DollarSign } from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const res = await apiClient.get<any[]>('/payroll/');
        setPayroll(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-brand-primary" />
          Payroll Management
        </h2>
        <p className="text-sm text-slate-500 mt-1">Review employee payslips, net salaries, base payments, and allowances.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {payroll.map((slip) => (
            <div key={slip.id} className="p-5 border border-gray-100 dark:border-slate-750 bg-gray-50/50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{slip.name}</h3>
                <span className="text-xs text-slate-400">Status: {slip.status}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Net Salary</p>
                <p className="text-xl font-extrabold text-brand-primary mt-0.5">INR {slip.details?.net_salary || '0.00'}</p>
              </div>
            </div>
          ))}
          {payroll.length === 0 && (
            <p className="text-slate-455 text-center py-6">No salary records configured for this billing period.</p>
          )}
        </div>
      )}
    </div>
  );
};
export default PayrollPage;
