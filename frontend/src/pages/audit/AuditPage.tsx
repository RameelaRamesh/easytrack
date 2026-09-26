import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/api/client';
import { exportToCSV } from '../../utils/csvExport';
import { 
  ClipboardList, RefreshCw, Search, Download, Filter, 
  RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, Shield
} from 'lucide-react';

interface AuditLogItem {
  id: number;
  timestamp: string;
  actor_name?: string;
  actor_name_display?: string;
  actor_role?: string;
  action: string;
  category?: string;
  details: string;
  ip_address?: string;
  is_revertible?: boolean;
  is_reverted?: boolean;
}

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  // Filter States
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Status message state
  const [msg, setMsg] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'All') params.role = roleFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;

      const res = await apiClient.get('/audit/', { params });
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, categoryFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Live updates auto-refresh interval
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive, fetchLogs]);

  const handleRevert = async (logId: number) => {
    setMsg('');
    try {
      await apiClient.post(`/audit/${logId}/revert/`);
      setMsg(`Action #${logId} was successfully reverted.`);
      fetchLogs();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to revert audit log action.';
      setMsg(`Revert failed: ${detail}`);
    }
  };

  const handleExportData = () => {
    const csvHeaders = [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'actor_name_display', label: 'Actor' },
      { key: 'actor_role', label: 'Role' },
      { key: 'category', label: 'Category' },
      { key: 'action', label: 'Action' },
      { key: 'details', label: 'Details' },
      { key: 'ip_address', label: 'IP Address' },
      { key: 'is_reverted', label: 'Reverted Status' }
    ];

    const formattedData = logs.map(l => ({
      ...l,
      actor_name_display: l.actor_name_display || l.actor_name || 'System',
      actor_role: l.actor_role || 'System',
      category: l.category || 'System',
      timestamp: new Date(l.timestamp).toLocaleString(),
      is_reverted: l.is_reverted ? 'Reverted' : 'Active'
    }));

    exportToCSV(formattedData, csvHeaders, `easytrack_audit_logs_${new Date().toISOString().split('T')[0]}`);
  };

  // Client-side filtering
  const filteredLogs = logs.filter(log => {
    const actorStr = (log.actor_name_display || log.actor_name || 'System').toLowerCase();
    const actionStr = (log.action || '').toLowerCase();
    const detailsStr = (log.details || '').toLowerCase();
    const categoryStr = (log.category || 'System').toLowerCase();
    const roleStr = (log.actor_role || 'System').toLowerCase();
    const q = search.toLowerCase().trim();

    const matchesSearch = !q || actorStr.includes(q) || actionStr.includes(q) || detailsStr.includes(q) || categoryStr.includes(q);
    const matchesRole = roleFilter === 'All' || roleStr.includes(roleFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || categoryStr.includes(categoryFilter.toLowerCase());

    const logDateObj = new Date(log.timestamp);
    const logDateStr = logDateObj.toISOString().split('T')[0];

    let matchesDate = true;
    if (selectedDate) {
      matchesDate = logDateStr === selectedDate;
    }

    return matchesSearch && matchesRole && matchesCategory && matchesDate;
  });

  // Pagination logic
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Header & Live Update Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 dark:border-slate-750 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <ClipboardList className="h-6 w-6 mr-2 text-brand-primary" />
            Platform Audit & Compliance Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time security trail, administrative actions, and system event governance across all organizational modules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Update Toggle Switch */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 border-gray-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full mr-2 ${isLive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLive ? 'animate-spin' : ''}`} />
            {isLive ? 'Live Update ON' : 'Live Update OFF'}
          </button>

          {/* Export CSV Data Button */}
          <button
            onClick={handleExportData}
            className="flex items-center px-3.5 py-1.5 bg-brand-primary text-white hover:bg-brand-primary-hover rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Data (CSV)
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg flex items-center justify-between">
          <span className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
            {msg}
          </span>
          <button onClick={() => setMsg('')} className="text-emerald-600 hover:text-emerald-800 text-xs">Dismiss</button>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-gray-200 dark:border-slate-750">
        
        {/* 1. Search Box */}
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search action, actor, details..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
          />
        </div>

        {/* 2. Role Selector */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-medium"
          >
            <option value="All">All Roles</option>
            <option value="ceo">CEO</option>
            <option value="hr">HR Lead</option>
            <option value="operations_head">Operations Head</option>
            <option value="tl">Team Lead</option>
            <option value="employee">Employee</option>
            <option value="System">System</option>
          </select>
        </div>

        {/* 3. Category Selector */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-medium"
          >
            <option value="All">All Categories</option>
            <option value="Auth">Auth & Security</option>
            <option value="Attendance">Attendance</option>
            <option value="Employees">Employees</option>
            <option value="Payroll">Payroll</option>
            <option value="Billing">Operations & Production</option>
            <option value="Escalations">Escalations</option>
            <option value="System">System Config</option>
          </select>
        </div>

        {/* 4. Date & Calendar Input Picker */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
            className="w-full py-2 px-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-teal-800 dark:text-teal-300"
          />
          {selectedDate !== todayStr && (
            <button
              type="button"
              onClick={() => { setSelectedDate(todayStr); setCurrentPage(1); }}
              className="px-2 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-[10px] font-bold whitespace-nowrap"
              title="Reset to Today"
            >
              Today
            </button>
          )}
          {selectedDate && (
            <button
              type="button"
              onClick={() => { setSelectedDate(''); setCurrentPage(1); }}
              className="px-2 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 border border-gray-300 dark:border-slate-700 rounded-lg text-[10px] font-bold whitespace-nowrap"
              title="Show All Dates"
            >
              All
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-center">Action / Revert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-750 font-medium text-slate-700 dark:text-slate-200">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/40 transition-colors">
                  
                  {/* Timestamp */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>

                  {/* Actor & Role */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[9px] uppercase">
                        {(log.actor_name_display || log.actor_name || 'System').substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">
                          {log.actor_name_display || log.actor_name || 'System'}
                        </p>
                        <p className="text-[10px] text-slate-450 capitalize leading-tight">
                          {(log.actor_role || 'System').replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wide border ${
                      log.action.includes('REVERT') ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900' :
                      log.action.includes('DELETE') ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900' :
                      log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900' :
                      'bg-slate-100 text-slate-700 border-slate-250 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-primary-light text-brand-primary border border-brand-primary/20">
                      {log.category || 'System'}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-650 dark:text-slate-300" title={log.details}>
                    {log.details}
                  </td>

                  {/* Revert Action */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {log.is_reverted ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200">
                        Reverted
                      </span>
                    ) : log.is_revertible ? (
                      <button
                        onClick={() => handleRevert(log.id)}
                        className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded text-[11px] font-bold transition"
                      >
                        <RotateCcw className="h-3 w-3 mr-1 text-amber-600" />
                        Revert
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal">N/A</span>
                    )}
                  </td>

                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    No matching audit log records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-150 dark:border-slate-750 pt-4 text-xs font-semibold text-slate-500">
        <div className="flex items-center space-x-2">
          <span>Show items per page:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="py-1 px-2 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded text-xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-slate-400">
            (Showing {filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default AuditPage;
