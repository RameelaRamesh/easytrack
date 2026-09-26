import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { 
  Building2, Save, Layers, Briefcase, Activity, Plus, X, 
  CheckCircle2, Clock, Globe, ShieldCheck, Tag
} from 'lucide-react';

const COMMON_INDUSTRIES = [
  'Professional Services',
  'Technology & Software',
  'Financial Services & BPO',
  'Operations & Logistics',
  'Healthcare & Life Sciences',
  'Manufacturing & Supply Chain',
  'Retail & E-Commerce',
  'Legal & Compliance Services',
  'Consulting & Advisory',
  'General Operations'
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'tasks' | 'metrics' | 'custom_fields'>('general');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 1. General & Organization Fields
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Professional Services');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [workingStart, setWorkingStart] = useState('09:00');
  const [workingEnd, setWorkingEnd] = useState('18:00');

  // 2. Configurable Taxonomy Lists
  const [departments, setDepartments] = useState<string[]>([
    'Operations', 'Quality Assurance', 'Human Resources', 'Management', 'Finance', 'Information Technology'
  ]);
  const [newDepartment, setNewDepartment] = useState('');

  const [designations, setDesignations] = useState<string[]>([
    'Operations Associate', 'Senior Operations Associate', 'Team Lead', 'Quality Analyst', 'HR Executive', 'Operations Manager', 'Administrator'
  ]);
  const [newDesignation, setNewDesignation] = useState('');

  // 3. Task Types & Workflows
  const [taskTypes, setTaskTypes] = useState<string[]>([
    'Data Processing', 'Verification & Audit', 'Deliverable Production', 'Quality Review', 'Client Follow-up', 'Documentation'
  ]);
  const [newTaskType, setNewTaskType] = useState('');

  const [workflows, setWorkflows] = useState<string[]>([
    'Standard SLA', 'Expedited Delivery', 'Quality Audit', 'Exception Resolution'
  ]);
  const [newWorkflow, setNewWorkflow] = useState('');

  // 4. Custom Fields
  const [customFields, setCustomFields] = useState<Record<string, string>>({
    'Project Code': 'Alpha-Numeric Code',
    'Billing Category': 'Standard Delivery'
  });
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // 5. Performance Metrics
  const [dailyVolumeTarget, setDailyVolumeTarget] = useState<number>(100);
  const [accuracyTarget, setAccuracyTarget] = useState<number>(98.5);
  const [slaComplianceTarget, setSlaComplianceTarget] = useState<number>(98);
  const [efficiencyTarget, setEfficiencyTarget] = useState<number>(95);


  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/organizations/settings/');
        const data = res.data;
        if (data) {
          setName(data.name || '');
          setIndustry(data.industry || 'Professional Services');
          setTimezone(data.timezone || 'Asia/Kolkata');
          setCurrency(data.currency || 'INR');
          setWorkingStart(data.working_hours?.start || '09:00');
          setWorkingEnd(data.working_hours?.end || '18:00');

          if (Array.isArray(data.departments) && data.departments.length > 0) {
            setDepartments(data.departments);
          }
          if (Array.isArray(data.designations) && data.designations.length > 0) {
            setDesignations(data.designations);
          }
          if (Array.isArray(data.task_types) && data.task_types.length > 0) {
            setTaskTypes(data.task_types);
          }
          if (Array.isArray(data.workflows) && data.workflows.length > 0) {
            setWorkflows(data.workflows);
          }
          if (data.custom_fields && typeof data.custom_fields === 'object') {
            setCustomFields(data.custom_fields);
          }
          if (data.performance_metrics) {
            if (data.performance_metrics.daily_volume_target !== undefined) {
              setDailyVolumeTarget(data.performance_metrics.daily_volume_target);
            }
            if (data.performance_metrics.accuracy_target !== undefined) {
              setAccuracyTarget(data.performance_metrics.accuracy_target);
            }
            if (data.performance_metrics.sla_compliance_target !== undefined) {
              setSlaComplianceTarget(data.performance_metrics.sla_compliance_target);
            }
            if (data.performance_metrics.efficiency_target !== undefined) {
              setEfficiencyTarget(data.performance_metrics.efficiency_target);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Helper methods to add/remove taxonomy items
  const addDepartment = () => {
    const trimmed = newDepartment.trim();
    if (trimmed && !departments.includes(trimmed)) {
      setDepartments([...departments, trimmed]);
      setNewDepartment('');
    }
  };

  const removeDepartment = (dept: string) => {
    setDepartments(departments.filter(d => d !== dept));
  };

  const addDesignation = () => {
    const trimmed = newDesignation.trim();
    if (trimmed && !designations.includes(trimmed)) {
      setDesignations([...designations, trimmed]);
      setNewDesignation('');
    }
  };

  const removeDesignation = (desg: string) => {
    setDesignations(designations.filter(d => d !== desg));
  };

  const addTaskType = () => {
    const trimmed = newTaskType.trim();
    if (trimmed && !taskTypes.includes(trimmed)) {
      setTaskTypes([...taskTypes, trimmed]);
      setNewTaskType('');
    }
  };

  const removeTaskType = (t: string) => {
    setTaskTypes(taskTypes.filter(x => x !== t));
  };

  const addWorkflow = () => {
    const trimmed = newWorkflow.trim();
    if (trimmed && !workflows.includes(trimmed)) {
      setWorkflows([...workflows, trimmed]);
      setNewWorkflow('');
    }
  };

  const removeWorkflow = (w: string) => {
    setWorkflows(workflows.filter(x => x !== w));
  };

  const addCustomField = () => {
    const k = newFieldKey.trim();
    if (k) {
      setCustomFields({ ...customFields, [k]: newFieldValue.trim() || 'Text' });
      setNewFieldKey('');
      setNewFieldValue('');
    }
  };

  const removeCustomField = (k: string) => {
    const copy = { ...customFields };
    delete copy[k];
    setCustomFields(copy);
  };

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
      departments,
      designations,
      task_types: taskTypes,
      workflows,
      custom_fields: customFields,
      performance_metrics: {
        daily_volume_target: Number(dailyVolumeTarget),
        accuracy_target: Number(accuracyTarget),
        sla_compliance_target: Number(slaComplianceTarget),
        efficiency_target: Number(efficiencyTarget),
      }
    };


    try {
      await apiClient.patch('/organizations/settings/', patchData);
      setMessage('Organization settings and operational taxonomy updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save settings. Please verify inputs.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-brand-primary-light text-brand-primary rounded-xl">
              <Building2 className="h-7 w-7 text-brand-primary dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Organization Configuration</h2>
              <p className="text-sm text-slate-500">Configure industry model, operational departments, designations, workflows, and performance metrics.</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary-light text-brand-primary border border-brand-primary/20">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Industry Neutral Core
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 mt-6 -mb-2 space-x-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'general'
                ? 'border-brand-primary text-brand-primary font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Globe className="w-4 h-4" />
            General & Industry
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'departments'
                ? 'border-brand-primary text-brand-primary font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Departments & Designations
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'tasks'
                ? 'border-brand-primary text-brand-primary font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            Task Types & Workflows
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'metrics'
                ? 'border-brand-primary text-brand-primary font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            Performance & SLA Metrics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom_fields')}
            className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'custom_fields'
                ? 'border-brand-primary text-brand-primary font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Tag className="w-4 h-4" />
            Custom Fields
          </button>
        </div>

      </div>

      {message && (
        <div className="flex items-center p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm rounded-xl">
          <CheckCircle2 className="h-5 w-5 mr-2 text-brand-primary flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: General & Industry */}
        {activeTab === 'general' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand-primary" />
              General Organization Identity & Work Timings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Organization Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Global Tech Solutions"
                  className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Industry Sector</label>
                <div className="mt-1.5 flex gap-2">
                  <select
                    value={COMMON_INDUSTRIES.includes(industry) ? industry : 'Other'}
                    onChange={(e) => {
                      if (e.target.value !== 'Other') {
                        setIndustry(e.target.value);
                      }
                    }}
                    className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                  >
                    {COMMON_INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                    <option value="Other">Custom / Other</option>
                  </select>
                </div>
                {!COMMON_INDUSTRIES.includes(industry) && (
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Enter custom industry"
                    className="mt-2 block w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Operational Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  required
                  placeholder="e.g. Asia/Kolkata or America/New_York"
                  className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Currency Code</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                  placeholder="e.g. INR or USD"
                  className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-gray-100 dark:border-slate-700/60">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-primary" />
                  Shift Start Time
                </label>
                <input
                  type="text"
                  value={workingStart}
                  onChange={(e) => setWorkingStart(e.target.value)}
                  required
                  placeholder="09:00"
                  className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-primary" />
                  Shift End Time
                </label>
                <input
                  type="text"
                  value={workingEnd}
                  onChange={(e) => setWorkingEnd(e.target.value)}
                  required
                  placeholder="18:00"
                  className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Departments & Designations */}
        {activeTab === 'departments' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm space-y-8">
            {/* Departments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-brand-primary" />
                  Configurable Departments
                </h3>
                <span className="text-xs text-slate-400">{departments.length} configured</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Define organizational departments used for employee allocation, metrics, and role mapping.</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {departments.map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary-light text-brand-primary border border-brand-primary/20"
                  >
                    <Tag className="w-3 h-3 text-brand-primary" />
                    {dept}
                    <button
                      type="button"
                      onClick={() => removeDepartment(dept)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition"
                      title="Remove department"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDepartment(); } }}
                  placeholder="New department name (e.g. Research & Development)..."
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
                <button
                  type="button"
                  onClick={addDepartment}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Department
                </button>
              </div>
            </div>

            {/* Designations */}
            <div className="pt-6 border-t border-gray-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-brand-primary" />
                  Configurable Designations & Titles
                </h3>
                <span className="text-xs text-slate-400">{designations.length} configured</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Define titles and designations assigned to employees across departments.</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {designations.map((desg) => (
                  <span
                    key={desg}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                  >
                    {desg}
                    <button
                      type="button"
                      onClick={() => removeDesignation(desg)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition"
                      title="Remove designation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDesignation(); } }}
                  placeholder="New designation (e.g. Lead Solutions Architect)..."
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
                <button
                  type="button"
                  onClick={addDesignation}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Designation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Task Types & Workflows */}
        {activeTab === 'tasks' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm space-y-8">
            {/* Task Types */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-primary" />
                  Configurable Work & Task Types
                </h3>
                <span className="text-xs text-slate-400">{taskTypes.length} configured</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Categories used for allocating deliverables, operations queue items, and tracking daily output.</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {taskTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() => removeTaskType(type)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition"
                      title="Remove task type"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTaskType(); } }}
                  placeholder="New task type (e.g. Policy Review, Account Reconciliation)..."
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
                <button
                  type="button"
                  onClick={addTaskType}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Task Type
                </button>
              </div>
            </div>

            {/* Workflows */}
            <div className="pt-6 border-t border-gray-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-primary" />
                  Configurable Workflows & SLA Tiers
                </h3>
                <span className="text-xs text-slate-400">{workflows.length} configured</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Standardized operational processes and turnaround pipelines for organization work items.</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {workflows.map((wf) => (
                  <span
                    key={wf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary-light text-brand-primary border border-brand-primary/20"
                  >
                    {wf}
                    <button
                      type="button"
                      onClick={() => removeWorkflow(wf)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition"
                      title="Remove workflow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWorkflow}
                  onChange={(e) => setNewWorkflow(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addWorkflow(); } }}
                  placeholder="New workflow pipeline (e.g. Critical 4-Hour Expedited)..."
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
                <button
                  type="button"
                  onClick={addWorkflow}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Workflow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Performance & Metrics */}
        {activeTab === 'metrics' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-primary" />
              Organizational Performance & Quality Benchmarks
            </h3>
            <p className="text-xs text-slate-500">Configure global target benchmarks used to compute team efficiency, SLA adherence, and QA scores.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Production Target (Items / Day)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={dailyVolumeTarget}
                  onChange={(e) => setDailyVolumeTarget(Number(e.target.value))}
                  required
                  className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Expected work items completed per employee per shift.</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quality / Accuracy Target (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="100"
                  value={accuracyTarget}
                  onChange={(e) => setAccuracyTarget(Number(e.target.value))}
                  required
                  className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Minimum acceptable QA compliance rate.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">SLA Compliance Target (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="100"
                  value={slaComplianceTarget}
                  onChange={(e) => setSlaComplianceTarget(Number(e.target.value))}
                  required
                  className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Target turnaround within agreed customer SLA.</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Shift Efficiency Benchmark (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="100"
                  value={efficiencyTarget}
                  onChange={(e) => setEfficiencyTarget(Number(e.target.value))}
                  required
                  className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Ratio of productive working hours to clocked hours.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Custom Fields */}
        {activeTab === 'custom_fields' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-primary" />
                Configurable Organization Custom Fields
              </h3>
              <p className="text-xs text-slate-500 mt-1">Define custom metadata keys and field attributes for work items, clients, and deliverables.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Field Name (e.g. Account Number, SLA Tier)"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <input
                type="text"
                placeholder="Default / Format (e.g. Text, Select, Number)"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <button
                type="button"
                onClick={addCustomField}
                className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Field Key</th>
                    <th className="p-3">Description / Data Format</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {Object.entries(customFields).map(([key, val]) => (
                    <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{key}</td>
                      <td className="p-3 text-slate-500">{val}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeCustomField(key)}
                          className="text-rose-500 hover:text-rose-700 font-semibold p-1 hover:bg-rose-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Object.keys(customFields).length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400">
                        No custom fields configured yet. Add fields above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Global Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center justify-center py-3 px-6 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Organization Configurations
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
