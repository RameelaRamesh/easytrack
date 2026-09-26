import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/client';
import { 
  UserPlus, Activity, Clock, Award, HelpCircle, FileDigit, DollarSign, LogOut, Laptop,
  Megaphone, BookOpen, TrendingUp, ShieldCheck, Cpu, Play, CheckCircle2, AlertCircle, Plus, Search, Filter, Calendar, CheckSquare, Trash2,
  Bell, Globe, Shield, Users, Target, Info, Check, Sparkles
} from 'lucide-react';
import { playAnnouncementSound, requestDesktopNotificationPermission, triggerDesktopNotification } from '../utils/soundUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';

interface ModulePreviewPageProps {
  module: string;
}

export const ModulePreviewPage: React.FC<ModulePreviewPageProps> = ({ module }) => {
  const { user } = useAuth();
  // Common states
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Trigger notification utility
  const triggerNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // --- MODULE 1: RECRUITMENT ---
  const [candidates, setCandidates] = useState<any[]>([]);
  const [newCandName, setNewCandName] = useState('');
  const [newCandRole, setNewCandRole] = useState('Operations Specialist');

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
  const [lifecycleEvents, setLifecycleEvents] = useState<any[]>([]);

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
    { id: 'SH-1', name: 'Day Shift', timing: '08:00 AM ➔ 05:00 PM', grace: '15 mins', OT: '1.5x after 9 hrs' },
    { id: 'SH-2', name: 'Evening Shift', timing: '02:00 PM ➔ 11:00 PM', grace: '15 mins', OT: '1.5x after 9 hrs' },
    { id: 'SH-3', name: 'Night Shift', timing: '10:00 PM ➔ 07:00 AM', grace: '20 mins', OT: '2.0x after 8 hrs' }
  ]);
  const [activeRoster, setActiveRoster] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('easytrack_shift_rosters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [rosterEmp, setRosterEmp] = useState('');
  const [rosterShift, setRosterShift] = useState('Day Shift (08:00 AM - 05:00 PM)');

  const allocateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterEmp.trim()) return;
    const newRecord = { employee: rosterEmp, shift: rosterShift, status: 'Scheduled', dateAssigned: new Date().toISOString() };
    const updated = [newRecord, ...activeRoster];
    setActiveRoster(updated);
    localStorage.setItem('easytrack_shift_rosters', JSON.stringify(updated));
    window.dispatchEvent(new Event('easytrack_roster_updated'));
    setRosterEmp('');
    triggerNotification(`Shift ${rosterShift} assigned to ${rosterEmp}.`);
  };

  // --- MODULE 4: PERFORMANCE ---
  const [kpis, setKpis] = useState([
    { id: 'KPI-1', goal: 'Deliverable Quality Pass Rate', target: '98% pass rate', weight: '40%', status: 'On Track' },
    { id: 'KPI-2', goal: 'Daily Production Output', target: '65 items / day', weight: '30%', status: 'At Risk' },
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
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadCat, setUploadCat] = useState('Identity Proof');
  const [uploadFileName, setUploadFileName] = useState('');

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToUse = uploadFileName || `Submitted_${uploadCat.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`;
    const doc = {
      name: nameToUse,
      size: '1.5 MB',
      category: uploadCat,
      date: new Date().toISOString().split('T')[0],
      status: 'Submitted & Verified'
    };
    setDocuments([doc, ...documents]);
    setUploadFileName('');
    triggerNotification(`Document / Certification "${nameToUse}" uploaded & submitted successfully!`);
  };

  // --- MODULE 7: PAYROLL ENGINE ---
  const [payrollLock, setPayrollLock] = useState(false);
  const [payslips, setPayslips] = useState<any[]>([]);

  // --- MODULE 8: OFFBOARDING ---
  const [offboardings, setOffboardings] = useState([
    { 
      empId: 'EMP-089', 
      name: 'Amit Roy', 
      status: 'Notice Period', 
      date: '2026-09-30', 
      clearance: {
        asset: false,
        hr: false,
        security: false,
        finance: false
      }
    },
    { 
      empId: 'EMP-092', 
      name: 'Kiran Sen', 
      status: 'Cleared', 
      date: '2026-08-20', 
      clearance: {
        asset: true,
        hr: true,
        security: true,
        finance: true
      }
    }
  ]);

  const toggleOffboardingClearance = (empId: string, key: string) => {
    setOffboardings(prev => prev.map(o => {
      if (o.empId === empId) {
        const k = key as keyof typeof o.clearance;
        const nextClearance = { ...o.clearance, [k]: !o.clearance[k] };
        const allCleared = Object.values(nextClearance).every(v => v === true);
        return { 
          ...o, 
          clearance: nextClearance,
          status: allCleared ? 'Cleared' : 'Notice Period'
        };
      }
      return o;
    }));
  };

  // --- MODULE 9: ASSETS ---
  const [assets, setAssets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('easytrack_hardware_assets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [assetDeviceName, setAssetDeviceName] = useState('');
  const [assetDeviceModelPreset, setAssetDeviceModelPreset] = useState('');
  const [assetChargerType, setAssetChargerType] = useState('');
  const [assetIdInput, setAssetIdInput] = useState('');
  const [assetAssignedToEmail, setAssetAssignedToEmail] = useState('');
  const [assetCategory, setAssetCategory] = useState('Laptop');
  const [assetTab, setAssetTab] = useState<'inventory' | 'personal'>('inventory');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  
  // Accessories Checkboxes
  const [hasMouse, setHasMouse] = useState(true);
  const [hasKeyboard, setHasKeyboard] = useState(true);
  const [hasBag, setHasBag] = useState(true);
  const [hasHeadset, setHasHeadset] = useState(false);
  const [hasAdapterCable, setHasAdapterCable] = useState(true);
  const [hasDisplayCable, setHasDisplayCable] = useState(false);

  const registerAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDeviceName = (assetDeviceName.trim() || assetDeviceModelPreset).trim();
    if (!finalDeviceName) return;

    const finalId = assetIdInput.trim() || `AST-${Math.floor(100 + Math.random() * 900)}`;
    const emailVal = (assetAssignedToEmail.trim() || 'Inventory (Unassigned)').toLowerCase();

    const newAssetObj = {
      id: finalId,
      type: finalDeviceName,
      category: assetCategory,
      chargerType: assetChargerType.trim() || 'Standard 65W Rapid Charger',
      assignedToEmail: emailVal,
      assignedTo: emailVal,
      date: new Date().toISOString().split('T')[0],
      status: emailVal.includes('inventory') ? 'In Stock' : 'Active Deployment',
      accessories: {
        mouse: hasMouse,
        keyboard: hasKeyboard,
        bag: hasBag,
        headset: hasHeadset,
        adapterCable: hasAdapterCable,
        displayCable: hasDisplayCable
      }
    };

    const updatedList = [newAssetObj, ...assets];
    setAssets(updatedList);
    localStorage.setItem('easytrack_hardware_assets', JSON.stringify(updatedList));

    setAssetDeviceName('ThinkPad L14 Gen 4');
    setAssetDeviceModelPreset('ThinkPad L14 Gen 4');
    setAssetIdInput('');
    setAssetAssignedToEmail('');
    setHasMouse(true);
    setHasKeyboard(true);
    setHasBag(true);
    setHasHeadset(false);
    setHasAdapterCable(true);
    setHasDisplayCable(false);

    triggerNotification(`Hardware Asset ${finalId} (${newAssetObj.type}) registered successfully!`);
  };

  const deleteAsset = (id: string) => {
    const updatedList = assets.filter(a => a.id !== id);
    setAssets(updatedList);
    localStorage.setItem('easytrack_hardware_assets', JSON.stringify(updatedList));
    triggerNotification(`Asset ${id} removed from inventory.`);
  };

  const releaseAssetToInventory = (id: string) => {
    const updatedList = assets.map(a => a.id === id ? { ...a, assignedToEmail: 'Inventory (Unassigned)', assignedTo: 'Inventory', status: 'In Stock' } : a);
    setAssets(updatedList);
    localStorage.setItem('easytrack_hardware_assets', JSON.stringify(updatedList));
    triggerNotification(`Asset ${id} released to general inventory pool.`);
  };

  // --- MODULE 10: ANNOUNCEMENTS ---
  const [announcements, setAnnouncements] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('easytrack_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [annTitle, setAnnTitle] = useState('');
  const [annText, setAnnText] = useState('');
  const [annScope, setAnnScope] = useState<'public' | 'organization' | 'employees_only' | 'specific_roles' | 'specific_team'>('organization');
  const [annTargetRoles, setAnnTargetRoles] = useState<string[]>(['employee']);
  const [annTargetTeam, setAnnTargetTeam] = useState('Operations');
  const [annFilter, setAnnFilter] = useState<'all' | 'public' | 'organization' | 'targeted'>('all');

  const [desktopNotifGranted, setDesktopNotifGranted] = useState(() => ('Notification' in window && Notification.permission === 'granted'));
  const [showSoundHelp, setShowSoundHelp] = useState(false);

  const handleRequestNotifPermission = async () => {
    const granted = await requestDesktopNotificationPermission();
    setDesktopNotifGranted(granted);
    if (granted) {
      triggerNotification('Desktop Notifications enabled! Popups will display when tab is in background.');
    } else {
      triggerNotification('Notification permission check complete.');
    }
  };

  const toggleRoleTarget = (r: string) => {
    if (annTargetRoles.includes(r)) {
      if (annTargetRoles.length > 1) {
        setAnnTargetRoles(annTargetRoles.filter(role => role !== r));
      }
    } else {
      setAnnTargetRoles([...annTargetRoles, r]);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await apiClient.get<any[]>('/announcements/');
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      if (data && data.length > 0) {
        setAnnouncements(data);
        localStorage.setItem('easytrack_announcements', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const publishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annText.trim()) return;

    const authorName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : 'HR Management';
    const authorRole = user?.role || 'management';

    let targetLabel = 'Organization Wide';
    if (annScope === 'public') {
      targetLabel = 'Public (All Users)';
    } else if (annScope === 'employees_only') {
      targetLabel = 'Employees Alone';
    } else if (annScope === 'specific_roles') {
      targetLabel = `Roles: ${annTargetRoles.map(r => r.toUpperCase().replace('_', ' ')).join(', ')}`;
    } else if (annScope === 'specific_team') {
      targetLabel = `Team: ${annTargetTeam}`;
    }

    const newAnn = {
      title: annTitle,
      summary: annText,
      author: authorName,
      author_role: authorRole,
      scope: annScope,
      target: targetLabel,
      target_roles: annTargetRoles,
      target_team: annTargetTeam,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await apiClient.post('/announcements/', newAnn);
      const savedItem = res.data;
      setAnnouncements(prev => [savedItem, ...prev]);
      const updated = [savedItem, ...announcements];
      localStorage.setItem('easytrack_announcements', JSON.stringify(updated));
    } catch (err) {
      console.error('API publish announcement failed, saving locally:', err);
      const localAnn = { id: `AN-${Date.now()}`, ...newAnn };
      setAnnouncements(prev => [localAnn, ...prev]);
      const updated = [localAnn, ...announcements];
      localStorage.setItem('easytrack_announcements', JSON.stringify(updated));
    }

    // Play chime sound if master sound is active
    const isMasterMuted = localStorage.getItem('easytrack_sound_muted') === 'true' || 
                          localStorage.getItem('message_muted') === 'true' || 
                          localStorage.getItem('announcement_sound_muted') === 'true';
    playAnnouncementSound(isMasterMuted);

    // Notify sidebar sync
    window.dispatchEvent(new CustomEvent('easytrack_new_announcement', { detail: newAnn }));

    setAnnTitle('');
    setAnnText('');
    triggerNotification(`Announcement published to ${targetLabel}! Sound alert triggered.`);
  };

  // --- MODULE 11: KNOWLEDGE BASE ---
  const [kbArticles, setKbArticles] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('easytrack_kb_articles');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'SOP-101',
        title: 'Apex Enterprise - Deliverable Verification Checklist',
        section: 'Deliverables & Production',
        views: 142,
        tags: ['Apex Project', 'Operations', 'Mandatory'],
        lastUpdated: '2026-09-10',
        content: 'Verify primary account ID matches client requirements response. Cross check deliverable specifications against work order. Any discrepancy exceeding threshold must be escalated to TL.'
      },
      {
        id: 'SOP-102',
        title: 'Metro Operations - Process Exception Handling SOP',
        section: 'Process Standards',
        views: 98,
        tags: ['Metro Project', 'Exceptions', 'SLA'],
        lastUpdated: '2026-09-12',
        content: 'Review contractual obligations prior to escalation. Re-verify SLA response timelines for secondary reviews within 24 hours.'
      },
      {
        id: 'SOP-103',
        title: 'Global Client - Real-time SLA & Operational Guidelines',
        section: 'Quality Review',
        views: 215,
        tags: ['Global Project', 'Deliverables', 'Guidelines'],
        lastUpdated: '2026-09-18',
        content: 'Cross check client requirements and delivery milestones before final handoff. Verify project code and sign-off criteria.'
      },
      {
        id: 'SOP-104',
        title: 'Enterprise Client - Critical Operational Escalation Protocol',
        section: 'Deliverables & Production',
        views: 76,
        tags: ['Enterprise', 'Emergency', 'Escalations'],
        lastUpdated: '2026-09-20',
        content: 'Ensure stakeholder sign-off and valid deliverable artifacts are attached before submitting critical milestone tasks.'
      }
    ];
  });
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbSec, setNewKbSec] = useState('Deliverables & Production');
  const [kbCategoryFilter, setKbCategoryFilter] = useState('all');

  const [acknowledgedSops, setAcknowledgedSops] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('emp_acknowledged_sops');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const handleAcknowledgeSop = (sopId: string) => {
    const updated = { ...acknowledgedSops, [sopId]: true };
    setAcknowledgedSops(updated);
    localStorage.setItem('emp_acknowledged_sops', JSON.stringify(updated));
    triggerNotification(`SOP ${sopId} compliance acknowledged.`);
  };

  const addKbArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbTitle.trim()) return;
    const newArt = {
      id: `SOP-${100 + kbArticles.length + 1}`,
      title: newKbTitle,
      section: newKbSec,
      views: 0,
      tags: ['Manual', newKbSec],
      lastUpdated: new Date().toISOString().split('T')[0],
      content: `Standard Operating Procedure guidelines for ${newKbTitle}. Follow all client SLA checklist requirements.`
    };
    const updated = [...kbArticles, newArt];
    setKbArticles(updated);
    localStorage.setItem('easytrack_kb_articles', JSON.stringify(updated));
    setNewKbTitle('');
    triggerNotification('New knowledge base SOP published.');
  };


  // --- MODULE 12: OPERATIONAL & SLA METRICS ---
  const metricsData = [
    { name: 'Mon', units: 0, accuracy: 0 },
    { name: 'Tue', units: 0, accuracy: 0 },
    { name: 'Wed', units: 0, accuracy: 0 },
    { name: 'Thu', units: 0, accuracy: 0 },
    { name: 'Fri', units: 0, accuracy: 0 }
  ];

  // --- MODULE 13: QUALITY MANAGEMENT ---
  const [qaSamples, setQaSamples] = useState<any[]>([]);
  const [auditClaim, setAuditClaim] = useState('');
  const [auditErrors, setAuditErrors] = useState(0);

  const performAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditClaim.trim()) return;
    const score = Math.max(0, 100 - (auditErrors * 10));
    setQaSamples([...qaSamples, {
      id: `QA-${Math.floor(891 + Math.random() * 200)}`,
      itemId: auditClaim,
      process: 'Apex Deliverable Verification',
      checkedBy: 'Current Auditor',
      errors: auditErrors,
      score: score,
      status: score >= 90 ? 'Passed' : 'Rework Required'
    }]);
    setAuditClaim('');
    setAuditErrors(0);
    triggerNotification('Quality audit result calculated and saved.');
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
                    <option value="Operations Specialist">Operations Specialist</option>
                    <option value="Billing Specialist">Billing Specialist</option>
                    <option value="AR Associate">AR Associate</option>
                    <option value="QA Analyst">QA Analyst</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center">
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
                    placeholder="E.g. Employee Name"
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
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors">
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
                    <option value="Day Shift">Day Shift (08:00 - 17:00)</option>
                    <option value="Evening Shift">Evening Shift (14:00 - 23:00)</option>
                    <option value="Night Shift">Night Shift (22:00 - 07:00)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors">
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
                    placeholder="E.g. Improve Delivery Quality Rate"
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
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors">
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
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors">
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
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Submitted Documents & Certifications Repository</h3>
              <div className="space-y-3">
                {documents.map((doc, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl flex justify-between items-center hover:shadow transition">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-805 dark:text-white text-sm">{doc.name}</h4>
                      <p className="text-xs text-slate-500">{doc.category} • {doc.size}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.status === 'Verified' || doc.status === 'Submitted & Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>{doc.status}</span>
                      <p className="text-[9px] text-slate-400 font-mono">Uploaded: {doc.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Upload Document & Certifications</h4>
              <form onSubmit={handleUpload} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Category / Type</label>
                  <select 
                    value={uploadCat} 
                    onChange={e => setUploadCat(e.target.value)} 
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Identity Proof">Identity Proof (Aadhaar/PAN/Passport)</option>
                    <option value="Education Document">10th / 12th / Degree Certificates</option>
                    <option value="Professional Certification">Professional Certification (CPC, HIPAA, AWS, etc.)</option>
                    <option value="Experience Certificate">Experience / Relieving Letters</option>
                    <option value="Bank Document">Cancelled Cheque / Passbook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Select File to Submit</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-5 text-center text-xs space-y-2">
                    <p className="text-slate-400">PDF, JPG, PNG format accepted (Max 10MB)</p>
                    <label className="inline-block px-3 py-1.5 bg-brand-primary text-white rounded font-bold cursor-pointer hover:opacity-90">
                      <span>Choose File</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setUploadFileName(f.name);
                        }}
                      />
                    </label>
                    {uploadFileName && (
                      <p className="text-xs font-semibold text-emerald-600 truncate pt-1">{uploadFileName}</p>
                    )}
                  </div>
                </div>

                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors">
                  Upload & Submit Document
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
                      <th className="p-4 text-right">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-slate-750 font-semibold">
                    {payslips.map(ps => (
                      <tr key={ps.empId} className="hover:bg-slate-50/55 dark:hover:bg-slate-750/30">
                        <td className="p-4 font-mono">{ps.empId}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{ps.name}</td>
                        <td className="p-4">₹{ps.base?.toLocaleString() || 0}</td>
                        <td className="p-4 text-emerald-600">+₹{ps.incentive || 0}</td>
                        <td className="p-4 text-emerald-600">+₹{ps.overtime || 0}</td>
                        <td className="p-4 text-right font-bold">₹{(ps.net || (ps.base + (ps.incentive || 0) + (ps.overtime || 0)))?.toLocaleString()}</td>
                      </tr>
                    ))}
                    {payslips.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400 font-medium">No wage ledger entries found.</td>
                      </tr>
                    )}
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
                  <div key={ob.empId} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-750 rounded-xl space-y-3 hover:shadow-sm transition">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{ob.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">{ob.empId}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        ob.status === 'Cleared' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-750'
                      }`}>{ob.status}</span>
                    </div>
                    
                    {/* Clearances Grid only */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium">
                      {Object.keys(ob.clearance).map((key) => {
                        const k = key as keyof typeof ob.clearance;
                        return (
                          <label 
                            key={key} 
                            className="flex items-center space-x-2.5 p-2 border border-gray-150 dark:border-slate-750 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750/30"
                          >
                            <input
                              type="checkbox"
                              checked={ob.clearance[k]}
                              onChange={() => toggleOffboardingClearance(ob.empId, key)}
                              className="h-4.5 w-4.5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <span className="capitalize text-slate-700 dark:text-slate-300">{key.replace('_', ' ')} Clearance</span>
                          </label>
                        );
                      })}
                    </div>

                    {ob.status === 'Notice Period' && (
                      <div className="flex justify-end pt-2">
                        <button 
                          onClick={() => {
                            setOffboardings(offboardings.map(o => o.empId === ob.empId ? {
                              ...o, 
                              status: 'Cleared', 
                              clearance: { asset: true, hr: true, security: true, finance: true }
                            } : o));
                            triggerNotification(`Offboarding clearance complete. Security protocols executed.`);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                        >
                          Revoke Access & Clear All
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
              <h4 className="font-bold text-slate-805 dark:text-white">Security Exit Protocols</h4>
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
        const userEmail = (user?.email || '').trim().toLowerCase();
        const userFullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim().toLowerCase();
        const userName = (user?.username || '').trim().toLowerCase();

        // Personal assets assigned to this user
        let myPersonalAssets = assets.filter(ass => {
          const targetEmail = (ass.assignedToEmail || ass.assignedTo || '').trim().toLowerCase();
          if (!targetEmail) return false;
          return (userEmail && targetEmail === userEmail) || 
                 (userName && targetEmail === userName) || 
                 (userEmail && targetEmail.includes(userEmail)) || 
                 (userFullName && targetEmail.includes(userFullName));
        });

        if (myPersonalAssets.length === 0) {
          myPersonalAssets = [
            {
              id: `AST-KIT-${user?.username ? user.username.toUpperCase().slice(0, 4) : 'PERS'}`,
              type: 'Executive Enterprise Workstation (Lenovo ThinkPad)',
              category: 'Laptop',
              chargerType: '65W USB-C Rapid Charger',
              assignedToEmail: user?.email || `${user?.username || 'user'}@easytrack.com`,
              date: 'Company Issued',
              status: 'Active Deployment',
              accessories: { mouse: true, keyboard: true, bag: true, headset: true, adapterCable: true, displayCable: false }
            }
          ];
        }
        return (
          <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-850 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <Laptop className="h-5 w-5 mr-2 text-brand-primary" />
                  My Assigned Hardware Assets
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hardware and peripherals officially assigned to your profile ({user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username} - {user?.role?.toUpperCase()}).
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-brand-primary-light text-brand-primary border border-brand-primary/20 px-3 py-1 rounded-full">
                {myPersonalAssets.length} Assigned Unit{myPersonalAssets.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* List of personal assigned assets */}
            <div className="space-y-4">
              {myPersonalAssets.map(ass => (
                <div key={ass.id} className="p-5 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-750 rounded-2xl shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-brand-primary-light text-brand-primary rounded-xl">
                        <Laptop className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{ass.type}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          Asset Tag: <span className="font-bold text-brand-primary">{ass.id}</span> • Charger: {ass.chargerType || 'Standard 65W Rapid'}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                      Active Deployment
                    </span>
                  </div>

                  {/* Accessories Checklist */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Issued Workstation Accessories & Peripherals:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-bold">
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        ass.accessories?.mouse 
                          ? 'bg-emerald-50/60 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'
                      }`}>
                        <span>Mouse</span>
                        <span>{ass.accessories?.mouse ? '✓' : '✕'}</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        ass.accessories?.keyboard 
                          ? 'bg-emerald-50/60 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'
                      }`}>
                        <span>Keyboard</span>
                        <span>{ass.accessories?.keyboard ? '✓' : '✕'}</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        ass.accessories?.bag 
                          ? 'bg-emerald-50/60 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'
                      }`}>
                        <span>Laptop Bag</span>
                        <span>{ass.accessories?.bag ? '✓' : '✕'}</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        ass.accessories?.headset 
                          ? 'bg-emerald-50/60 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'
                      }`}>
                        <span>Headset</span>
                        <span>{ass.accessories?.headset ? '✓' : '✕'}</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        ass.accessories?.adapterCable ?? true 
                          ? 'bg-emerald-50/60 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'
                      }`}>
                        <span>Power Cord</span>
                        <span>{ass.accessories?.adapterCable ?? true ? '✓' : '✕'}</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        ass.accessories?.displayCable 
                          ? 'bg-emerald-50/60 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'
                      }`}>
                        <span>HDMI Cord</span>
                        <span>{ass.accessories?.displayCable ? '✓' : '✕'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Issued on: {ass.date || 'Active record'}</span>
                    <span>For technical support or replacement, contact HR / IT via Helpdesk.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'announcements':
        const canPublish = ['ceo', 'operations_head', 'hr', 'tl'].includes(user?.role || '');

        const filteredAnnouncements = announcements.filter(ann => {
          if (annFilter === 'public') return ann.scope === 'public' || ann.target?.toLowerCase().includes('public');
          if (annFilter === 'organization') return ann.scope === 'organization' || ann.target === 'All Employees' || ann.target === 'Organization Wide';
          if (annFilter === 'targeted') return ['employees_only', 'specific_roles', 'specific_team'].includes(ann.scope) || (!['public', 'organization'].includes(ann.scope) && ann.target !== 'All Employees');
          return true;
        });

        return (
          <div className="space-y-6">
            
            {/* Main Grid: Feed on Left (2 cols), Publisher Form on Right (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Feed & Filter */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                    <Megaphone className="h-4 w-4 mr-1.5 text-brand-primary" />
                    Announcements Feed ({filteredAnnouncements.length})
                  </h3>
                  
                  {/* Filter Pills */}
                  <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-gray-200 dark:border-slate-800 text-xs">
                    {(['all', 'public', 'organization', 'targeted'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setAnnFilter(f)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition ${
                          annFilter === f 
                            ? 'bg-brand-primary text-white shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feed Items List */}
                <div className="space-y-3">
                  {filteredAnnouncements.map(ann => (
                    <div key={ann.id || ann.title} className="p-5 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl space-y-3 hover:shadow transition">
                      <div className="flex justify-between items-start text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white">{ann.author}</span>
                          {ann.author_role && (
                            <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                              {ann.author_role.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        
                        {/* Scope / Target Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                          ann.scope === 'public' || ann.target?.includes('Public')
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                            : ann.scope === 'organization' || ann.target === 'All Employees' || ann.target === 'Organization Wide'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                        }`}>
                          {ann.target || ann.scope || 'Organization'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-base leading-normal">{ann.title}</h4>
                      <p className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">{ann.summary}</p>
                      
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>Date: {ann.date || ann.created_at?.split('T')[0] || 'Today'}</span>
                        <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 font-bold px-2 py-0.5 rounded-full flex items-center">
                          <Check className="h-3 w-3 mr-1" /> Delivered to Target Scope
                        </span>
                      </div>
                    </div>
                  ))}

                  {filteredAnnouncements.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-800 text-slate-400">
                      <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold">No announcements found matching filter "{annFilter}".</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Creation Form (For CEO, Operations Head, HR, Team Lead) */}
              <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center text-sm">
                    <Plus className="h-4 w-4 mr-1 text-brand-primary" />
                    Publish Announcement
                  </h4>
                  {canPublish ? (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                      Authorized Creator
                    </span>
                  ) : (
                    <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 font-bold px-2 py-0.5 rounded">
                      View Only
                    </span>
                  )}
                </div>

                {canPublish ? (
                  <form onSubmit={publishAnnouncement} className="space-y-4">
                    
                    {/* Announcement Title */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Announcement Title</label>
                      <input 
                        type="text" 
                        value={annTitle} 
                        onChange={e => setAnnTitle(e.target.value)} 
                        placeholder="E.g. Q3 Strategic Goals / Holiday Schedule"
                        required
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      />
                    </div>

                    {/* Target Scope Options */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Target Audience Scope</label>
                      <div className="space-y-1.5 text-xs font-semibold">
                        
                        <label className={`flex items-center p-2 rounded-lg border cursor-pointer transition ${
                          annScope === 'public' 
                            ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-400 text-sky-900 dark:text-sky-200' 
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                        }`}>
                          <input 
                            type="radio" 
                            name="annScope" 
                            value="public" 
                            checked={annScope === 'public'} 
                            onChange={() => setAnnScope('public')}
                            className="mr-2 text-brand-primary"
                          />
                          <Globe className="h-3.5 w-3.5 mr-1.5 text-sky-500" />
                          <span>Public (All Organizations & Visitors)</span>
                        </label>

                        <label className={`flex items-center p-2 rounded-lg border cursor-pointer transition ${
                          annScope === 'organization' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200' 
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                        }`}>
                          <input 
                            type="radio" 
                            name="annScope" 
                            value="organization" 
                            checked={annScope === 'organization'} 
                            onChange={() => setAnnScope('organization')}
                            className="mr-2 text-brand-primary"
                          />
                          <Users className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                          <span>Organization Wide (Whole Company)</span>
                        </label>

                        <label className={`flex items-center p-2 rounded-lg border cursor-pointer transition ${
                          annScope === 'employees_only' 
                            ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-400 text-indigo-900 dark:text-indigo-200' 
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                        }`}>
                          <input 
                            type="radio" 
                            name="annScope" 
                            value="employees_only" 
                            checked={annScope === 'employees_only'} 
                            onChange={() => setAnnScope('employees_only')}
                            className="mr-2 text-brand-primary"
                          />
                          <Users className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                          <span>Employees Alone (General Staff)</span>
                        </label>

                        <label className={`flex items-center p-2 rounded-lg border cursor-pointer transition ${
                          annScope === 'specific_roles' 
                            ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-400 text-purple-900 dark:text-purple-200' 
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                        }`}>
                          <input 
                            type="radio" 
                            name="annScope" 
                            value="specific_roles" 
                            checked={annScope === 'specific_roles'} 
                            onChange={() => setAnnScope('specific_roles')}
                            className="mr-2 text-brand-primary"
                          />
                          <Shield className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
                          <span>Specific Roles (CEO, HR, TL, etc.)</span>
                        </label>

                        <label className={`flex items-center p-2 rounded-lg border cursor-pointer transition ${
                          annScope === 'specific_team' 
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 text-amber-900 dark:text-amber-200' 
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                        }`}>
                          <input 
                            type="radio" 
                            name="annScope" 
                            value="specific_team" 
                            checked={annScope === 'specific_team'} 
                            onChange={() => setAnnScope('specific_team')}
                            className="mr-2 text-brand-primary"
                          />
                          <Target className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                          <span>Specific Team / Department</span>
                        </label>

                      </div>
                    </div>

                    {/* Specific Roles Checkboxes */}
                    {annScope === 'specific_roles' && (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-900/50 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Select Target Roles:</span>
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                          {[
                            { id: 'ceo', label: 'CEO' },
                            { id: 'operations_head', label: 'Operations Head' },
                            { id: 'hr', label: 'HR Management' },
                            { id: 'tl', label: 'Team Leads (TL)' },
                            { id: 'employee', label: 'Employees' }
                          ].map(r => (
                            <label key={r.id} className="flex items-center space-x-2">
                              <input 
                                type="checkbox"
                                checked={annTargetRoles.includes(r.id)}
                                onChange={() => toggleRoleTarget(r.id)}
                                className="rounded text-brand-primary"
                              />
                              <span className="text-slate-700 dark:text-slate-300">{r.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specific Team Selector */}
                    {annScope === 'specific_team' && (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-900/50 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Target Team / Department:</label>
                        <select
                          value={annTargetTeam}
                          onChange={e => setAnnTargetTeam(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-gray-300 dark:border-slate-700 rounded text-xs font-semibold"
                        >
                          <option value="Operations">Operations Team</option>
                          <option value="Project Delivery">Project Delivery Team</option>
                          <option value="Quality Review">Quality Review Team</option>
                          <option value="QA Audit Team">QA Audit Team</option>
                          <option value="Process Operations">Process Operations Team</option>
                          <option value="HR & Recruitment">HR & Recruitment Team</option>
                        </select>
                      </div>
                    )}

                    {/* Announcement Context / Summary Body */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Announcement Details</label>
                      <textarea 
                        value={annText} 
                        onChange={e => setAnnText(e.target.value)} 
                        placeholder="Write announcement body, policy updates or meeting notices..."
                        rows={4}
                        required
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-medium leading-relaxed"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-2.5 bg-brand-primary bg-brand-primary-hover text-white text-xs font-extrabold rounded-lg shadow-sm transition flex justify-center items-center"
                    >
                      <Megaphone className="h-4 w-4 mr-1.5" /> Broadcast Announcement & Sound
                    </button>

                  </form>
                ) : (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-900 text-xs leading-relaxed font-medium space-y-2">
                    <p className="font-bold flex items-center">
                      <Shield className="h-4 w-4 mr-1 text-amber-500" /> Announcement Creation Restricted
                    </p>
                    <p>Only authorized leadership roles (CEO, Operations Head, HR, and Team Leads) can publish announcements to staff or teams.</p>
                    <p className="text-[10px] text-slate-500">You are currently logged in as a General Employee. You will receive all announcements targeted to your role or team in real-time.</p>
                  </div>
                )}

              </div>
            </div>

          </div>
        );

      case 'knowledge-base': {
        const canPublishSop = ['ceo', 'operations_head', 'ops_head', 'hr', 'tl'].includes(user?.role || '');
        const filteredArticles = kbArticles
          .filter(art => kbCategoryFilter === 'all' || art.section === kbCategoryFilter)
          .filter(art => (art.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (art.content || '').toLowerCase().includes(searchQuery.toLowerCase()));

        return (
          <div className={canPublishSop ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "space-y-6"}>
            <div className={canPublishSop ? "lg:col-span-2 space-y-4" : "space-y-4 max-w-5xl mx-auto"}>
              
              {/* Search & Category Tabs */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search process verification, client guidelines, quality checklists, or SLA rules..." 
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs"
                  />
                </div>

                {/* Section filter pills */}
                <div className="flex overflow-x-auto space-x-1.5 scrollbar-none shrink-0">
                  {['all', 'Deliverables & Production', 'Process Standards', 'Quality Review'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setKbCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        kbCategoryFilter === cat
                          ? 'bg-brand-primary text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'All Guides' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* SOP Article Cards List */}
              <div className="space-y-3.5">
                {filteredArticles.map(art => {
                  const isAck = Boolean(acknowledgedSops[art.id]);
                  return (
                    <div 
                      key={art.id} 
                      className="p-4 sm:p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xs hover:border-brand-primary/50 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-brand-primary font-mono font-bold bg-brand-primary-light px-2 py-0.5 rounded">
                            {art.id}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                            {art.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          {art.section}
                        </span>
                      </div>

                      {/* Content / Guidance */}
                      {art.content && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-gray-100 dark:border-slate-750">
                          {art.content}
                        </p>
                      )}

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1 border-t border-gray-100 dark:border-slate-750 text-[11px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {art.tags?.map((tg: any, idx: number) => (
                            <span key={idx} className="bg-slate-100 dark:bg-slate-750 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded">
                              #{tg}
                            </span>
                          ))}
                          {art.lastUpdated && (
                            <span className="text-slate-400 text-[10px] ml-1">
                              • Updated {art.lastUpdated}
                            </span>
                          )}
                        </div>

                        {/* Acknowledge compliance button */}
                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                          {isAck ? (
                            <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-bold">
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Guidelines Acknowledged
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAcknowledgeSop(art.id)}
                              className="px-3.5 py-1 bg-brand-primary bg-brand-primary-hover text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Acknowledge SOP</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredArticles.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    No SOPs matched your search query.
                  </div>
                )}
              </div>

            </div>

            {/* Authoring form shown only to managers & TLs */}
            {canPublishSop && (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm space-y-4 h-fit">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Publish New SOP / Article</h4>
                <p className="text-xs text-slate-500">Create client-specific processing guidelines or checklists.</p>
                <form onSubmit={addKbArticle} className="space-y-3 font-semibold text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Article Title</label>
                    <input 
                      type="text" 
                      value={newKbTitle} 
                      onChange={e => setNewKbTitle(e.target.value)} 
                      placeholder="E.g. Quality verification checklist"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Section Folder</label>
                    <select 
                      value={newKbSec} 
                      onChange={e => setNewKbSec(e.target.value)} 
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="Deliverables & Production">Deliverables & Production</option>
                      <option value="Process Standards">Process Standards</option>
                      <option value="Quality Review">Quality Review</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-xs">
                    Publish SOP to Staff
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      }

      case 'billing-metrics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-250 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] uppercase text-slate-450 font-bold">Total Daily Output</span>
                <h4 className="text-xl font-extrabold mt-1 text-slate-905 dark:text-white">582 Units</h4>
                <span className="text-[9px] text-emerald-600 font-semibold mt-1">▲ 8% vs yesterday</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-250 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] uppercase text-slate-450 font-bold">First Pass Rate</span>
                <h4 className="text-xl font-extrabold mt-1 text-slate-905 dark:text-white">98.8% Acc</h4>
                <span className="text-[9px] text-emerald-600 font-semibold mt-1">▲ 0.2% vs target</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-250 dark:border-slate-700 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] uppercase text-slate-450 font-bold">Audit Rework Rate</span>
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
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Production Productivity (Daily trend)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="units" stroke="#0d9488" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-150 dark:border-slate-750 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">Submit daily metrics</h4>
                  <div className="space-y-3 font-semibold text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-455 uppercase mb-1">Units Completed</label>
                      <input type="number" defaultValue={55} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-455 uppercase mb-1">Rework Items Found</label>
                      <input type="number" defaultValue={2} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-xs" />
                    </div>
                  </div>
                </div>
                <button onClick={() => triggerNotification('Daily metrics successfully submitted to Team Lead for audit verification.')} className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors mt-4">
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
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Quality Audited Sample</h3>
              <div className="space-y-3">
                {qaSamples.map(qa => (
                  <div key={qa.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-750 rounded-xl hover:shadow transition flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{qa.id}</span>
                        <h4 className="font-bold text-slate-905 dark:text-white text-sm">{qa.itemId}</h4>
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
              <h4 className="font-bold text-slate-800 dark:text-white">Audit Sample Deliverable</h4>
              <form onSubmit={performAudit} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 uppercase mb-1">Work Item ID</label>
                  <input 
                    type="text" 
                    value={auditClaim} 
                    onChange={e => setAuditClaim(e.target.value)} 
                    placeholder="E.g. TSK-889012"
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
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors">
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
                <button type="submit" className="w-full py-2 bg-brand-primary bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center">
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
      case 'knowledge-base': return 'Operational Knowledge Base';
      case 'billing-metrics': return 'Daily Operations & SLA metrics';
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
      case 'knowledge-base': return 'Explore process FAQs, operational checklists, quality guidelines, and client SOPs.';
      case 'billing-metrics': return 'Analyze total deliverable output counts, error percentages, SLA accuracy compliance, and productivity charts.';
      case 'quality-management': return 'Score sample deliverable audits, identify process error categories, track quality trends, and assign rework queues.';
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
        <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 bg-brand-primary text-white rounded-full flex items-center shrink-0">
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
