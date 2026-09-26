import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/client';
import { 
  LayoutDashboard, Users, UserSquare2, Briefcase, FileText, CheckSquare, 
  MessageSquare, Settings, LogOut, Sun, Moon, Bell, HelpCircle, ShieldAlert,
  FolderKanban, Target, Award, DollarSign, CalendarDays, ClipboardList, Zap, Palette,
  UserCheck, History, Lock, Key, Search, ChevronRight, Volume2, VolumeX, X,
  Megaphone, BookOpen, Clock, Activity, FileDigit, Laptop, TrendingUp, ShieldCheck, Cpu, UserPlus
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

export const DashboardLayout: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const [brandColor, setBrandColor] = useState<string>(() => {
    const saved = localStorage.getItem('brand_color');
    return (saved && ['sage', 'rose', 'lavender', 'peach', 'sky', 'indigo'].includes(saved)) ? saved : 'sage';
  });
  const [showCustomize, setShowCustomize] = useState(false);
  const [attendanceState, setAttendanceState] = useState<string | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Global Header States
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any>({ people: [], projects: [], clients: [], tasks: [] });

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, title: "SLA Alert", desc: "Apex Claims Project is approaching SLA breach threshold (2 hours remaining).", time: "10 mins ago", type: "warning", unread: true },
    { id: 2, title: "Overtime Filed", desc: "Employee emp3 submitted 4.5 hours overtime for approval.", time: "1 hour ago", type: "info", unread: true },
    { id: 3, title: "Critical Escalation", desc: "Client Beacon Medical Group logged a critical claims denial rate hike.", time: "2 hours ago", type: "critical", unread: true },
    { id: 4, title: "Shift Checklist", desc: "TL Vikram Rathore submitted the daily operations checklist.", time: "4 hours ago", type: "success", unread: false }
  ]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Profile Dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Account Settings Form States
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Password Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Message Sound State
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('message_muted') === 'true';
  });
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    // Initialize Theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch conversations count to check for new messages
  const fetchConversationsCount = async () => {
    try {
      const res = await apiClient.get<any[]>('/messages/conversations/');
      const totalUnread = res.data.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      
      // Play chime if unread message count increases
      if (totalUnread > unreadMessageCount && !isMuted) {
        const audio = new Audio("https://actions.google.com/sounds/v1/alerts/chime.ogg");
        audio.play().catch(() => {});
      }
      setUnreadMessageCount(totalUnread);
    } catch (err) {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchConversationsCount();
    const interval = setInterval(fetchConversationsCount, 5000);
    return () => clearInterval(interval);
  }, [unreadMessageCount, isMuted]);

  // Fetch today attendance for employees
  const fetchTodayAttendance = async () => {
    if (user?.role !== 'employee') return;
    try {
      const res = await apiClient.get('/attendance/today/');
      if (res.data && res.data.status) {
        setAttendanceState(res.data.status);
      } else {
        setAttendanceState('not_checked_in');
      }
    } catch (err) {
      setAttendanceState('not_checked_in');
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, [user]);

  const handleAttendanceAction = async (action: 'check-in' | 'break-start' | 'break-end' | 'check-out') => {
    setAttendanceLoading(true);
    try {
      const res = await apiClient.post(`/attendance/${action}/`);
      if (res.data && res.data.status) {
        setAttendanceState(res.data.status);
      } else {
        await fetchTodayAttendance();
      }
    } catch (err) {
      console.error("Attendance action error:", err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    localStorage.setItem('message_muted', String(nextMute));
  };

  // Grouped Navigation structure for CEO
  const getNavigationGroups = () => {
    if (!user) return [];

    const baseItems: SidebarItem[] = [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ];

    if (user.role === 'ceo') {
      return [
        {
          title: "OVERVIEW",
          items: [
            ...baseItems,
            { name: 'Announcements', path: '/announcements', icon: Megaphone }
          ]
        },
        {
          title: "BUSINESS",
          items: [
            { name: 'Workforce', path: '/employees', icon: Users },
            { name: 'Clients', path: '/clients', icon: UserSquare2 },
            { name: 'Projects', path: '/projects', icon: FolderKanban },
            { name: 'Billing Work', path: '/billing', icon: DollarSign },
          ]
        },
        {
          title: "FINANCIAL",
          items: [
            { name: 'Payroll Dashboard', path: '/payroll-processing', icon: DollarSign }
          ]
        },
        {
          title: "RECRUITMENT",
          items: [
            { name: 'Hiring Pipeline', path: '/recruitment', icon: UserPlus }
          ]
        },
        {
          title: "CONTROL",
          items: [
            { name: 'Roles & Permissions', path: '/roles-permissions', icon: ShieldCheck },
            { name: 'Audit Logs', path: '/audit', icon: ClipboardList },
            { name: 'Settings', path: '/settings', icon: Settings },
          ]
        },
        {
          title: "COMMUNICATION",
          items: [
            { name: 'Messages', path: '/chat', icon: MessageSquare }
          ]
        }
      ];
    }

    if (user.role === 'operations_head') {
      return [
        {
          title: "OVERVIEW",
          items: [
            ...baseItems,
            { name: 'Announcements', path: '/announcements', icon: Megaphone }
          ]
        },
        {
          title: "PORTFOLIO",
          items: [
            { name: 'Clients', path: '/clients', icon: UserSquare2 },
            { name: 'Processes', path: '/processes', icon: FileText },
            { name: 'Projects', path: '/projects', icon: FolderKanban }
          ]
        },
        {
          title: "OPERATIONS & METRICS",
          items: [
            { name: 'Work Allocation', path: '/billing', icon: ClipboardList },
            { name: 'Tasks', path: '/tasks', icon: CheckSquare },
            { name: 'Billing Metrics', path: '/billing-metrics', icon: TrendingUp },
            { name: 'Escalations', path: '/escalations', icon: ShieldAlert },
            { name: 'Quality Trends', path: '/quality-management', icon: ShieldCheck },
            { name: 'Workforce Roster', path: '/scheduling', icon: Clock },
            { name: 'Workflow Automation', path: '/automation', icon: Cpu },
            { name: 'Settings', path: '/settings', icon: Settings }
          ]
        },
        {
          title: "KNOWLEDGE",
          items: [
            { name: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen }
          ]
        },
        {
          title: "COMMUNICATION",
          items: [
            { name: 'Messages', path: '/chat', icon: MessageSquare }
          ]
        }
      ];
    }

    if (user.role === 'tl') {
      return [
        {
          title: "OVERVIEW",
          items: [
            ...baseItems,
            { name: 'Announcements', path: '/announcements', icon: Megaphone }
          ]
        },
        {
          title: "TEAM MANAGEMENT",
          items: [
            { name: 'My Team', path: '/employees', icon: Users },
            { name: 'Shift Roster', path: '/scheduling', icon: Clock },
            { name: 'Attendance Logs', path: '/attendance', icon: CalendarDays },
            { name: 'Leave Requests', path: '/leave', icon: FileText }
          ]
        },
        {
          title: "OPERATIONS",
          items: [
            { name: 'Work Allocation', path: '/billing', icon: ClipboardList },
            { name: 'Tasks', path: '/tasks', icon: CheckSquare },
            { name: 'Escalations', path: '/escalations', icon: ShieldAlert },
            { name: 'Team Quality', path: '/quality-management', icon: ShieldCheck },
            { name: 'Team Performance', path: '/performance', icon: Award }
          ]
        },
        {
          title: "KNOWLEDGE",
          items: [
            { name: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen }
          ]
        },
        {
          title: "COMMUNICATION",
          items: [
            { name: 'Messages', path: '/chat', icon: MessageSquare }
          ]
        }
      ];
    }

    if (user.role === 'hr') {
      return [
        {
          title: "OVERVIEW",
          items: [
            ...baseItems,
            { name: 'Announcements', path: '/announcements', icon: Megaphone }
          ]
        },
        {
          title: "TALENT ACQUISITION",
          items: [
            { name: 'Recruitment', path: '/recruitment', icon: UserPlus },
            { name: 'Onboarding', path: '/onboarding', icon: UserCheck }
          ]
        },
        {
          title: "EMPLOYEE MANAGEMENT",
          items: [
            { name: 'Employees List', path: '/employees', icon: Users },
            { name: 'Employee Lifecycle', path: '/lifecycle', icon: Activity },
            { name: 'Employee Documents', path: '/documents', icon: FileDigit },
            { name: 'Offboarding Clearance', path: '/offboarding', icon: LogOut }
          ]
        },
        {
          title: "TIME & SHIFTS",
          items: [
            { name: 'Attendance Logs', path: '/attendance', icon: CalendarDays },
            { name: 'Shift & Roster', path: '/scheduling', icon: Clock },
            { name: 'Leave Requests', path: '/leave', icon: FileText }
          ]
        },
        {
          title: "COMPENSATION & TICKETS",
          items: [
            { name: 'Payroll Processing', path: '/payroll-processing', icon: DollarSign },
            { name: 'HR Helpdesk', path: '/helpdesk', icon: HelpCircle },
            { name: 'Asset Inventory', path: '/assets', icon: Laptop },
            { name: 'Performance Appraisal', path: '/performance', icon: Award }
          ]
        },
        {
          title: "COMMUNICATION",
          items: [
            { name: 'Messages', path: '/chat', icon: MessageSquare }
          ]
        }
      ];
    }

    if (user.role === 'employee') {
      const employeeItems = [
        ...baseItems,
        { name: 'Announcements', path: '/announcements', icon: Megaphone }
      ];

      const workItems = [
        { name: 'My Work Queue', path: '/billing', icon: ClipboardList },
        { name: 'My Tasks', path: '/tasks', icon: CheckSquare },
        { name: 'My Metrics', path: '/billing-metrics', icon: TrendingUp },
        { name: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen }
      ];

      const deskItems = [
        { name: 'My Attendance', path: '/attendance', icon: CalendarDays },
        { name: 'My Leave', path: '/leave', icon: FileText },
        { name: 'My Performance', path: '/performance', icon: Award },
        { name: 'My Documents', path: '/documents', icon: FileDigit },
        { name: 'My Assets', path: '/assets', icon: Laptop },
        { name: 'My Requests', path: '/helpdesk', icon: HelpCircle }
      ];

      const qaWorkspace = [];
      if ((user as any).employee_profile?.qa_enabled) {
        qaWorkspace.push({ name: 'QA Workspace', path: '/qa', icon: ShieldCheck });
      }

      return [
        {
          title: "OVERVIEW",
          items: employeeItems
        },
        {
          title: "MY WORK",
          items: workItems
        },
        {
          title: "MY DESK",
          items: deskItems
        },
        ...(qaWorkspace.length > 0 ? [{ title: "QA SYSTEM", items: qaWorkspace }] : []),
        {
          title: "COMMUNICATION",
          items: [
            { name: 'Messages', path: '/chat', icon: MessageSquare }
          ]
        }
      ];
    }

    return [];
  };

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setGlobalSearch(q);
    if (!q.trim()) {
      setShowSearchResults(false);
      return;
    }
    
    // Perform simulated structured query
    const lower = q.toLowerCase();
    const mockPeople = [
      { id: 'EMP-005', name: "Neelam Gupta", detail: "Billing Associate • Claims" },
      { id: 'EMP-004', name: "Vikram Rathore", detail: "Team Lead • Operations" }
    ].filter(p => p.name.toLowerCase().includes(lower) || p.id.toLowerCase().includes(lower));

    const mockProjects = [
      { id: 'PRJ-1', name: "Apex Claims Project", detail: "Active • Client APEX" },
      { id: 'PRJ-2', name: "Beacon Payment Posting Project", detail: "Active • Client BEACON" }
    ].filter(p => p.name.toLowerCase().includes(lower));

    const mockClients = [
      { id: 'CLI-APEX', name: "Apex Health Partners", detail: "Active Contract" },
      { id: 'CLI-BEACON', name: "Beacon Medical Group", detail: "Active Contract" }
    ].filter(c => c.name.toLowerCase().includes(lower) || c.id.toLowerCase().includes(lower));

    const mockTasks = [
      { id: 'TSK-101', name: "Review SOP for Denial Management", detail: "In Progress" },
      { id: 'TSK-102', name: "Update Apex Credentialing details", detail: "Backlog" }
    ].filter(t => t.name.toLowerCase().includes(lower) || t.id.toLowerCase().includes(lower));

    setSearchResults({
      people: mockPeople,
      projects: mockProjects,
      clients: mockClients,
      tasks: mockTasks
    });
    setShowSearchResults(true);
  };

  const handleSearchResultClick = (path: string) => {
    navigate(path);
    setGlobalSearch('');
    setShowSearchResults(false);
  };

  // Notification management
  const markAllNotifsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markNotifRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const unreadNotifCount = notifications.filter(n => n.unread).length;

  const handleAccountSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('');
    if (user) {
      updateUser({
        ...user,
        first_name: firstName,
        last_name: lastName,
        email: email
      });
      setSettingsSuccess('Account parameters updated successfully!');
      setTimeout(() => {
        setShowSettingsModal(false);
        setSettingsSuccess('');
      }, 1500);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    try {
      await apiClient.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setPassSuccess('Password changed! Re-authenticating in 2s...');
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err: any) {
      setPassError(err.response?.data?.old_password?.[0] || err.response?.data?.error || 'Password verification failed.');
    }
  };

  const colorThemes: Record<string, { primary: string; hover: string; bgLight: string; text: string }> = {
    sage: { primary: '#0d9488', hover: '#0f766e', bgLight: '#f0fdfa', text: '#0f766e' },
    rose: { primary: '#f87171', hover: '#ef4444', bgLight: '#fef2f2', text: '#b91c1c' },
    lavender: { primary: '#c084fc', hover: '#a855f7', bgLight: '#faf5ff', text: '#6b21a8' },
    peach: { primary: '#fbbf24', hover: '#f59e0b', bgLight: '#fffbeb', text: '#b45309' },
    sky: { primary: '#38bdf8', hover: '#0ea5e9', bgLight: '#f0f9ff', text: '#0369a1' },
    indigo: { primary: '#6366f1', hover: '#4f46e5', bgLight: '#e0e7ff', text: '#3730a3' }
  };

  const themeData = colorThemes[brandColor] || colorThemes.sage;
  const navGroups = getNavigationGroups();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0 flex-col w-64 bg-slate-950 text-white border-r border-slate-900 shadow-lg">
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Tenant Branding Header */}
          <div className="flex flex-col px-6 py-5 border-b border-slate-800">
            <span className="text-xl font-semibold tracking-tight text-white flex items-center">
              ◈ EasyTrack
            </span>
            <span className="text-[11px] tracking-wide font-medium text-slate-500 mt-1 truncate">
              {user?.organization_name || 'Medical Operations'}
            </span>
          </div>

          {/* Navigation Links Grouped */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                {group.title && (
                  <h4 className="px-4 text-[11px] font-medium tracking-wide text-slate-500 capitalize">
                    {group.title.toLowerCase()}
                  </h4>
                )}
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 focus:outline-none ${
                        isActive 
                          ? 'shadow-sm text-slate-950 font-bold' 
                          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                      style={isActive ? { backgroundColor: themeData.primary, color: '#090d16' } : undefined}
                    >
                      <Icon 
                        className="mr-3 h-4 w-4" 
                        style={isActive ? { color: '#090d16' } : { color: '#94a3b8' }}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Settings bar */}
          <div className="p-4 border-t border-slate-850 space-y-1 bg-slate-950/60">
            
            {/* Customize Theme Trigger */}
            <button
              onClick={() => setShowCustomize(!showCustomize)}
              className="flex items-center w-full px-4 py-2 text-xs font-medium text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white"
            >
              <Palette className="mr-3 h-4 w-4 text-slate-500" />
              Palette Manager
            </button>
            {showCustomize && (
              <div className="flex justify-around items-center p-2.5 bg-slate-900 rounded-lg mt-1 border border-slate-850">
                {Object.keys(colorThemes).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setBrandColor(c);
                      localStorage.setItem('brand_color', c);
                    }}
                    className={`h-5 w-5 rounded-full border-2 transition ${
                      brandColor === c ? 'border-white scale-110 shadow-inner' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: colorThemes[c].primary }}
                    title={c}
                  />
                ))}
              </div>
            )}

            {/* Theme Toggle in bottom */}
            <button
              onClick={toggleTheme}
              className="flex items-center w-full px-4 py-2 text-xs font-medium text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="mr-3 h-4 w-4 text-slate-500" />
                  Dark Theme
                </>
              ) : (
                <>
                  <Sun className="mr-3 h-4 w-4 text-brand-primary-pastel text-brand-primary" />
                  Light Theme
                </>
              )}
            </button>

            {/* Settings shortcut link */}
            <Link
              to="/settings"
              className="flex items-center w-full px-4 py-2 text-xs font-medium text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white"
            >
              <Settings className="mr-3 h-4 w-4 text-slate-500" />
              Settings Panel
            </Link>

            {/* User Profile Clicking Widget */}
            <div className="border-t border-slate-850 mt-3 pt-3">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center w-full text-left focus:outline-none hover:bg-slate-900 p-2 rounded-lg transition"
              >
                <div className="h-8 w-8 rounded-full bg-brand-primary text-slate-950 flex items-center justify-center font-semibold text-xs uppercase shadow-inner mr-2.5">
                  {user?.username.substring(0, 2)}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
                  <p className="text-[10px] text-slate-455 tracking-wide truncate capitalize">{user?.role.replace('_', ' ')}</p>
                </div>
              </button>
              
              {/* Profile Menu Popover Overlay */}
              {showProfileMenu && (
                <div className="absolute bottom-16 left-4 z-40 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 text-xs">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="font-bold text-white">{user?.first_name} {user?.last_name}</p>
                    <p className="text-[10px] text-slate-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center"
                  >
                    <Users className="h-3.5 w-3.5 mr-2 text-slate-500" />
                    My Profile Details
                  </button>
                  <button
                    onClick={() => { setShowSettingsModal(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center"
                  >
                    <Settings className="h-3.5 w-3.5 mr-2 text-slate-500" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => { setShowPasswordModal(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center"
                  >
                    <Lock className="h-3.5 w-3.5 mr-2 text-slate-500" />
                    Change Password
                  </button>
                  <button
                    onClick={() => { setShowActivityModal(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center"
                  >
                    <History className="h-3.5 w-3.5 mr-2 text-slate-500" />
                    Login Activity
                  </button>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-red-950/20 text-rose-400 font-bold flex items-center"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    Logout Session
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Inject Dynamic Brand Color Styles */}
        <style>{`
          .bg-brand-primary { background-color: ${themeData.primary} !important; }
          .bg-brand-primary-hover:hover { background-color: ${themeData.hover} !important; }
          .bg-brand-primary-light { background-color: ${themeData.bgLight} !important; }
          .text-brand-primary { color: ${themeData.text} !important; }
          .text-brand-primary-pastel { color: ${themeData.primary} !important; }
          .border-brand-primary { border-color: ${themeData.primary} !important; }
          .focus\\:ring-brand-primary:focus { --tw-ring-color: ${themeData.primary} !important; }
        `}</style>

        {/* Global Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm z-30">
          <div className="flex items-center flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={handleGlobalSearch}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search people, projects, clients, tasks..."
              className="w-full max-w-sm pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs"
            />

            {/* Global Search Results Panel */}
            {showSearchResults && globalSearch.trim() && (
              <div className="absolute top-12 left-0 w-80 bg-white dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl shadow-xl z-50 p-4 max-h-96 overflow-y-auto space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-750 pb-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Search Workspace</p>
                  <button onClick={() => { setGlobalSearch(''); setShowSearchResults(false); }} className="text-slate-400 hover:text-slate-650">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* People results */}
                {searchResults.people.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-455 mb-1.5">Workforce</p>
                    {searchResults.people.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => handleSearchResultClick('/employees')}
                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 rounded flex justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.id}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Project results */}
                {searchResults.projects.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-455 mb-1.5">Projects</p>
                    {searchResults.projects.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => handleSearchResultClick('/projects')}
                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 rounded flex justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Client results */}
                {searchResults.clients.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-455 mb-1.5">Clients</p>
                    {searchResults.clients.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => handleSearchResultClick('/clients')}
                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 rounded flex justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Task results */}
                {searchResults.tasks.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-455 mb-1.5">Tasks</p>
                    {searchResults.tasks.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => handleSearchResultClick('/tasks')}
                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 rounded flex justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{t.name}</span>
                        <span className="text-[10px] text-slate-400">{t.id}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.people.length === 0 && searchResults.projects.length === 0 && searchResults.clients.length === 0 && searchResults.tasks.length === 0 && (
                  <p className="text-slate-400 text-center py-4 text-xs font-semibold">No matches found.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            
            {/* Mute/Unmute message notification toggle */}
            <button
              onClick={handleMuteToggle}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
              title={isMuted ? "Unmute message sounds" : "Mute message sounds"}
            >
              {isMuted ? <VolumeX className="h-4.5 w-4.5 text-rose-500" /> : <Volume2 className="h-4.5 w-4.5 text-teal-600" />}
            </button>

            {/* Attendance state controller (visible to employee role) */}
            {user?.role === 'employee' && attendanceState && (
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
                {attendanceState === 'not_checked_in' && (
                  <button
                    disabled={attendanceLoading}
                    onClick={() => handleAttendanceAction('check-in')}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                  >
                    Check In
                  </button>
                )}
                {attendanceState === 'working' && (
                  <>
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse mx-1"></span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Working</span>
                    <button
                      disabled={attendanceLoading}
                      onClick={() => handleAttendanceAction('break-start')}
                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold"
                    >
                      Break
                    </button>
                    <button
                      disabled={attendanceLoading}
                      onClick={() => handleAttendanceAction('check-out')}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold"
                    >
                      Check Out
                    </button>
                  </>
                )}
                {attendanceState === 'on_break' && (
                  <>
                    <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse mx-1"></span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">On Break</span>
                    <button
                      disabled={attendanceLoading}
                      onClick={() => handleAttendanceAction('break-end')}
                      className="px-3 py-1 bg-brand-primary bg-brand-primary-hover text-white rounded text-xs font-bold"
                    >
                      Resume
                    </button>
                  </>
                )}
                {attendanceState === 'checked_out' && (
                  <span className="text-xs text-slate-400 px-2 font-bold">Shift Ended</span>
                )}
              </div>
            )}

            {/* Notification bell and badge */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifPanel(!showNotifPanel); setShowProfileMenu(false); }}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-rose-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Panel */}
              {showNotifPanel && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-xl shadow-xl z-50 p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-750 pb-2">
                    <p className="font-bold text-slate-900 dark:text-white">Recent Notifications</p>
                    <button
                      onClick={markAllNotifsRead}
                      className="text-[10px] text-brand-primary font-bold hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotifRead(n.id)}
                        className={`p-2.5 rounded-lg border transition cursor-pointer flex flex-col space-y-1 ${
                          n.unread 
                            ? 'bg-slate-50 border-brand-primary dark:bg-slate-800/40' 
                            : 'bg-white border-gray-100 dark:bg-slate-800 dark:border-slate-750'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-bold uppercase tracking-wider text-[9px] ${
                            n.type === 'critical' ? 'text-rose-600' :
                            n.type === 'warning' ? 'text-amber-600' : 'text-brand-primary'
                          }`}>
                            {n.title}
                          </span>
                          <span className="text-[8px] text-slate-400 font-mono">{n.time}</span>
                        </div>
                        <p className="text-slate-650 dark:text-slate-300 font-medium leading-relaxed">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Header User Avatar details */}
            <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-slate-800 pl-4">
              <div className="h-8 w-8 rounded-full bg-brand-primary text-slate-950 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                {user?.username.substring(0, 2)}
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-650 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors"
                title="Logout Session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. Profile Details Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-sm space-y-4 text-xs font-semibold">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <UserCheck className="h-4.5 w-4.5 mr-2 text-brand-primary" />
                My Profile Details
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-455 hover:text-slate-650">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">First Name</p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{user?.first_name || 'Ramesh'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Last Name</p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{user?.last_name || 'Kumar'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Username ID</p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">@{user?.username}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Registered Email</p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">{user?.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Organization Account</p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-bold text-brand-primary">{user?.organization_name || 'Medical Billing'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Authority Role</p>
                <p className="text-slate-800 dark:text-slate-200 capitalize mt-0.5 font-bold">{user?.role.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-slate-750">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-650 rounded"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Account Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-sm space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <Settings className="h-4.5 w-4.5 mr-2 text-brand-primary" />
                Account Configuration
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-455 hover:text-slate-650">
                <X className="h-5 w-5" />
              </button>
            </div>

            {settingsSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 text-xs font-bold rounded">
                {settingsSuccess}
              </div>
            )}

            <form onSubmit={handleAccountSettingsSubmit} className="space-y-3 font-semibold">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-905 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-905 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-905 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-750">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-650 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary bg-brand-primary-hover text-white rounded font-bold"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-855 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-sm space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <Lock className="h-4.5 w-4.5 mr-2 text-brand-primary" />
                Change Account Password
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-455 hover:text-slate-650">
                <X className="h-5 w-5" />
              </button>
            </div>

            {passError && (
              <div className="p-2 bg-red-50 text-red-650 text-xs rounded border border-red-200 font-bold">
                {passError}
              </div>
            )}
            {passSuccess && (
              <div className="p-2 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-200 font-bold">
                {passSuccess}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3 font-semibold">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-905 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-905 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-905 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-750">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-650 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary bg-brand-primary-hover text-white rounded font-bold"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Login Activity / History Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-sm space-y-4 text-xs font-semibold">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <History className="h-4.5 w-4.5 mr-2 text-brand-primary" />
                Login Session History
              </h3>
              <button onClick={() => setShowActivityModal(false)} className="text-slate-455 hover:text-slate-650">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <div className="p-2.5 border border-gray-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-slate-900 dark:text-white text-xs">Active Session (This device)</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">IP: 192.168.1.45 • Chrome/Windows</p>
                </div>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Current</span>
              </div>
              <div className="p-2.5 border border-gray-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-slate-900 dark:text-white text-xs">2 hours ago</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">IP: 103.45.12.89 • Firefox/Linux</p>
                </div>
                <span className="text-[9px] text-slate-400">Success</span>
              </div>
              <div className="p-2.5 border border-gray-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-slate-900 dark:text-white text-xs">Yesterday, 09:30 AM</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">IP: 192.168.1.10 • Safari/Mac</p>
                </div>
                <span className="text-[9px] text-slate-400">Success</span>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-slate-750">
              <button
                onClick={() => setShowActivityModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-650 rounded"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default DashboardLayout;
