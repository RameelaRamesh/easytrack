import React, { useState } from 'react';
import { 
  UserPlus, Activity, Clock, Award, HelpCircle, FileDigit, DollarSign, LogOut, Laptop,
  Megaphone, BookOpen, TrendingUp, ShieldCheck, Cpu, Play, CheckCircle2, AlertCircle, Plus, Search, Filter, Calendar, CheckSquare, Trash2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';

interface ModulePreviewPageProps {
  module: string;
}

export const ModulePreviewPage: React.FC<ModulePreviewPageProps> = ({ module }) => {
  // Common states
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Trigger notification utility
  const triggerNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // --- MODULE 1: RECRUITMENT ---
  const [candidates, setCandidates] = useState([
    { id: 'CAN-101', name: 'Aarav Mehta', role: 'Medical Coder', stage: 'Interview', date: '2026-08-25', score: 85 },
    { id: 'CAN-102', name: 'Priya Sharma', role: 'Billing Specialist', stage: 'Screening', date: '2026-08-26', score: 72 },
    { id: 'CAN-103', name: 'Rohan Verma', role: 'AR Associate', stage: 'Offer Sent', date: '2026-08-24', score: 90 },
    { id: 'CAN-104', name: 'Sneha Patil', role: 'QA Analyst', stage: 'Joining Delayed', date: '2026-08-20', score: 94 }
  ]);
  const [newCandName, setNewCandName] = useState('');
  const [newCandRole, setNewCandRole] = useState('Medical Coder');

  const addCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandName.trim()) return;
    const newCand = {
      id: `CAN-${Math.floor(100 + Math.random() * 900)}`,
      name: newCandName,
      role: newCandRole,
      stage: 'Screening',
      date: new Date().toISOString().split('T')[0],
      score: Math.floor(65 + Math.random() * 35)
    };
    setCandidates([newCand, ...candidates]);
    setNewCandName('');
    triggerNotification(`Candidate ${newCandName} has been successfully added to the pipeline.`);
  };

  // --- MODULE 2: EMPLOYEE LIFECYCLE ---
  const [lifecycleEvents, setLifecycleEvents] = useState([
    { id: 'EV-1', name: 'Neha Joshi', type: 'Designation Change', detail: 'Billing Analyst ➔ Senior Billing Executive', date: '2026-08-15', status: 'Approved' },
    { id: 'EV-2', name: 'Vikram Singh', type: 'Probation Confirmation', detail: 'Probation completed (Score: 92%)', date: '2026-08-18', status: 'Approved' },
    { id: 'EV-3', name: 'Aditya Rao', type: 'Department Transfer', detail: 'Operations ➔ Quality Assurance', date: '2026-09-01', status: 'Pending Approval' }
  ]);
  const [newEventName, setNewEventName] = useState('');
  const [newEventType, setNewEventType] = useState('Promotion');
  const [newEventDetail, setNewEventDetail] = useState('');

  const triggerLifecycleEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    const ev = {
      id: `EV-${lifecycleEvents.length + 1}`,
      name: newEventName,
      type: newEventType,
      detail: newEventDetail || 'Updated parameters manually.',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending Approval'
    };
    setLifecycleEvents([ev, ...lifecycleEvents]);
    setNewEventName('');
    setNewEventDetail('');
    triggerNotification(`Lifecycle update registered for ${newEventName}.`);
  };

  // --- MODULE 3: SHIFT & ROSTER ---
  const [shifts, setShifts] = useState([
    { id: 'SH-1', name: 'Day Shift', timing: '09:00 AM ➔ 06:00 PM', grace: '15 mins', OT: '1.5x after 9 hrs' },
    { id: 'SH-2', name: 'Evening Shift', timing: '02:00 PM ➔ 11:00 PM', grace: '15 mins', OT: '1.5x after 9 hrs' },
    { id: 'SH-3', name: 'Night Shift', timing: '09:00 PM ➔ 06:00 AM', grace: '20 mins', OT: '2.0x after 8 hrs' }
  ]);
  const [activeRoster, setActiveRoster] = useState([
    { employee: 'Ananya Sen', shift: 'Day Shift', status: 'On Time' },
    { employee: 'Rahul Gupta', shift: 'Evening Shift', status: 'Late Check-in' },
    { employee: 'Karan Malhotra', shift: 'Night Shift', status: 'Absent' }
  ]);
  const [rosterEmp, setRosterEmp] = useState('');
  const [rosterShift, setRosterShift] = useState('Day Shift');

  const allocateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterEmp.trim()) return;
    setActiveRoster([{ employee: rosterEmp, shift: rosterShift, status: 'Scheduled' }, ...activeRoster]);
    setRosterEmp('');
    triggerNotification(`Shift ${rosterShift} assigned to ${rosterEmp}.`);
  };

  // --- MODULE 4: PERFORMANCE ---
  const [kpis, setKpis] = useState([
    { id: 'KPI-1', goal: 'Denial Resolution Rate', target: '95% resolution', weight: '40%', status: 'On Track' },
    { id: 'KPI-2', goal: 'Daily Claim Entry Speed', target: '65 claims / day', weight: '30%', status: 'At Risk' },
    { id: 'KPI-3', goal: 'QA Posting Accuracy', target: '99.0% accuracy', weight: '30%', status: 'Exceeding' }
  ]);
  const [newGoal, setNewGoal] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const createGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    setKpis([...kpis, {
      id: `KPI-${kpis.length + 1}`,
      goal: newGoal,
      target: newGoalTarget || 'No parameters set',
      weight: '25%',
      status: 'On Track'
    }]);
    setNewGoal('');
    setNewGoalTarget('');
    triggerNotification(`Goal "${newGoal}" has been registered in the appraisal system.`);
  };

  // --- MODULE 5: HELPDESK ---
  const [tickets, setTickets] = useState([
    { id: 'REQ-101', requester: 'Meera Joshi', title: 'Salary slip error (July)', category: 'Payroll Clarification', priority: 'High', status: 'Open' },
    { id: 'REQ-102', requester: 'Siddharth Sen', title: 'Home address change request', category: 'Address Update', priority: 'Low', status: 'Resolved' },
    { id: 'REQ-103', requester: 'Kabir Dev', title: 'Leave balance adjustment query', category: 'Leave Correction', priority: 'Medium', status: 'In Progress' }
  ]);
  const [reqTitle, setReqTitle] = useState('');
  const [reqCat, setReqCat] = useState('Payroll Clarification');

  const fileRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;
    const tick = {
      id: `REQ-${Math.floor(104 + Math.random() * 900)}`,
      requester: 'Current User',
      title: reqTitle,
      category: reqCat,
      priority: 'Medium',
      status: 'Open'
    };
    setTickets([tick, ...tickets]);
    setReqTitle('');
    triggerNotification(`Helpdesk ticket submitted successfully. Ticket ID: ${tick.id}`);
  };

  // --- MODULE 6: DOCUMENTS ---
  const [documents, setDocuments] = useState([
    { name: 'Aadhaar_Card_Verify.pdf', size: '1.2 MB', category: 'Identity Proof', date: '2026-08-10', status: 'Verified' },
    { name: 'Degree_Certificate_Final.pdf', size: '2.4 MB', category: 'Education Document', date: '2026-08-12', status: 'Verified' },
    { name: 'Relieving_Letter_Previous.pdf', size: '980 KB', category: 'Experience Certificate', date: '2026-08-25', status: 'Under Verification' }
  ]);
  const [uploadCat, setUploadCat] = useState('Identity Proof');

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = {
      name: `User_Upload_${Date.now().toString().slice(-4)}.pdf`,
      size: '1.5 MB',
      category: uploadCat,
      date: new Date().toISOString().split('T')[0],
      status: 'Uploaded'
    };
    setDocuments([doc, ...documents]);
    triggerNotification(`Document uploaded for category: ${uploadCat}`);
  };

  // --- MODULE 7: PAYROLL ENGINE ---
  const [payrollLock, setPayrollLock] = useState(false);
  const [payslips, setPayslips] = useState([
    { empId: 'EMP-005', name: 'Neelam Gupta', base: 30000, incentive: 1200, overtime: 450, tax: 3500, net: 28150 },
    { empId: 'EMP-004', name: 'Vikram Rathore', base: 50000, incentive: 2000, overtime: 0, tax: 6000, net: 46000 },
    { empId: 'EMP-003', name: 'Sanjay Sharma', base: 80000, incentive: 0, overtime: 0, tax: 12000, net: 68000 }
  ]);

  // --- MODULE 8: OFFBOARDING ---
  const [offboardings, setOffboardings] = useState([
    { empId: 'EMP-089', name: 'Amit Roy', status: 'Notice Period', date: '2026-09-30', handover: '80%', assets: 'Pending Return', access: 'Active' },
    { empId: 'EMP-092', name: 'Kiran Sen', status: 'Cleared', date: '2026-08-20', handover: '100%', assets: 'Returned', access: 'Revoked' }
  ]);

  // --- MODULE 9: ASSETS ---
  const [assets, setAssets] = useState([
    { id: 'LAP-1022', type: 'Laptop (ThinkPad L14)', serial: 'SN-998822A', assignedTo: 'Neelam Gupta', date: '2026-02-15', condition: 'Excellent' },
    { id: 'MON-3344', type: 'Dell 24" Monitor', serial: 'SN-110022B', assignedTo: 'Vikram Rathore', date: '2025-11-20', condition: 'Good' },
    { id: 'HD-9088', type: 'Jabra Evolve Headset', serial: 'SN-556677X', assignedTo: 'Employee 2', date: '2026-04-10', condition: 'Minor Scratches' }
  ]);
  const [newAssetType, setNewAssetType] = useState('Laptop');
  const [newAssetAss, setNewAssetAss] = useState('');

  const registerAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetAss.trim()) return;
    const code = newAssetType.substring(0, 3).toUpperCase();
    const ass = {
      id: `${code}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: `${newAssetType} (Standard Issue)`,
      serial: `SN-${Math.floor(100000 + Math.random() * 900000)}X`,
      assignedTo: newAssetAss,
      date: new Date().toISOString().split('T')[0],
      condition: 'Excellent'
    };
    setAssets([ass, ...assets]);
    setNewAssetAss('');
    triggerNotification(`Asset ${ass.id} has been cataloged and assigned.`);
  };

  // --- MODULE 10: ANNOUNCEMENTS ---
  const [announcements, setAnnouncements] = useState([
    { id: 'AN-1', title: 'Independence Day Holiday Schedule', summary: 'All office operational lines will be closed on August 15.', date: '2026-08-12', author: 'Aditi Sharma (HR Lead)', target: 'All Employees' },
    { id: 'AN-2', title: 'New Claims SOP Implementation', summary: 'Claims processing steps have been updated for Apex client.', date: '2026-08-20', author: 'Sanjay Sharma (Ops Head)', target: 'Claims Department' }
  ]);
  const [annTitle, setAnnTitle] = useState('');
  const [annText, setAnnText] = useState('');

  const publishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annText.trim()) return;
    const ann = {
      id: `AN-${announcements.length + 1}`,
      title: annTitle,
      summary: annText,
      date: new Date().toISOString().split('T')[0],
      author: 'HR Management',
      target: 'All Employees'
    };
    setAnnouncements([ann, ...announcements]);
    setAnnTitle('');
    setAnnText('');
    triggerNotification('Announcement published and sent via email/chat logs.');
  };

  // --- MODULE 11: KNOWLEDGE BASE ---
  const [kbArticles, setKbArticles] = useState([
    { id: 'KB-1', title: 'Apex Claims Processing Steps', section: 'Claims Processing', views: 182, tags: ['Apex', 'Billing'] },
    { id: 'KB-2', title: 'Denial Codes Reference Guide', section: 'Denial Management', views: 320, tags: ['Denial', 'SOP'] },
    { id: 'KB-3', title: 'Eligibility Verification Checklist', section: 'Eligibility Check', views: 95, tags: ['Eligibility'] }
  ]);
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbSec, setNewKbSec] = useState('Claims Processing');

  const addKbArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbTitle.trim()) return;
    setKbArticles([...kbArticles, {
      id: `KB-${kbArticles.length + 1}`,
      title: newKbTitle,
      section: newKbSec,
      views: 0,
      tags: ['Manual']
    }]);
    setNewKbTitle('');
    triggerNotification('New knowledge base draft created.');
  };

  // --- MODULE 12: MEDICAL BILLING METRICS ---
  const metricsData = [
    { name: 'Mon', claims: 450, accuracy: 98.2 },
    { name: 'Tue', claims: 520, accuracy: 98.5 },
    { name: 'Wed', claims: 580, accuracy: 99.1 },
    { name: 'Thu', claims: 610, accuracy: 98.7 },
    { name: 'Fri', claims: 590, accuracy: 98.9 }
  ];

  // --- MODULE 13: QUALITY MANAGEMENT ---
  const [qaSamples, setQaSamples] = useState([
    { id: 'QA-889', claimId: 'CLM-90988', process: 'Apex Claim Verification', checkedBy: 'Kiran Sen', errors: 0, score: 100, status: 'Passed' },
    { id: 'QA-890', claimId: 'CLM-90112', process: 'Beacon Posting', checkedBy: 'Kiran Sen', errors: 2, score: 85, status: 'Rework Required' }
  ]);
  const [auditClaim, setAuditClaim] = useState('');
  const [auditErrors, setAuditErrors] = useState(0);

  const performAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditClaim.trim()) return;
    const score = Math.max(0, 100 - (auditErrors * 10));
    setQaSamples([...qaSamples, {
      id: `QA-${Math.floor(891 + Math.random() * 200)}`,
      claimId: auditClaim,
      process: 'Apex Claim Verification',
      checkedBy: 'Current Auditor',
      errors: auditErrors,
      score: score,
      status: score >= 90 ? 'Passed' : 'Rework Required'
    }]);
    setAuditClaim('');
    setAuditErrors(0);
    triggerNotification('QA Claims audit result calculated and saved.');
  };

  // --- MODULE 14: WORKFLOW AUTOMATION ---
  const [automationRules, setAutomationRules] = useState([
    { id: 'R-1', trigger: 'SLA consumes 80%', action: 'Alert Team Lead via Slack/Notification', status: 'Active' },
    { id: 'R-2', trigger: 'QA Accuracy falls below 95%', action: 'Auto-assign target review checklist and notify TL', status: 'Active' },
    { id: 'R-3', trigger: 'Incentive target exceeded by 20%', action: 'Queue payroll extra incentive ledger entry', status: 'Active' }
  ]);
  const [newRuleTrigger, setNewRuleTrigger] = useState('SLA consumes 90%');
  const [newRuleAction, setNewRuleAction] = useState('Email Operations Head');

  const addRule = (e: React.FormEvent) => {
    e.preventDefault();
    setAutomationRules([...automationRules, {
      id: `R-${automationRules.length + 1}`,
      trigger: newRuleTrigger,
      action: newRuleAction,
      status: 'Active'
    }]);
    triggerNotification('Automated rule active in workflow engine.');
  };


  // Define render helper by module type
  const renderModuleInterface = () => {
    switch (module) {
      case 'recruitment':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Candidate Tracking Pipeline</h3>
                <span className="text-xs bg-brand-primary-light text-brand-primary px-2.5 py-0.5 rounded-full font-bold">Total: {candidates.length}</span>
              </div>
              <div className="space-y-3">
                {candidates.map(cand => (
                  <div key={cand.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl flex justify-between items-center hover:shadow-sm transition">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{cand.name}</span>
                        <span className="text-[10px] bg-gray-200 dark:bg-slate-750 text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded font-mono">{cand.id}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{cand.role} • Score: {cand.score}%</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        cand.stage === 'Offer Sent' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200' :
                        cand.stage === 'Interview' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200'
                      }`}>
                        {cand.stage}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">Applied: {cand.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Add New Candidate</h4>
              <form onSubmit={addCandidate} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-450 uppercase mb-1">Candidate Name</label>
                  <input 
                    type="text" 
                    value={newCandName} 
                    onChange={e => setNewCandName(e.target.value)} 
                    placeholder="Enter name"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Applying Role</label>
                  <select 
                    value={newCandRole} 
                    onChange={e => setNewCandRole(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Medical Coder">Medical Coder</option>
                    <option value="Billing Specialist">Billing Specialist</option>
                    <option value="AR Associate">AR Associate</option>
                    <option value="QA Analyst">QA Analyst</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors flex justify-center items-center">
                  <Plus className="h-4 w-4 mr-1.5" /> Track Candidate
                </button>
              </form>
              <div className="border-t border-gray-200 dark:border-slate-750 pt-4 mt-2">
                <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider mb-2">Metrics Summary</p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded border border-gray-100 dark:border-slate-750">
                    <p className="text-[9px] text-slate-400">Time-to-Hire</p>
                    <p className="text-base font-bold text-slate-905 dark:text-white">18 Days</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded border border-gray-100 dark:border-slate-750">
                    <p className="text-[9px] text-slate-400">Active Openings</p>
                    <p className="text-base font-bold text-slate-905 dark:text-white">4 Positions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'lifecycle':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Employee Career History</h3>
              <div className="space-y-3">
                {lifecycleEvents.map(ev => (
                  <div key={ev.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl hover:shadow-sm transition space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white">{ev.name}</span>
                        <span className="text-[9px] bg-brand-primary-light text-brand-primary px-2 py-0.2 rounded font-semibold capitalize">{ev.type}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{ev.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-350">{ev.detail}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                      <span className="text-slate-400">Status: <strong className="text-slate-700 dark:text-slate-200 font-bold">{ev.status}</strong></span>
                      {ev.status === 'Pending Approval' && (
                        <button 
                          onClick={() => {
                            setLifecycleEvents(lifecycleEvents.map(e => e.id === ev.id ? {...e, status: 'Approved'} : e));
                            triggerNotification(`Lifecycle update for ${ev.name} was approved!`);
                          }}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold transition"
                        >
                          Approve Action
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Register Career Event</h4>
              <form onSubmit={triggerLifecycleEvent} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Employee Name</label>
                  <input 
                    type="text" 
                    value={newEventName} 
                    onChange={e => setNewEventName(e.target.value)} 
                    placeholder="E.g. Neelam Gupta"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Event Type</label>
                  <select 
                    value={newEventType} 
                    onChange={e => setNewEventType(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Promotion">Promotion/Designation Change</option>
                    <option value="Department Transfer">Department Transfer</option>
                    <option value="Probation Completed">Probation Completed</option>
                    <option value="Notice Period Start">Notice Period Start</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Event Details</label>
                  <textarea 
                    value={newEventDetail} 
                    onChange={e => setNewEventDetail(e.target.value)} 
                    placeholder="Details about promotion or transfer"
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors">
                  Submit Event
                </button>
              </form>
            </div>
          </div>
        );

      case 'scheduling':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Active Shift Roster</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {shifts.map(sh => (
                  <div key={sh.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl space-y-1 hover:shadow transition">
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{sh.id}</span>
                    <h4 className="font-bold text-slate-850 dark:text-white text-sm">{sh.name}</h4>
                    <p className="text-xs text-slate-655 dark:text-slate-400 font-medium">{sh.timing}</p>
                    <p className="text-[10px] text-slate-400 mt-2">Grace: {sh.grace} • OT: {sh.OT}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-750 pt-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-455 uppercase tracking-wide">Allocations Summary</h4>
                <div className="space-y-2">
                  {activeRoster.map((ro, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center border border-gray-50 dark:border-slate-750 text-xs font-semibold">
                      <span className="text-slate-805 dark:text-white">{ro.employee}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-normal">{ro.shift}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          ro.status === 'On Time' ? 'bg-emerald-50 text-emerald-700' :
                          ro.status === 'Scheduled' ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-rose-700'
                        }`}>{ro.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Assign shift roster</h4>
              <form onSubmit={allocateShift} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Employee Name</label>
                  <input 
                    type="text" 
                    value={rosterEmp} 
                    onChange={e => setRosterEmp(e.target.value)} 
                    placeholder="Enter employee name"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Shift Profile</label>
                  <select 
                    value={rosterShift} 
                    onChange={e => setRosterShift(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Day Shift">Day Shift (09:00 - 18:00)</option>
                    <option value="Evening Shift">Evening Shift (14:00 - 23:00)</option>
                    <option value="Night Shift">Night Shift (21:00 - 06:00)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors">
                  Assign shift
                </button>
              </form>
              <div className="p-3.5 bg-yellow-50 dark:bg-slate-800/40 rounded-lg border border-yellow-200 dark:border-slate-750">
                <p className="text-[10px] font-bold text-yellow-800 dark:text-yellow-450 leading-relaxed uppercase flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" /> Shift rules in effect
                </p>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">Weekend configurations, late check-in penalties and grace timings are managed in HR Portal configurations.</p>
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Active KPI & Goals</h3>
              <div className="space-y-3">
                {kpis.map(kp => (
                  <div key={kp.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl hover:shadow transition flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 font-mono">{kp.id}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{kp.goal}</h4>
                      </div>
                      <p className="text-xs text-slate-500">Target: {kp.target} • Weight: {kp.weight}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      kp.status === 'Exceeding' ? 'bg-emerald-50 text-emerald-700' :
                      kp.status === 'On Track' ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'
                    }`}>{kp.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Create appraisal goal</h4>
              <form onSubmit={createGoal} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Goal / Objective</label>
                  <input 
                    type="text" 
                    value={newGoal} 
                    onChange={e => setNewGoal(e.target.value)} 
                    placeholder="E.g. Reduce Claims Rejections"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Measurement Target</label>
                  <input 
                    type="text" 
                    value={newGoalTarget} 
                    onChange={e => setNewGoalTarget(e.target.value)} 
                    placeholder="E.g. Rejection rate below 2.0%"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors">
                  Assign Goal KPI
                </button>
              </form>
            </div>
          </div>
        );

      case 'helpdesk':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tickets Dashboard</h3>
              <div className="space-y-3">
                {tickets.map(tick => (
                  <div key={tick.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl hover:shadow-sm transition flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 font-mono">{tick.id}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{tick.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500">Requester: {tick.requester} • Category: {tick.category}</p>
                    </div>
                    <div className="text-right space-y-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tick.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' :
                        tick.status === 'In Progress' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>{tick.status}</span>
                      <p className="text-[9px] text-slate-400">Priority: {tick.priority}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Submit Helpdesk Request</h4>
              <form onSubmit={fileRequest} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Request Summary / Title</label>
                  <input 
                    type="text" 
                    value={reqTitle} 
                    onChange={e => setReqTitle(e.target.value)} 
                    placeholder="Enter issue detail"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">HR Request Category</label>
                  <select 
                    value={reqCat} 
                    onChange={e => setReqCat(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Payroll Clarification">Salary Slip / Payroll Clarification</option>
                    <option value="Address Update">Personal Info / Address Update</option>
                    <option value="Experience Letter">Service / Experience Letter Request</option>
                    <option value="Attendance Correction">Attendance / Leave Correction</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors">
                  File Ticket
                </button>
              </form>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Employee Documents Repository</h3>
              <div className="space-y-3">
                {documents.map((doc, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl flex justify-between items-center hover:shadow transition">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-805 dark:text-white text-sm">{doc.name}</h4>
                      <p className="text-xs text-slate-500">{doc.category} • {doc.size}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>{doc.status}</span>
                      <p className="text-[9px] text-slate-400 font-mono">Uploaded: {doc.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Upload document</h4>
              <form onSubmit={handleUpload} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Document Category</label>
                  <select 
                    value={uploadCat} 
                    onChange={e => setUploadCat(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Identity Proof">Identity Proof (Aadhaar/PAN/Passport)</option>
                    <option value="Education Document">Degree & Certificates</option>
                    <option value="Experience Certificate">Experience / Relieving Letters</option>
                    <option value="Bank Document">Cancelled Cheque / Passbook</option>
                  </select>
                </div>
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 text-center text-xs space-y-2">
                  <p className="text-slate-400">PDF, JPG, PNG format accepted (Max 5MB)</p>
                  <span className="inline-block px-3 py-1 bg-white dark:bg-slate-800 text-slate-655 border border-gray-250 dark:border-slate-700 rounded font-bold cursor-pointer hover:bg-slate-100">
                    Select File
                  </span>
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors">
                  Upload PDF Document
                </button>
              </form>
            </div>
          </div>
        );

      case 'payroll-processing':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-brand-primary-light border border-brand-primary/30 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs font-bold text-brand-primary uppercase">Active Payroll Period: August 2026</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Calculated wages based on actual attendance inputs, approved leave adjustments, overtime schedules, and incentivization metrics.</p>
              </div>
              <button 
                onClick={() => {
                  setPayrollLock(!payrollLock);
                  triggerNotification(payrollLock ? 'Payroll unlocked for changes.' : 'Payroll locked. Payslips auto-generated and dispatched.');
                }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                  payrollLock ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {payrollLock ? 'Unlock Payroll Processing' : 'Approve & Lock Payroll'}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/80">
                <h4 className="font-bold text-slate-800 dark:text-white">Wage Ledger Entries</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-550 uppercase tracking-wider text-[9px] font-bold">
                    <tr>
                      <th className="p-4">Emp ID</th>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Base Salary</th>
                      <th className="p-4">Incentives</th>
                      <th className="p-4">Overtime (OT)</th>
                      <th className="p-4">Taxes & Deduct.</th>
                      <th className="p-4 text-right">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-slate-750 font-semibold">
                    {payslips.map(ps => (
                      <tr key={ps.empId} className="hover:bg-slate-50/55 dark:hover:bg-slate-750/30">
                        <td className="p-4 font-mono">{ps.empId}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{ps.name}</td>
                        <td className="p-4">₹{ps.base.toLocaleString()}</td>
                        <td className="p-4 text-emerald-600">+₹{ps.incentive}</td>
                        <td className="p-4 text-emerald-600">+₹{ps.overtime}</td>
                        <td className="p-4 text-rose-600">-₹{ps.tax}</td>
                        <td className="p-4 text-right font-bold">₹{ps.net.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'offboarding':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Offboarding Clearance Pipeline</h3>
              <div className="space-y-3">
                {offboardings.map(ob => (
                  <div key={ob.empId} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl space-y-3 hover:shadow-sm transition">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{ob.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">{ob.empId}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        ob.status === 'Cleared' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-750'
                      }`}>{ob.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                      <div>
                        <p className="text-[9px] uppercase text-slate-400">Handover</p>
                        <p className="font-bold mt-0.5">{ob.handover}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-slate-400">IT Clearance</p>
                        <p className="font-bold mt-0.5">{ob.assets}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-slate-400">System Sessions</p>
                        <p className="font-bold mt-0.5">{ob.access}</p>
                      </div>
                    </div>
                    {ob.status === 'Notice Period' && (
                      <div className="flex justify-end pt-2">
                        <button 
                          onClick={() => {
                            setOffboardings(offboardings.map(o => o.empId === ob.empId ? {...o, status: 'Cleared', assets: 'Returned', access: 'Revoked', handover: '100%'} : o));
                            triggerNotification(`Offboarding clearance complete. Security protocols executed.`);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                        >
                          Revoke Access & Clear
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Security Exit Protocols</h4>
              <div className="text-xs text-slate-500 leading-relaxed space-y-2 font-medium">
                <p>When an employee is cleared, EasyTrack automatically:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Disables user login immediately</li>
                  <li>Kills active session cookies</li>
                  <li>Revokes multi-tenant database keys</li>
                  <li>Triggers audit record logging</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'assets':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Device & Hardware Inventory</h3>
              <div className="space-y-3">
                {assets.map(ass => (
                  <div key={ass.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl hover:shadow-sm transition flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white">{ass.type}</span>
                        <span className="text-[9px] bg-slate-200 dark:bg-slate-750 text-slate-500 px-1.5 rounded font-mono font-bold">{ass.id}</span>
                      </div>
                      <p className="text-xs text-slate-500">Assigned To: {ass.assignedTo} • Serial: {ass.serial}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">{ass.condition}</span>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">Issued: {ass.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Issue asset to staff</h4>
              <form onSubmit={registerAsset} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Asset Category</label>
                  <select 
                    value={newAssetType} 
                    onChange={e => setNewAssetType(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Laptop (ThinkPad L14)">Laptop (ThinkPad L14)</option>
                    <option value="Dell 24-inch Monitor">Dell 24" Monitor</option>
                    <option value="Jabra Evolve Headset">Jabra Evolve Headset</option>
                    <option value="Desktop PC">Desktop Workstation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Assign to Staff Name</label>
                  <input 
                    type="text" 
                    value={newAssetAss} 
                    onChange={e => setNewAssetAss(e.target.value)} 
                    placeholder="E.g. Neelam Gupta"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors">
                  Assign Hardware Device
                </button>
              </form>
            </div>
          </div>
        );

      case 'announcements':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Announcements Feed</h3>
              <div className="space-y-3">
                {announcements.map(ann => (
                  <div key={ann.id} className="p-5 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl space-y-2 hover:shadow transition">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>Posted by {ann.author}</span>
                      <span>Target: {ann.target}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base leading-normal">{ann.title}</h4>
                    <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed font-normal">{ann.summary}</p>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                      <span>Date: {ann.date}</span>
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Delivered</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Publish Notice</h4>
              <form onSubmit={publishAnnouncement} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Announcement Title</label>
                  <input 
                    type="text" 
                    value={annTitle} 
                    onChange={e => setAnnTitle(e.target.value)} 
                    placeholder="Enter short title"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Announcement text</label>
                  <textarea 
                    value={annText} 
                    onChange={e => setAnnText(e.target.value)} 
                    placeholder="Enter context, holiday updates or SOP bulletins..."
                    rows={4}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors">
                  Publish Announcement
                </button>
              </form>
            </div>
          </div>
        );

      case 'knowledge-base':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search claim processing, AR manuals, denial check-lists..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-3">
                {kbArticles
                  .filter(art => art.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(art => (
                    <div key={art.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl hover:shadow transition flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">{art.id}</span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{art.title}</h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {art.tags.map((tg, idx) => (
                            <span key={idx} className="bg-slate-200 dark:bg-slate-750 text-slate-500 text-[9px] px-1.5 py-0.2 rounded">{tg}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-medium">
                        <p>{art.section}</p>
                        <p className="mt-1">{art.views} Views</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Publish SOP SOP / Article</h4>
              <form onSubmit={addKbArticle} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Article Title</label>
                  <input 
                    type="text" 
                    value={newKbTitle} 
                    onChange={e => setNewKbTitle(e.target.value)} 
                    placeholder="E.g. Medicare claims eligibility"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Section Folder</label>
                  <select 
                    value={newKbSec} 
                    onChange={e => setNewKbSec(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Claims Processing">Claims Processing</option>
                    <option value="Denial Management">Denial Management</option>
                    <option value="Eligibility Check">Eligibility Check</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors">
                  Create KB Draft
                </button>
              </form>
            </div>
          </div>
        );

      case 'billing-metrics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-250 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] uppercase text-slate-450 font-bold">Total Daily Output</span>
                <h4 className="text-xl font-extrabold mt-1 text-slate-905 dark:text-white">582 Claims</h4>
                <span className="text-[9px] text-emerald-600 font-semibold mt-1">▲ 8% vs yesterday</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-250 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] uppercase text-slate-450 font-bold">First Pass Rate</span>
                <h4 className="text-xl font-extrabold mt-1 text-slate-905 dark:text-white">98.8% Acc</h4>
                <span className="text-[9px] text-emerald-600 font-semibold mt-1">▲ 0.2% vs target</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-250 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] uppercase text-slate-450 font-bold">Audit Denial Rate</span>
                <h4 className="text-xl font-extrabold mt-1 text-rose-600">1.2% Rate</h4>
                <span className="text-[9px] text-slate-400 mt-1">Industry standard: 5%</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-250 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] uppercase text-slate-450 font-bold">SLA Turnaround</span>
                <h4 className="text-xl font-extrabold mt-1 text-slate-905 dark:text-white">12.4 Hours</h4>
                <span className="text-[9px] text-emerald-600 font-semibold mt-1">Within 24-hr threshold</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-250 dark:border-slate-700 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Claims Processing Productivity (Daily trend)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="claims" stroke="#0d9488" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">Submit daily metrics</h4>
                  <div className="space-y-3 font-semibold text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-455 uppercase mb-1">Claims Completed</label>
                      <input type="number" defaultValue={55} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-455 uppercase mb-1">Rework Items Found</label>
                      <input type="number" defaultValue={2} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs" />
                    </div>
                  </div>
                </div>
                <button onClick={() => triggerNotification('Daily metrics successfully submitted to Team Lead for audit verification.')} className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors mt-4">
                  Submit entries
                </button>
              </div>
            </div>
          </div>
        );

      case 'quality-management':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Claims Audited Sample</h3>
              <div className="space-y-3">
                {qaSamples.map(qa => (
                  <div key={qa.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl hover:shadow transition flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{qa.id}</span>
                        <h4 className="font-bold text-slate-905 dark:text-white text-sm">{qa.claimId}</h4>
                      </div>
                      <p className="text-xs text-slate-550">Process: {qa.process} • Checked By: {qa.checkedBy}</p>
                    </div>
                    <div className="text-right space-y-1.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                        qa.status === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>{qa.status}</span>
                      <p className="text-[10px] text-slate-400 font-bold">Accuracy Score: {qa.score}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Audit Sample Claim</h4>
              <form onSubmit={performAudit} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Claim ID Code</label>
                  <input 
                    type="text" 
                    value={auditClaim} 
                    onChange={e => setAuditClaim(e.target.value)} 
                    placeholder="E.g. CLM-889012"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Errors Identified</label>
                  <select 
                    value={auditErrors} 
                    onChange={e => setAuditErrors(Number(e.target.value))} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="0">0 errors (100% Score)</option>
                    <option value="1">1 error (90% Score)</option>
                    <option value="2">2 errors (80% Score - Rework)</option>
                    <option value="3">3+ errors (Fail - Action Required)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors">
                  Submit QA Score
                </button>
              </form>
            </div>
          </div>
        );

      case 'automation':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Workflow Trigger Rules</h3>
              <div className="space-y-3">
                {automationRules.map(ru => (
                  <div key={ru.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl hover:shadow transition flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 px-1.5 py-0.2 rounded font-mono font-bold">{ru.id}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">If {ru.trigger}</h4>
                      </div>
                      <p className="text-xs text-slate-655 mt-1 font-medium text-brand-primary">Then: {ru.action}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
                      <span className="text-xs text-slate-500 font-semibold">{ru.status}</span>
                      <button 
                        onClick={() => {
                          setAutomationRules(automationRules.filter(r => r.id !== ru.id));
                          triggerNotification(`Rule ${ru.id} has been disabled.`);
                        }}
                        className="p-1 hover:bg-slate-205 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Create workflow trigger</h4>
              <form onSubmit={addRule} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Select Trigger Event</label>
                  <select 
                    value={newRuleTrigger} 
                    onChange={e => setNewRuleTrigger(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="SLA consumes 80%">SLA threshold reaches 80% consumed</option>
                    <option value="SLA breaches">SLA deadline breaches</option>
                    <option value="QA score falls below 95%">QA Accuracy falls below 95%</option>
                    <option value="Employee target exceeded by 20%">Daily processing exceeds target by 20%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Select Execution Action</label>
                  <select 
                    value={newRuleAction} 
                    onChange={e => setNewRuleAction(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Notify Operations Head & Team Lead">Notify Operations Head & Team Lead</option>
                    <option value="Auto-assign rework tasks to agent">Auto-assign rework tasks to billing agent</option>
                    <option value="Queue incentives payroll entry">Queue incentives payroll ledger entry</option>
                    <option value="Trigger system escalation warning email">Trigger escalation alert emails</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-slate-950 text-xs font-bold rounded-lg transition-colors flex justify-center items-center">
                  <Play className="h-3.5 w-3.5 mr-1" /> Activate Rule
                </button>
              </form>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12 text-slate-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-brand-primary" />
            <p>Module configuration error or preview unavailable.</p>
          </div>
        );
    }
  };

  // Icon selector by module
  const getModuleIcon = () => {
    switch (module) {
      case 'recruitment': return <UserPlus className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'lifecycle': return <Activity className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'scheduling': return <Clock className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'performance': return <Award className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'helpdesk': return <HelpCircle className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'documents': return <FileDigit className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'payroll-processing': return <DollarSign className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'offboarding': return <LogOut className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'assets': return <Laptop className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'announcements': return <Megaphone className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'knowledge-base': return <BookOpen className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'billing-metrics': return <TrendingUp className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'quality-management': return <ShieldCheck className="h-6 w-6 mr-3 text-brand-primary" />;
      case 'automation': return <Cpu className="h-6 w-6 mr-3 text-brand-primary" />;
      default: return <CheckCircle2 className="h-6 w-6 mr-3 text-brand-primary" />;
    }
  };

  // Title selector by module
  const getModuleTitle = () => {
    switch (module) {
      case 'recruitment': return 'Recruitment & Hiring Pipeline';
      case 'lifecycle': return 'Employee Lifecycle tracking';
      case 'scheduling': return 'Shift & Workforce scheduling';
      case 'performance': return 'Performance reviews & KPI appraisal';
      case 'helpdesk': return 'HR Helpdesk & requests tickets';
      case 'documents': return 'Employee Document repository';
      case 'payroll-processing': return 'Payroll processing wages ledger';
      case 'offboarding': return 'Offboarding & Security clearance';
      case 'assets': return 'Hardware Assets inventory';
      case 'announcements': return 'Announcements notice bulletin';
      case 'knowledge-base': return 'Medical Billing Knowledge Base';
      case 'billing-metrics': return 'Daily Medical Billing metrics';
      case 'quality-management': return 'QA audit & Quality Management';
      case 'automation': return 'Operations workflow automation';
      default: return 'EasyTrack Module Portal';
    }
  };

  // Subtitle desc
  const getModuleDesc = () => {
    switch (module) {
      case 'recruitment': return 'Manage job openings, review candidate resumes, schedule interview rounds, and process job offers.';
      case 'lifecycle': return 'Track employee timeline stages from onboarding clearance, probation confirmations, promotions, to notice periods.';
      case 'scheduling': return 'Manage shift patterns, configure rosters, assign teams, and coordinate weekend/break scheduling rules.';
      case 'performance': return 'Set up strategic organizational goals, manage KPI performance appraisals, and review team self-assessments.';
      case 'helpdesk': return 'Resolve employee queries, bank/address change applications, experience letters and attendance corrections.';
      case 'documents': return 'Securely vault personal certificates, Aadhaar/PAN cards, signed agreements, and employment offers.';
      case 'payroll-processing': return 'Calculate components including overtime, target incentives, and tax deductions to unlock wage payments.';
      case 'offboarding': return 'Coordinate exit workflows, trace task handovers, verify device returns, and trigger access revocation.';
      case 'assets': return 'Inventory laptops, headsets, ID badges, and monitors issued across the employee workforce.';
      case 'announcements': return 'Publish announcements targeted by role, department, or team to the organization bulletin.';
      case 'knowledge-base': return 'Explore claims FAQs, medical billing checklists, payment posting rules, and eligibility SOP guidelines.';
      case 'billing-metrics': return 'Analyze total claims output counts, denial percentages, SLA accuracy compliance, and productivity charts.';
      case 'quality-management': return 'Score sample claim audits, identify process error categories, track quality trends, and assign rework queues.';
      case 'automation': return 'Define trigger actions like sending notifications or assigning checklists based on SLA consumption rules.';
      default: return 'Review active parameters and configurations of the EasyTrack SaaS architecture.';
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Module Title Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center min-w-0">
          {getModuleIcon()}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center leading-normal">
              {getModuleTitle()}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{getModuleDesc()}</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 bg-brand-primary text-slate-950 rounded-full flex items-center shrink-0">
          ● Mode: Architecture Frozen
        </span>
      </div>

      {/* Success Notification Alert banner */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 text-xs font-bold rounded-xl animate-fade-in flex items-center">
          <CheckCircle2 className="h-4.5 w-4.5 mr-2 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Main Module Content */}
      <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-250 dark:border-slate-700 shadow-sm p-6">
        {renderModuleInterface()}
      </div>
    </div>
  );
};

export default ModulePreviewPage;
