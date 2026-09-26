import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Laptop, Plus, Search, Check, X, ShieldAlert, CheckCircle2, 
  RotateCcw, Trash2, ArrowLeft, Filter, Tag, UserCheck, AlertCircle, HardDrive, User
} from 'lucide-react';
import { DynamicDeviceInput, saveDeviceModelToHistory } from '../../components/common/DynamicDeviceInput';
import { DynamicChargerInput, saveChargerSpecToHistory } from '../../components/common/DynamicChargerInput';

interface EmployeeProfile {
  id: number;
  employee_id: string;
  department?: string;
  designation?: string;
  user_details?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface HardwareAsset {
  id: string;
  type: string;
  category?: string;
  chargerType: string;
  assignedToEmail: string;
  assignedTo?: string;
  employeeName?: string;
  employeeId?: string;
  date: string;
  status: 'Active Deployment' | 'In Stock' | 'Returned' | 'Maintenance';
  accessories: {
    mouse: boolean;
    keyboard: boolean;
    bag: boolean;
    headset: boolean;
    adapterCable?: boolean;
    displayCable?: boolean;
  };
}

export const AssetManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const actionParam = searchParams.get('action');

  // Form visibility state
  const [showIssueForm, setShowIssueForm] = useState<boolean>(actionParam === 'issue');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [msg, setMsg] = useState('');

  // Employees for assignment dropdown
  const [staffList, setStaffList] = useState<EmployeeProfile[]>([]);

  // Asset Form State
  const [assetDeviceModelPreset, setAssetDeviceModelPreset] = useState('');
  const [assetDeviceName, setAssetDeviceName] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [assetCategory, setAssetCategory] = useState('Laptop');
  const [assetChargerType, setAssetChargerType] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [customAssignedEmail, setCustomAssignedEmail] = useState('');
  const [staffQuery, setStaffQuery] = useState('');
  const [showStaffSuggestions, setShowStaffSuggestions] = useState(false);

  // Accessories checkboxes
  const [hasMouse, setHasMouse] = useState(true);
  const [hasKeyboard, setHasKeyboard] = useState(true);
  const [hasBag, setHasBag] = useState(true);
  const [hasHeadset, setHasHeadset] = useState(false);
  const [hasAdapterCable, setHasAdapterCable] = useState(true);
  const [hasDisplayCable, setHasDisplayCable] = useState(false);

  // Asset list
  const [assets, setAssets] = useState<HardwareAsset[]>(() => {
    try {
      const saved = localStorage.getItem('easytrack_hardware_assets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Fetch staff list for assignment (including Owner, Admin, HR, Employees)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await apiClient.get<EmployeeProfile[]>('/employees/');
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        setStaffList(list);
      } catch (err) {
        // Fallback
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    if (actionParam === 'issue') {
      setShowIssueForm(true);
    }
  }, [actionParam]);

  const saveAssetsToStorage = (updated: HardwareAsset[]) => {
    setAssets(updated);
    localStorage.setItem('easytrack_hardware_assets', JSON.stringify(updated));
    window.dispatchEvent(new Event('easytrack_hardware_assets_updated'));
  };

  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();

    let targetEmail = customAssignedEmail.trim();
    let targetName = '';
    let targetEmpId = '';

    if (selectedStaffId) {
      const staff = staffList.find(s => String(s.id) === selectedStaffId);
      if (staff) {
        targetEmail = staff.user_details?.email || `${staff.user_details?.username}@company.com`;
        targetName = `${staff.user_details?.first_name || ''} ${staff.user_details?.last_name || ''}`.trim() || `@${staff.user_details?.username}`;
        targetEmpId = staff.employee_id || `EMP-${staff.id}`;
      }
    } else if (staffQuery.trim()) {
      const q = staffQuery.trim().toLowerCase();
      const matched = staffList.find(s => {
        const fullName = `${s.user_details?.first_name || ''} ${s.user_details?.last_name || ''}`.trim().toLowerCase();
        const empId = (s.employee_id || '').toLowerCase();
        const email = (s.user_details?.email || '').toLowerCase();
        return fullName.includes(q) || empId.includes(q) || email.includes(q);
      });
      if (matched) {
        targetEmail = matched.user_details?.email || `${matched.user_details?.username}@company.com`;
        targetName = `${matched.user_details?.first_name || ''} ${matched.user_details?.last_name || ''}`.trim();
        targetEmpId = matched.employee_id || `EMP-${matched.id}`;
      } else {
        targetEmail = staffQuery.trim();
        targetName = staffQuery.trim();
      }
    }

    if (!targetEmail) {
      targetEmail = 'Unassigned';
    }

    const tagToUse = assetTag.trim() || `AST-${Date.now().toString().slice(-4)}`;
    const finalDeviceName = assetDeviceName.trim() || 'ThinkPad L14 Gen 4';
    saveDeviceModelToHistory(finalDeviceName);
    if (assetChargerType) saveChargerSpecToHistory(assetChargerType);

    const newAsset: HardwareAsset = {
      id: tagToUse,
      type: finalDeviceName,
      category: assetCategory,
      chargerType: assetChargerType,
      assignedToEmail: targetEmail,
      assignedTo: targetEmail,
      employeeName: targetName,
      employeeId: targetEmpId,
      date: new Date().toISOString().split('T')[0],
      status: targetEmail !== 'Unassigned' ? 'Active Deployment' : 'In Stock',
      accessories: {
        mouse: hasMouse,
        keyboard: hasKeyboard,
        bag: hasBag,
        headset: hasHeadset,
        adapterCable: hasAdapterCable,
        displayCable: hasDisplayCable
      }
    };

    const updated = [newAsset, ...assets];
    saveAssetsToStorage(updated);

    // Reset form
    setAssetTag('');
    setSelectedStaffId('');
    setCustomAssignedEmail('');
    setStaffQuery('');
    setShowIssueForm(false);
    setMsg(`Asset ${tagToUse} (${newAsset.type}) issued and assigned successfully!`);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleReclaimAsset = (id: string) => {
    const updated = assets.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: 'Returned' as const,
          assignedToEmail: 'In Inventory (Returned)'
        };
      }
      return a;
    });
    saveAssetsToStorage(updated);
    setMsg(`Asset ${id} reclaimed and logged as Returned.`);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDeleteAsset = (id: string) => {
    if (!window.confirm(`Are you sure you want to decommission / remove asset ${id}?`)) return;
    const updated = assets.filter(a => a.id !== id);
    saveAssetsToStorage(updated);
    setMsg(`Asset ${id} deleted.`);
    setTimeout(() => setMsg(''), 3000);
  };

  // Filtered Assets
  const filteredAssets = assets.filter(a => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && a.status !== 'Active Deployment') return false;
      if (statusFilter === 'returned' && a.status !== 'Returned') return false;
      if (statusFilter === 'stock' && a.status !== 'In Stock') return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (a.id || '').toLowerCase().includes(q) ||
      (a.type || '').toLowerCase().includes(q) ||
      (a.assignedToEmail || '').toLowerCase().includes(q) ||
      (a.employeeName || '').toLowerCase().includes(q) ||
      (a.employeeId || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q)
    );
  });

  const activeCount = assets.filter(a => a.status === 'Active Deployment').length;
  const inStockCount = assets.filter(a => a.status === 'In Stock' || a.status === 'Returned').length;

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans max-w-7xl mx-auto py-2">
      {msg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex justify-between items-center shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {msg}
          </span>
          <button onClick={() => setMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
              title="Go Back"
              aria-label="Go Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="p-2.5 bg-brand-primary-light text-brand-primary rounded-xl">
              <Laptop className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Hardware Asset Management
              </h1>
              <p className="text-xs text-slate-400">
                Register company hardware devices, assign laptops & peripherals to staff, and track company hardware inventory.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowIssueForm(prev => !prev)}
            className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer whitespace-nowrap"
          >
            {showIssueForm ? (
              <>
                <X className="h-4 w-4" />
                <span>Close Issue Form</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>+ Issue New Asset</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Telemetry Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-slate-400" />
            Total Assets
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {assets.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tracked company devices</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-150 dark:border-emerald-950/50 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5" />
            Active Deployments
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {activeCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Assigned to employees</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-amber-150 dark:border-amber-950/50 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            In Stock / Returned
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {inStockCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Ready for re-allocation</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Standard Models
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            Lenovo / Dell / Apple
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Standard hardware stock</p>
        </div>
      </div>

      {/* ISSUE ASSET FORM (Expandable / Toggleable) */}
      {showIssueForm && (
        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-brand-primary/40 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-brand-primary" />
                Issue & Allocate Hardware Asset
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select device model, specify charger, assign to employee, and check issued accessories.
              </p>
            </div>
            <button 
              onClick={() => setShowIssueForm(false)} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleRegisterAsset} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Device Specifications & Tag */}
              <div className="space-y-3">
                {/* Device Name / Model Input with dynamic typing and search history */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Device Model / Name *
                  </label>
                  <DynamicDeviceInput
                    value={assetDeviceName}
                    onChange={(val) => setAssetDeviceName(val)}
                    placeholder="Type device name (e.g. Lenovo A2, ThinkPad L14)..."
                    required
                  />
                </div>

                {/* Device Tag & Category */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Asset Tag Number
                    </label>
                    <input
                      type="text"
                      value={assetTag}
                      onChange={(e) => setAssetTag(e.target.value)}
                      placeholder="e.g. AST-105"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Category
                    </label>
                    <select
                      value={assetCategory}
                      onChange={(e) => setAssetCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop PC">Desktop PC</option>
                      <option value="Mac Mini">Mac Mini</option>
                      <option value="Monitor">Monitor Display</option>
                      <option value="Tablet / Mobile">Tablet / Mobile</option>
                      <option value="Accessories Kit">Accessories Kit</option>
                    </select>
                  </div>
                </div>

                {/* Charger Type */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Charger / Power Specs
                  </label>
                  <DynamicChargerInput
                    value={assetChargerType}
                    onChange={(val) => setAssetChargerType(val)}
                    placeholder="Type charger / power specs (e.g. 65W Type-C, 140W MagSafe)..."
                    required
                  />
                </div>
              </div>

              {/* Right Column: Employee Assignment & Accessories */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Assign to Staff Member
                    </label>
                    {user && (
                      <button
                        type="button"
                        onClick={() => {
                          const selfStaff = staffList.find(s => String(s.user_details?.id) === String(user.id) || s.user_details?.email === user.email);
                          const nameStr = selfStaff ? `${selfStaff.user_details?.first_name || ''} ${selfStaff.user_details?.last_name || ''}`.trim() : (user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.username);
                          const empIdStr = selfStaff?.employee_id ? `[${selfStaff.employee_id}] ` : '';
                          const fullLabel = `${empIdStr}${nameStr} (${user.email || 'Self'})`;
                          
                          setStaffQuery(fullLabel);
                          if (selfStaff) {
                            setSelectedStaffId(String(selfStaff.id));
                            setCustomAssignedEmail('');
                          } else {
                            setSelectedStaffId('');
                            setCustomAssignedEmail(user.email || '');
                          }
                          setShowStaffSuggestions(false);
                        }}
                        className="text-[10px] font-bold text-brand-primary hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <User className="h-3 w-3" />
                        Assign to Myself
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={staffQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStaffQuery(val);
                        setSelectedStaffId('');
                        setCustomAssignedEmail(val);
                        if (!showStaffSuggestions) setShowStaffSuggestions(true);
                      }}
                      onFocus={() => setShowStaffSuggestions(true)}
                      placeholder="Type employee name, ID, or email..."
                      className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />

                    {showStaffSuggestions && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-100">
                        {staffList
                          .filter(s => {
                            if (!staffQuery.trim()) return true;
                            const q = staffQuery.toLowerCase().trim();
                            const fn = `${s.user_details?.first_name || ''} ${s.user_details?.last_name || ''}`.toLowerCase();
                            const eid = (s.employee_id || '').toLowerCase();
                            const em = (s.user_details?.email || '').toLowerCase();
                            const dept = (s.department || s.user_details?.role || '').toLowerCase();
                            return fn.includes(q) || eid.includes(q) || em.includes(q) || dept.includes(q);
                          })
                          .map(s => {
                            const empIdStr = s.employee_id ? `[${s.employee_id}] ` : '';
                            const nameStr = `${s.user_details?.first_name || ''} ${s.user_details?.last_name || ''}`.trim() || `@${s.user_details?.username}`;
                            const labelStr = `${empIdStr}${nameStr} (${s.user_details?.email || s.department || 'Staff'})`;

                            return (
                              <div
                                key={s.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setStaffQuery(labelStr);
                                  setSelectedStaffId(String(s.id));
                                  setCustomAssignedEmail('');
                                  setShowStaffSuggestions(false);
                                }}
                                className="px-3.5 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium text-slate-800 dark:text-slate-200 transition-colors flex justify-between items-center"
                              >
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white">{empIdStr}{nameStr}</span>
                                  <span className="text-[10px] text-slate-400 block">{s.department || s.user_details?.role} • {s.user_details?.email}</span>
                                </div>
                                <span className="text-[10px] font-bold text-brand-primary bg-brand-primary-light px-2 py-0.5 rounded">Select</span>
                              </div>
                            );
                          })}
                        
                        {staffQuery.trim() && (
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedStaffId('');
                              setCustomAssignedEmail(staffQuery.trim());
                              setShowStaffSuggestions(false);
                            }}
                            className="px-3.5 py-2 text-xs text-brand-primary font-bold hover:bg-brand-primary-light cursor-pointer flex items-center justify-between"
                          >
                            <span>Use custom entry: "{staffQuery.trim()}"</span>
                            <span className="text-[10px] uppercase font-bold bg-brand-primary-light px-2 py-0.5 rounded">Direct Text</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Accessories Checkboxes */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Issued Accessories & Peripherals Checkboxes
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <label className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasMouse}
                        onChange={(e) => setHasMouse(e.target.checked)}
                        className="h-3.5 w-3.5 rounded text-brand-primary focus:ring-brand-primary"
                      />
                      <span>Optical Mouse</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasKeyboard}
                        onChange={(e) => setHasKeyboard(e.target.checked)}
                        className="h-3.5 w-3.5 rounded text-brand-primary focus:ring-brand-primary"
                      />
                      <span>External Keyboard</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasBag}
                        onChange={(e) => setHasBag(e.target.checked)}
                        className="h-3.5 w-3.5 rounded text-brand-primary focus:ring-brand-primary"
                      />
                      <span>Laptop Bag / Sleeve</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasHeadset}
                        onChange={(e) => setHasHeadset(e.target.checked)}
                        className="h-3.5 w-3.5 rounded text-brand-primary focus:ring-brand-primary"
                      />
                      <span>Headset with Mic</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasAdapterCable}
                        onChange={(e) => setHasAdapterCable(e.target.checked)}
                        className="h-3.5 w-3.5 rounded text-brand-primary focus:ring-brand-primary"
                      />
                      <span>Power Cord</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasDisplayCable}
                        onChange={(e) => setHasDisplayCable(e.target.checked)}
                        className="h-3.5 w-3.5 rounded text-brand-primary focus:ring-brand-primary"
                      />
                      <span>HDMI / Display Cord</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowIssueForm(false)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Register & Issue Asset</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Asset Inventory Table */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Hardware Asset Registry ({filteredAssets.length})
            </h2>
            <p className="text-xs text-slate-400">
              Complete company hardware registry with serial numbers and issued accessories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Status Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All ({assets.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-lg transition ${statusFilter === 'active' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Deployed ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('stock')}
                className={`px-3 py-1 rounded-lg transition ${statusFilter === 'stock' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Returned / Stock ({inStockCount})
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search device, tag, staff..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="p-3.5 pl-5">Device Tag / Model</th>
                <th className="p-3.5">Assigned Employee</th>
                <th className="p-3.5">Charger / Specs</th>
                <th className="p-3.5">Issued Accessories</th>
                <th className="p-3.5">Deployment Status</th>
                <th className="p-3.5 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAssets.map(ass => (
                <tr key={ass.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                  {/* Device & Tag */}
                  <td className="p-3.5 pl-5">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-brand-primary-light text-brand-primary rounded-lg">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{ass.type}</p>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-brand-primary px-1.5 py-0.5 rounded font-mono font-bold">
                          {ass.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Assigned Employee */}
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {ass.employeeName || ass.assignedToEmail || ass.assignedTo || 'Unassigned'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {ass.employeeId ? `${ass.employeeId} • ` : ''}{ass.assignedToEmail}
                    </p>
                    <span className="text-[10px] text-slate-400">Date: {ass.date || 'Active'}</span>
                  </td>

                  {/* Charger */}
                  <td className="p-3.5">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{ass.chargerType}</p>
                    <span className="text-[10px] text-slate-400">{ass.category || 'Hardware'}</span>
                  </td>

                  {/* Accessories */}
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {ass.accessories?.mouse && (
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-semibold">
                          Mouse
                        </span>
                      )}
                      {ass.accessories?.keyboard && (
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-semibold">
                          Keyboard
                        </span>
                      )}
                      {ass.accessories?.bag && (
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-semibold">
                          Bag
                        </span>
                      )}
                      {ass.accessories?.headset && (
                        <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded text-[10px] font-semibold">
                          Headset
                        </span>
                      )}
                      {ass.accessories?.adapterCable && (
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-semibold">
                          Power Cord
                        </span>
                      )}
                      {ass.accessories?.displayCable && (
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-semibold">
                          HDMI Cord
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-3.5">
                    {ass.status === 'Active Deployment' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active Deployment
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {ass.status}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right pr-5 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {ass.status === 'Active Deployment' && (
                        <button
                          type="button"
                          onClick={() => handleReclaimAsset(ass.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 text-[11px] font-bold transition cursor-pointer"
                          title="Return / Reclaim to inventory"
                        >
                          Return
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(ass.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    No hardware assets found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssetManagementPage;
