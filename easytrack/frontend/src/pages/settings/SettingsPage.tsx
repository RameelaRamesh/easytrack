import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { Save, Building2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fields
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [workingStart, setWorkingStart] = useState('09:00');
  const [workingEnd, setWorkingEnd] = useState('18:00');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/organizations/settings/');
        setOrg(res.data);
        setName(res.data.name);
        setIndustry(res.data.industry);
        setTimezone(res.data.timezone);
        setCurrency(res.data.currency);
        setWorkingStart(res.data.working_hours?.start || '09:00');
        setWorkingEnd(res.data.working_hours?.end || '18:00');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    const patchData = {
      name,
      industry,
      timezone,
      currency,
      working_hours: {
        start: workingStart,
        end: workingEnd,
      },
    };

    try {
      const res = await apiClient.patch('/organizations/settings/', patchData);
      setOrg(res.data);
      setMessage('Settings updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save settings.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 p-8 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2.5 bg-brand-primary-light text-brand-primary rounded-xl">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Organization Settings</h2>
          <p className="text-sm text-slate-500">Configure global settings and rules for your organization.</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-brand-primary-light text-emerald-700 border border-emerald-250 text-sm rounded-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Organization Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Currency</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Shift Start Time</label>
            <input
              type="text"
              value={workingStart}
              onChange={(e) => setWorkingStart(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm"
              placeholder="e.g. 09:00"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Shift End Time</label>
            <input
              type="text"
              value={workingEnd}
              onChange={(e) => setWorkingEnd(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm"
              placeholder="e.g. 18:00"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center py-3 px-4 bg-brand-primary bg-brand-primary-hover text-white font-semibold rounded-lg text-sm transition"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Configurations
        </button>
      </form>
    </div>
  );
};
export default SettingsPage;
