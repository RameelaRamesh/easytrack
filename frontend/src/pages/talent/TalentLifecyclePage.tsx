import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  UserPlus, UserCheck, Activity, LogOut, Plus, Search, Filter,
  CheckCircle2, X, AlertCircle, Clock, Laptop, ShieldCheck, DollarSign,
  FileCheck, Calendar, ArrowRight, Award, Trash2, Key, ChevronRight
} from 'lucide-react';
import { EmployeeProfile } from '../../types';

interface TalentLifecyclePageProps {
  defaultTab?: 'recruitment' | 'onboarding' | 'lifecycle' | 'offboarding';
}

export const TalentLifecyclePage: React.FC<TalentLifecyclePageProps> = ({ defaultTab }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'recruitment' | 'onboarding' | 'lifecycle' | 'offboarding'>(
    (tabParam as any) || defaultTab || 'recruitment'
  );

  useEffect(() => {
    if (tabParam && ['recruitment', 'onboarding', 'lifecycle', 'offboarding'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    } else if (defaultTab && !tabParam) {
      setActiveTab(defaultTab);
    }
  }, [tabParam, defaultTab]);

  const handleTabChange = (t: 'recruitment' | 'onboarding' | 'lifecycle' | 'offboarding') => {
    setActiveTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };

  // Notification State
  const [notification, setNotification] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Employees data from backend
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const loadEmployees = async () => {
    try {
      const res = await apiClient.get<EmployeeProfile[]>('/employees/');
      setEmployees(res.data || []);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // ==================== 1. RECRUITMENT STATE ====================
  const [jobOpenings, setJobOpenings] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hr_jobs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const INITIAL_SPREADSHEET_CANDIDATES: any[] = [];

  const [candidates, setCandidates] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hr_candidates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((c: any) => c && c.name && !['swathi', 'lokeshwari', 'santhosh', 'rizwanrehan', 'obeth', 'lochathipathy', 'porthana', 'menaka', 'aswini', 'kalai', 'prasanna'].includes(String(c.name).toLowerCase()));
          return filtered;
        }
      }
    } catch {}
    return [];
  });

  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<'All' | 'Selected' | 'On hold' | 'Rejected'>('All');

  useEffect(() => {
    localStorage.setItem('hr_jobs', JSON.stringify(jobOpenings));
  }, [jobOpenings]);

  useEffect(() => {
    localStorage.setItem('hr_candidates', JSON.stringify(candidates));
  }, [candidates]);

  // Modal states for Recruitment
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '', department: 'Operations', vacancies: 1, experience: '1-3 Years', location: 'Office', type: 'Full-time', target_date: ''
  });

  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    degree: '',
    location: '',
    college: '',
    contact: '',
    interviewDate: '24/08/26',
    status: 'Selected',
    remarks: ''
  });

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title.trim()) return;
    const item = {
      id: Date.now(),
      title: newJob.title,
      department: newJob.department,
      vacancies: Number(newJob.vacancies),
      experience: newJob.experience,
      location: newJob.location,
      type: newJob.type,
      status: 'open',
      target_date: newJob.target_date || new Date().toISOString().split('T')[0]
    };
    setJobOpenings([item, ...jobOpenings]);
    setShowAddJobModal(false);
    setNewJob({ title: '', department: 'Operations', vacancies: 1, experience: '1-3 Years', location: 'Office', type: 'Full-time', target_date: '' });
    showNotice(`Job opening "${item.title}" successfully published!`);
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name.trim()) return;
    const item = {
      id: Date.now(),
      sNo: candidates.length + 1,
      name: newCandidate.name.trim(),
      degree: newCandidate.degree.trim() || 'Graduate',
      location: newCandidate.location.trim() || 'Office',
      college: newCandidate.college.trim() || 'College',
      contact: newCandidate.contact.trim() || '-',
      interviewDate: newCandidate.interviewDate.trim() || '24/08/26',
      status: newCandidate.status || 'Selected',
      remarks: newCandidate.remarks.trim() || '-'
    };
    const updated = [...candidates, item];
    setCandidates(updated);
    setShowAddCandidateModal(false);
    setNewCandidate({
      name: '',
      degree: '',
      location: '',
      college: '',
      contact: '',
      interviewDate: '24/08/26',
      status: 'Selected',
      remarks: ''
    });
    showNotice(`Candidate ${item.name} added to pipeline.`);
  };

  const handleUpdateCandidateStatus = (id: number, nextStatus: string) => {
    setCandidates(candidates.map(c => {
      if (c.id === id) {
        return { ...c, status: nextStatus };
      }
      return c;
    }));
    showNotice(`Candidate status updated to "${nextStatus}".`);
  };

  const handleDeleteCandidate = (id: number) => {
    setCandidates(candidates.filter(c => c.id !== id));
    showNotice('Candidate record removed.');
  };

  // ==================== 2. ONBOARDING STATE ====================
  const [onboardings, setOnboardings] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hr_onboardings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('hr_onboardings', JSON.stringify(onboardings));
  }, [onboardings]);

  const toggleOnboardingChecklist = (onboardId: number, key: string) => {
    setOnboardings(onboardings.map(o => {
      if (o.id === onboardId) {
        const next = { ...o.checklist, [key]: !o.checklist[key] };
        return { ...o, checklist: next };
      }
      return o;
    }));
  };

  const handleConvertCandidateToEmployee = (cand: any) => {
    const nameParts = (cand.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const email = cand.email || `${firstName.toLowerCase()}${lastName.toLowerCase()}@easytrack.com`;
    const mobile = cand.contact || cand.phone || '';
    const desg = cand.job_title || (cand.degree ? `${cand.degree} - Billing Executive` : 'Billing Executive');

    navigate(`/employees?openModal=true&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}&mobile=${encodeURIComponent(mobile)}&designation=${encodeURIComponent(desg)}`);
  };

  // ==================== 3. CAREER LIFECYCLE STATE ====================
  const [lifecycleEvents, setLifecycleEvents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hr_lifecycle_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('hr_lifecycle_events', JSON.stringify(lifecycleEvents));
  }, [lifecycleEvents]);

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    emp_name: '', emp_id: '', type: 'Promotion & Appraisal', detail: '', date: ''
  });

  const handleAddLifecycleEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.emp_name.trim() || !newEvent.detail.trim()) return;
    const item = {
      id: Date.now(),
      emp_id: newEvent.emp_id || 'EMP-008',
      name: newEvent.emp_name,
      type: newEvent.type,
      detail: newEvent.detail,
      date: newEvent.date || new Date().toISOString().split('T')[0],
      status: 'Approved'
    };
    setLifecycleEvents([item, ...lifecycleEvents]);
    setShowAddEventModal(false);
    setNewEvent({ emp_name: '', emp_id: '', type: 'Promotion & Appraisal', detail: '', date: '' });
    showNotice(`Career milestone recorded for ${item.name}.`);
  };

  // ==================== 4. OFFBOARDING & CLEARANCE STATE ====================
  const [exitClearances, setExitClearances] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hr_exit_clearances');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('hr_exit_clearances', JSON.stringify(exitClearances));
  }, [exitClearances]);

  const toggleExitClearance = (exitId: number, key: string) => {
    setExitClearances(exitClearances.map(ex => {
      if (ex.id === exitId) {
        const next = { ...ex.clearance, [key]: !ex.clearance[key] };
        return { ...ex, clearance: next };
      }
      return ex;
    }));
  };

  const handleFinalizeExitAndRevoke = async (ex: any) => {
    try {
      // Patch employee status to terminated
      if (ex.employee_id) {
        const matched = employees.find(e => e.employee_id === ex.employee_id);
        if (matched) {
          await apiClient.patch(`/employees/${matched.id}/`, { status: 'terminated' });
        }
      }
      setExitClearances(exitClearances.map(item => {
        if (item.id === ex.id) {
          return {
            ...item,
            status: 'Cleared & Exited',
            clearance: { hardware_assets: true, hr_exit_interview: true, finance_settlement: true, access_revoked: true }
          };
        }
        return item;
      }));
      showNotice(`Offboarding complete for ${ex.name}. System access revoked and account marked terminated.`);
      loadEmployees();
    } catch {
      showNotice(`Exit clearance finalized for ${ex.name}.`);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-normal flex items-center">
              <UserCheck className="h-6 w-6 mr-2.5 text-brand-primary" />
              Talent Acquisition & Employee Lifecycle Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            End-to-end recruitment pipelines, onboarding compliance checklists, promotions, and offboarding clearance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/employees"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs flex items-center"
          >
            Workforce Directory ➔
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex justify-between items-center shadow-sm">
          <span className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
            {notification}
          </span>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4 Inner Tabs Bar */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
        <div className="flex overflow-x-auto space-x-2 scrollbar-none">
          {[
            { id: 'recruitment', label: '1. Recruitment Pipeline', icon: UserPlus, count: candidates.length },
            { id: 'onboarding', label: '2. Onboarding Center', icon: CheckCircle2, count: onboardings.length },
            { id: 'lifecycle', label: '3. Career Lifecycle', icon: Activity, count: lifecycleEvents.length },
            { id: 'offboarding', label: '4. Offboarding Clearance', icon: LogOut, count: exitClearances.filter(e => e.status !== 'Cleared & Exited').length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                    isActive ? 'bg-white text-brand-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== TAB 1: RECRUITMENT PIPELINE ==================== */}
      {activeTab === 'recruitment' && (
        <div className="space-y-6">
          
          {/* Top Actions & KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Candidates</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {candidates.length}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Across all colleges & degrees</p>
            </div>

            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-purple-200 dark:border-purple-950/40 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Selected</p>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1 font-mono">
                {candidates.filter(c => c.status === 'Selected').length}
              </p>
              <p className="text-[10px] text-purple-500 mt-1">Cleared interview rounds</p>
            </div>

            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-rose-200 dark:border-rose-950/40 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">On Hold</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
                {candidates.filter(c => c.status === 'On hold').length}
              </p>
              <p className="text-[10px] text-rose-400 mt-1">Under evaluation / review</p>
            </div>

            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Rejected</p>
              <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1 font-mono">
                {candidates.filter(c => c.status === 'Rejected').length}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Did not meet criteria</p>
            </div>
          </div>

          {/* Job Openings Section */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Job Openings</h3>
                <p className="text-xs text-slate-400">Department vacancies currently accepting applicants.</p>
              </div>
              <button
                onClick={() => setShowAddJobModal(true)}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center"
              >
                <Plus className="h-4 w-4 mr-1.5" /> + Post Job Opening
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {jobOpenings.map(job => (
                <div key={job.id} className="p-4 border border-slate-150 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{job.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{job.department} • {job.type}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                      {job.vacancies} Openings
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                    <p>Experience: <strong className="text-slate-700 dark:text-slate-200">{job.experience}</strong></p>
                    <p>Location: <strong className="text-slate-700 dark:text-slate-200">{job.location}</strong></p>
                    <p>Target Close: <strong className="text-slate-700 dark:text-slate-200">{job.target_date}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Pipeline Tracker - Matching Spreadsheet */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Hiring Pipeline</h3>
                <p className="text-xs text-slate-400">Review candidates, progress statuses, and manage interview evaluations.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder="Search candidate, college, location..."
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs"
                  />
                </div>
                <button
                  onClick={() => setShowAddCandidateModal(true)}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> + Register Candidate
                </button>
              </div>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['All', 'Selected', 'On hold', 'Rejected'] as const).map(st => {
                const count = st === 'All' ? candidates.length : candidates.filter(c => c.status === st).length;
                const isAct = candidateStatusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setCandidateStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isAct 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{st}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isAct ? 'bg-white/20 text-white dark:text-slate-900 dark:bg-slate-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Exact 9-Column Spreadsheet Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 text-center w-12">S.No</th>
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Degree</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">College</th>
                    <th className="py-3 px-3 font-mono">Contact</th>
                    <th className="py-3 px-3 font-mono">Interview Date</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4">Remarks / Notes</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {candidates
                    .filter(c => {
                      if (candidateStatusFilter !== 'All' && c.status !== candidateStatusFilter) return false;
                      if (!candidateSearch.trim()) return true;
                      const q = candidateSearch.toLowerCase().trim();
                      return (
                        (c.name || '').toLowerCase().includes(q) ||
                        (c.degree || '').toLowerCase().includes(q) ||
                        (c.location || '').toLowerCase().includes(q) ||
                        (c.college || '').toLowerCase().includes(q) ||
                        (c.contact || '').toLowerCase().includes(q) ||
                        (c.remarks || '').toLowerCase().includes(q) ||
                        (c.status || '').toLowerCase().includes(q)
                      );
                    })
                    .map((cand, idx) => (
                      <tr key={cand.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 text-center text-slate-400 font-semibold">{cand.sNo || idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{cand.name}</td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">{cand.degree}</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{cand.location}</td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 min-w-[140px]">{cand.college}</td>
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">{cand.contact}</td>
                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{cand.interviewDate}</td>
                        <td className="py-3 px-3 text-center">
                          <select
                            value={cand.status}
                            onChange={(e) => handleUpdateCandidateStatus(cand.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none transition ${
                              cand.status === 'Selected'
                                ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                                : cand.status === 'On hold'
                                ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <option value="Selected">Selected</option>
                            <option value="On hold">On hold</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs min-w-[180px] max-w-xs">{cand.remarks}</td>
                        <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                          {cand.status === 'Selected' && (
                            <button
                              onClick={() => handleConvertCandidateToEmployee(cand)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-2xs"
                              title="Convert to Onboarding"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>Onboard</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCandidate(cand.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete candidate record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 2: ONBOARDING CENTER ==================== */}
      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Onboarding Compliance Trackers</h3>
              <p className="text-xs text-slate-400">7-point mandatory enterprise verification checklist for new joiners.</p>
            </div>

            <div className="space-y-6">
              {onboardings.map(item => {
                const keys = Object.keys(item.checklist);
                const completed = keys.filter(k => item.checklist[k] === true).length;
                const percent = Math.round((completed / keys.length) * 100);

                return (
                  <div key={item.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {item.name} <span className="text-xs font-mono font-bold text-brand-primary ml-2">({item.emp_id})</span>
                        </h4>
                        <p className="text-xs text-slate-500">Role: {item.job} • Joining Date: {item.start_date} • Base: ₹{item.salary?.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-brand-primary">{percent}% Completed</span>
                        <div className="w-32 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1">
                          <div className="bg-brand-primary h-full rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* 7 Checklist Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {[
                        { key: 'id_issued', label: '1. Employee ID Issued' },
                        { key: 'asset_issued', label: '2. Hardware Kit Issued' },
                        { key: 'salary_account_created', label: '3. Salary Account Setup' },
                        { key: 'policy_acknowledgement', label: '4. HR Policy Signed' },
                        { key: 'system_access_setup', label: '5. Portal Login Active' },
                        { key: 'training_assigned', label: '6. HIPAA Training Assigned' },
                        { key: 'probation_started', label: '7. 90-Day Probation Logged' },
                      ].map(check => (
                        <label 
                          key={check.key}
                          className={`flex items-center space-x-2.5 p-3 rounded-xl border transition cursor-pointer ${
                            item.checklist[check.key]
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 text-emerald-800 dark:text-emerald-300 font-bold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={Boolean(item.checklist[check.key])}
                            onChange={() => toggleOnboardingChecklist(item.id, check.key)}
                            className="rounded text-brand-primary focus:ring-brand-primary h-4 w-4"
                          />
                          <span>{check.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              {onboardings.length === 0 && (
                <p className="text-center text-slate-400 py-8 text-xs font-medium">No pending onboarding checklists.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: CAREER LIFECYCLE ==================== */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Career Progression & Probation Milestones</h3>
                <p className="text-xs text-slate-400">Track probations, salary appraisals, role promotions, and department transfers.</p>
              </div>
              <button
                onClick={() => setShowAddEventModal(true)}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Record Career Milestone
              </button>
            </div>

            <div className="space-y-3">
              {lifecycleEvents.map(ev => (
                <div key={ev.id} className="p-4 border border-slate-150 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 rounded-xl flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-white">{ev.name} ({ev.emp_id})</span>
                      <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold">
                        {ev.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{ev.detail}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono block">{ev.date}</span>
                    <span className="text-[10px] font-bold text-emerald-600">✓ Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: OFFBOARDING CLEARANCE ==================== */}
      {activeTab === 'offboarding' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">4-Pillar Security Exit Clearance</h3>
              <p className="text-xs text-slate-400">Enforce hardware return, final accounts clearance, and system access revocation for exiting staff.</p>
            </div>

            <div className="space-y-4">
              {exitClearances.map(ex => {
                const allClear = Object.values(ex.clearance).every(v => v === true);

                return (
                  <div key={ex.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {ex.name} <span className="text-xs font-mono font-bold text-brand-primary ml-2">({ex.employee_id})</span>
                        </h4>
                        <p className="text-xs text-slate-500">Department: {ex.department} • Notice Ends: {ex.notice_ends}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ex.status === 'Cleared & Exited'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {ex.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {[
                        { key: 'hardware_assets', label: '1. Hardware Assets Returned' },
                        { key: 'hr_exit_interview', label: '2. HR Exit Interview Signed' },
                        { key: 'finance_settlement', label: '3. Finance & No-Dues Cleared' },
                        { key: 'access_revoked', label: '4. System Access Terminated' },
                      ].map(check => (
                        <label 
                          key={check.key}
                          className={`flex items-center space-x-2.5 p-3 rounded-xl border transition cursor-pointer ${
                            ex.clearance[check.key]
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 text-emerald-800 font-bold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-600'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={Boolean(ex.clearance[check.key])}
                            onChange={() => toggleExitClearance(ex.id, check.key)}
                            className="rounded text-brand-primary focus:ring-brand-primary h-4 w-4"
                          />
                          <span>{check.label}</span>
                        </label>
                      ))}
                    </div>

                    {ex.status !== 'Cleared & Exited' && (
                      <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => handleFinalizeExitAndRevoke(ex)}
                          className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          Revoke System Access & Finalize Exit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {exitClearances.length === 0 && (
                <p className="text-center text-slate-400 py-8 text-xs font-medium">No active resignation or exit clearances.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Add Job Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Post New Job Vacancy</h3>
              <button onClick={() => setShowAddJobModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handlePostJob} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-semibold">
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">Job Title *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Senior Operations Specialist"
                    value={newJob.title}
                    onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase text-[10px] text-slate-400 mb-1">Department</label>
                    <select 
                      value={newJob.department}
                      onChange={e => setNewJob({ ...newJob, department: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                    >
                      <option value="Operations">Operations</option>
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="QA">QA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block uppercase text-[10px] text-slate-400 mb-1">Vacancies</label>
                    <input 
                      type="number"
                      min={1}
                      value={newJob.vacancies}
                      onChange={e => setNewJob({ ...newJob, vacancies: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase text-[10px] text-slate-400 mb-1">Experience</label>
                    <input 
                      type="text"
                      value={newJob.experience}
                      onChange={e => setNewJob({ ...newJob, experience: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[10px] text-slate-400 mb-1">Target Close Date</label>
                    <input 
                      type="date"
                      value={newJob.target_date}
                      onChange={e => setNewJob({ ...newJob, target_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-slate-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button type="button" onClick={() => setShowAddJobModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs">Publish Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Candidate Modal */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Register New Candidate</h3>
              <button onClick={() => setShowAddCandidateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddCandidate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-semibold">
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">Candidate Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Swathi, Santhosh"
                    value={newCandidate.name}
                    onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase text-[10px] text-slate-400 mb-1">Degree / Qualification *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. B.Tech, B.Com, DCA"
                      value={newCandidate.degree}
                      onChange={e => setNewCandidate({ ...newCandidate, degree: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[10px] text-slate-400 mb-1">Location *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Vellore, Ambur"
                      value={newCandidate.location}
                      onChange={e => setNewCandidate({ ...newCandidate, location: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">College / University *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Annai Mira, VIT, Madras University"
                    value={newCandidate.college}
                    onChange={e => setNewCandidate({ ...newCandidate, college: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase text-[10px] text-slate-400 mb-1">Contact Phone *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 9344957123"
                      value={newCandidate.contact}
                      onChange={e => setNewCandidate({ ...newCandidate, contact: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-[10px] text-slate-400 mb-1">Interview Date *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 24/08/26"
                      value={newCandidate.interviewDate}
                      onChange={e => setNewCandidate({ ...newCandidate, interviewDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">Status</label>
                  <select 
                    value={newCandidate.status}
                    onChange={e => setNewCandidate({ ...newCandidate, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value="Selected">Selected</option>
                    <option value="On hold">On hold</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">Remarks / Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Interested for medical billing, Expected average salary..."
                    value={newCandidate.remarks}
                    onChange={e => setNewCandidate({ ...newCandidate, remarks: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-slate-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button type="button" onClick={() => setShowAddCandidateModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs">Save Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Milestone Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Record Career Milestone</h3>
              <button onClick={() => setShowAddEventModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddLifecycleEvent} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-semibold">
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">Employee Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newEvent.emp_name}
                    onChange={e => setNewEvent({ ...newEvent, emp_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">Employee ID (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. EMP-001"
                    value={newEvent.emp_id}
                    onChange={e => setNewEvent({ ...newEvent, emp_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">Milestone Category</label>
                  <select 
                    value={newEvent.type}
                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                  >
                    <option value="Promotion & Appraisal">Promotion & Appraisal</option>
                    <option value="Probation Confirmation">Probation Confirmation</option>
                    <option value="Department Transfer">Department Transfer</option>
                    <option value="Role Designation Adjustment">Role Designation Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-[10px] text-slate-400 mb-1">Milestone Details</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Details of salary revision, new designation, or team transfer..."
                    value={newEvent.detail}
                    onChange={e => setNewEvent({ ...newEvent, detail: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-slate-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button type="button" onClick={() => setShowAddEventModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs">Record Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TalentLifecyclePage;
