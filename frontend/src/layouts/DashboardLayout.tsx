import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDateFilter } from '../context/DateFilterContext';
import apiClient from '../services/api/client';
import EasyTrackLogo from '../components/common/EasyTrackLogo';
import { ActivityAndVolumeController } from '../components/ActivityAndVolumeController';
import { formatRelativeTime } from '../utils/timeUtils';
import { playAnnouncementSound, triggerDesktopNotification, requestDesktopNotificationPermission } from '../utils/soundUtils';
import { 
  LayoutDashboard, Users, UserSquare2, Briefcase, FileText, CheckSquare, 
  MessageSquare, Settings, LogOut, Sun, Moon, Bell, HelpCircle, ShieldAlert,
  FolderKanban, Target, Award, DollarSign, CalendarDays, ClipboardList, Zap, Palette,
  UserCheck, History, Lock, Key, Search, ChevronRight, Volume2, VolumeX, X,
  Megaphone, BookOpen, Clock, Activity, FileDigit, Laptop, TrendingUp, ShieldCheck, Cpu, UserPlus, Eye, EyeOff, Menu, Calendar, Building2
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

  // Sidebar Minimizer & Responsive Drawer States (for all portals)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('easytrack_sidebar_collapsed') === 'true';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('easytrack_sidebar_collapsed', String(next));
      return next;
    });
  };
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const [brandColor, setBrandColor] = useState<string>(() => {
    const isCustomized = localStorage.getItem('brand_color_customized') === 'true';
    const saved = localStorage.getItem('brand_color');
    if (isCustomized && saved && ['green', 'sage', 'rose', 'lavender', 'peach', 'sky', 'indigo'].includes(saved)) {
      return saved;
    }
    return 'green';
  });

  useEffect(() => {
    const handleColorChange = () => {
      const isCustomized = localStorage.getItem('brand_color_customized') === 'true';
      const saved = localStorage.getItem('brand_color');
      if (isCustomized && saved && ['green', 'sage', 'rose', 'lavender', 'peach', 'sky', 'indigo'].includes(saved)) {
        setBrandColor(saved);
      } else {
        setBrandColor('green');
      }
    };
    window.addEventListener('easytrack_brand_color_changed', handleColorChange);
    window.addEventListener('storage', handleColorChange);
    return () => {
      window.removeEventListener('easytrack_brand_color_changed', handleColorChange);
      window.removeEventListener('storage', handleColorChange);
    };
  }, []);
  const [showCustomize, setShowCustomize] = useState(false);
  const [attendanceState, setAttendanceState] = useState<string | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Global Header States
  const { selectedDate, setSelectedDate, isoDate, setIsoDate } = useDateFilter();
  const headerDateInputRef = useRef<HTMLInputElement>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any>({ people: [], projects: [], clients: [], tasks: [] });
  const [searchStaffList, setSearchStaffList] = useState<any[]>([]);

  useEffect(() => {
    const fetchStaffForSearch = async () => {
      try {
        const endpoint = ['admin', 'ceo', 'hr', 'operations_head'].includes(user?.role || '')
          ? '/employees/'
          : '/employees/search/';
        const res = await apiClient.get<any[]>(endpoint);
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        setSearchStaffList(list);
      } catch {
        // Fallback
      }
    };
    if (user) {
      fetchStaffForSearch();
    }
  }, [user]);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('easytrack_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Announcements State for Sidebar & Sound Notifications
  const [sidebarAnnouncements, setSidebarAnnouncements] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('easytrack_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [lastAnnCount, setLastAnnCount] = useState<number>(() => {
    return Number(localStorage.getItem('easytrack_ann_count') || 0);
  });
  const [readAnnCount, setReadAnnCount] = useState<number>(() => {
    return Number(localStorage.getItem('easytrack_read_ann_count') || 0);
  });

  const activeUnreadAnnCount = location.pathname === '/announcements' ? 0 : Math.max(0, sidebarAnnouncements.length - readAnnCount);

  useEffect(() => {
    if (location.pathname === '/announcements') {
      setReadAnnCount(sidebarAnnouncements.length);
      localStorage.setItem('easytrack_read_ann_count', String(sidebarAnnouncements.length));
    }
  }, [location.pathname, sidebarAnnouncements.length]);

  useEffect(() => {
    requestDesktopNotificationPermission();
  }, []);

  const fetchAnnouncementsForSidebar = async () => {
    try {
      const res = await apiClient.get<any[]>('/announcements/');
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      if (data.length > lastAnnCount && lastAnnCount > 0) {
        const latestAnn = data[0];
        const annKey = `announcement-${latestAnn?.id || latestAnn?.title || data.length}`;
        const isMasterMuted = localStorage.getItem('easytrack_sound_muted') === 'true' || 
                              localStorage.getItem('announcement_sound_muted') === 'true';
        playAnnouncementSound(isMasterMuted);
        triggerDesktopNotification(
          "New Announcement",
          latestAnn?.title || "A new announcement has been published.",
          annKey
        );
      }
      setLastAnnCount(data.length);
      localStorage.setItem('easytrack_ann_count', String(data.length));
      setSidebarAnnouncements(data);
      localStorage.setItem('easytrack_announcements', JSON.stringify(data));
    } catch (err) {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchAnnouncementsForSidebar();
    const interval = setInterval(fetchAnnouncementsForSidebar, 7000);
    const handleNewAnnEvent = () => fetchAnnouncementsForSidebar();
    window.addEventListener('easytrack_new_announcement', handleNewAnnEvent);
    return () => {
      clearInterval(interval);
      window.removeEventListener('easytrack_new_announcement', handleNewAnnEvent);
    };
  }, [lastAnnCount]);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get<any[]>('/notifications/');
      const apiData = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      const savedLocal = JSON.parse(localStorage.getItem('easytrack_notifications') || '[]');
      
      const combined = [...savedLocal];
      apiData.forEach((item: any) => {
        if (!combined.some((c: any) => c.id === item.id)) {
          combined.push(item);
        }
      });
      
      setNotifications(combined);
      localStorage.setItem('easytrack_notifications', JSON.stringify(combined));
    } catch (err) {
      try {
        const savedLocal = JSON.parse(localStorage.getItem('easytrack_notifications') || '[]');
        setNotifications(savedLocal);
      } catch {}
    }
  };

  const checkTaskAssignmentsForDesktopNotification = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get<any[]>('/tasks/');
      const tasks = res.data || [];
      const notifiedIds: number[] = JSON.parse(localStorage.getItem('easytrack_notified_task_ids') || '[]');
      let updatedNotified = [...notifiedIds];

      tasks.forEach((t: any) => {
        const isAssignedToMe = (t.assignee && t.assignee === user.id) ||
          (t.assignee_id && t.assignee_id === user.id) ||
          (t.assignee_name && t.assignee_name.toLowerCase().includes(user.username.toLowerCase())) ||
          (user.role === 'tl' && (t.team_lead === user.id || t.team_lead_name?.toLowerCase().includes(user.username.toLowerCase())));

        if (isAssignedToMe && !updatedNotified.includes(t.id)) {
          updatedNotified.push(t.id);
          triggerDesktopNotification(
            `Task Assigned: ${t.key || 'TSK'}`,
            `You have been assigned a task: "${t.title}". Status: ${t.status || 'To Do'}`
          );
        }
      });

      if (updatedNotified.length !== notifiedIds.length) {
        localStorage.setItem('easytrack_notified_task_ids', JSON.stringify(updatedNotified));
      }
    } catch (err) {
      // Offline fallback
    }
  };

  useEffect(() => {
    requestDesktopNotificationPermission();
    fetchNotifications();
    checkTaskAssignmentsForDesktopNotification();

    const intervalNotif = setInterval(fetchNotifications, 5000);
    const intervalTaskNotif = setInterval(checkTaskAssignmentsForDesktopNotification, 6000);

    const handleNotifEvent = () => {
      try {
        const savedLocal = JSON.parse(localStorage.getItem('easytrack_notifications') || '[]');
        setNotifications(savedLocal);
      } catch {}
    };

    window.addEventListener('easytrack_notifications_updated', handleNotifEvent);
    window.addEventListener('storage', handleNotifEvent);
    window.addEventListener('easytrack_task_assigned', checkTaskAssignmentsForDesktopNotification);

    return () => {
      clearInterval(intervalNotif);
      clearInterval(intervalTaskNotif);
      window.removeEventListener('easytrack_notifications_updated', handleNotifEvent);
      window.removeEventListener('storage', handleNotifEvent);
      window.removeEventListener('easytrack_task_assigned', checkTaskAssignmentsForDesktopNotification);
    };
  }, [user]);

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
  const [showOldPasswordModal, setShowOldPasswordModal] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [showConfirmPasswordModal, setShowConfirmPasswordModal] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Master Sound State for all portals
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('easytrack_sound_muted') === 'true' || 
           localStorage.getItem('message_muted') === 'true' || 
           localStorage.getItem('announcement_sound_muted') === 'true';
  });
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const activeUnreadMsgCount = location.pathname === '/chat' ? 0 : unreadMessageCount;

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
      const totalUnread = res.data.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
      
      // Play chime & trigger desktop notification if unread message count increases
      if (totalUnread > unreadMessageCount) {
        const isMasterMuted = localStorage.getItem('easytrack_sound_muted') === 'true' || 
                              localStorage.getItem('message_muted') === 'true';
        playAnnouncementSound(isMasterMuted);
        triggerDesktopNotification(
          "New Message Received",
          "You have received a new message on EasyTrack."
        );
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
        try { localStorage.setItem('easytrack_attendance_today', JSON.stringify(res.data)); } catch {}
        window.dispatchEvent(new CustomEvent('easytrack_attendance_updated', { detail: res.data }));
      } else {
        await fetchTodayAttendance();
      }
    } catch (err) {
      console.error("Attendance action error:", err);
      // Local fallback for offline/demo state
      const nowIso = new Date().toISOString();
      const localStatus = action === 'check-in' ? 'working' : action === 'break-start' ? 'on_break' : action === 'break-end' ? 'working' : 'checked_out';
      setAttendanceState(localStatus);
      const mockRecord = {
        date: new Date().toISOString().split('T')[0],
        status: localStatus,
        check_in: nowIso,
        check_out: action === 'check-out' ? nowIso : null,
      };
      try { localStorage.setItem('easytrack_attendance_today', JSON.stringify(mockRecord)); } catch {}
      window.dispatchEvent(new CustomEvent('easytrack_attendance_updated', { detail: mockRecord }));
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
    localStorage.setItem('easytrack_sound_muted', String(nextMute));
    localStorage.setItem('message_muted', String(nextMute));
    localStorage.setItem('announcement_sound_muted', String(nextMute));
  };

  // Grouped Navigation structure for CEO
  const getNavigationGroups = () => {
    if (!user) return [];

    const getDashboardPath = () => {
      if (user.role === 'admin' || user.role === 'ceo') {
        const hasFinance = Boolean(user.is_owner || user.finance_access);
        return hasFinance ? '/ceo-dashboard' : '/operations-dashboard';
      }
      if (user.role === 'operations_head') return '/operations-dashboard';
      if (user.role === 'hr') return '/hr-dashboard';
      if (user.role === 'tl') return '/tl-dashboard';
      return '/employee-dashboard';
    };

    const dashboardPath = getDashboardPath();

    const baseItems: SidebarItem[] = [
      { name: 'Dashboard', path: dashboardPath, icon: LayoutDashboard },
      { name: 'Communication', path: '/communication', icon: MessageSquare },
      { name: 'My Desk', path: '/my-desk', icon: Briefcase },
      ...(!user.is_owner ? [{ name: 'Profile Setup', path: '/profile-setup', icon: UserCheck }] : []),
    ];

    if (['admin', 'ceo', 'operations_head', 'hr', 'tl'].includes(user.role)) {
      baseItems.splice(3, 0, { name: 'Attendance', path: '/employee-attendance', icon: CalendarDays });
    }

    if (['admin', 'ceo', 'operations_head', 'hr'].includes(user.role)) {
      baseItems.splice(3, 0, { name: 'Workforce & Access', path: '/employees', icon: Users });
    }

    const isAdmin = user.role === 'admin' || user.role === 'ceo' || user.role === 'operations_head';
    const hasFinanceAccess = Boolean(user.is_owner || user.finance_access);

    if (isAdmin) {
      if (hasFinanceAccess) {
        return [
          {
            title: "EXECUTIVE SUITE",
            items: [
              { name: 'Dashboard', path: '/ceo-dashboard', icon: LayoutDashboard },
              { name: 'Communication', path: '/communication', icon: MessageSquare },
              { name: 'My Desk', path: '/my-desk', icon: Briefcase },
              ...(!user.is_owner ? [{ name: 'Profile Setup', path: '/profile-setup', icon: UserCheck }] : []),
            ]
          },
          {
            title: "ENTERPRISE PORTFOLIO",
            items: [
              { name: 'Business Portfolio', path: '/portfolio', icon: FolderKanban },
              { name: 'Workforce & Access', path: '/employees', icon: Users },
              { name: 'Time & Attendance', path: '/employee-attendance', icon: CalendarDays },
              { name: 'Payroll & Compensation', path: '/payroll', icon: DollarSign },
              { name: 'Task Tracking & Assign', path: '/tasks', icon: CheckSquare },
              { name: 'Recruitment', path: '/recruitment', icon: UserPlus },
              { name: 'Asset Management', path: '/asset-management', icon: Laptop },
            ]
          },
          {
            title: "ORGANISATION & GOVERNANCE",
            items: [
              { name: 'Company Profile', path: '/company-profile', icon: Building2 },
              { name: 'Roles & Permissions', path: '/roles-permissions', icon: ShieldCheck },
              { name: 'Audit Logs', path: '/audit', icon: ClipboardList },
            ]
          }
        ];
      } else {
        return [
          {
            title: "OPERATIONS OVERVIEW",
            items: [
              ...baseItems,
              { name: 'Announcements', path: '/announcements', icon: Megaphone }
            ]
          },
          {
            title: "PORTFOLIO & ASSETS",
            items: [
              { name: 'Asset Management', path: '/asset-management', icon: Laptop }
            ]
          },
          {
            title: "OPERATIONS & METRICS",
            items: [
              { name: 'Task Tracking & Assign', path: '/tasks', icon: CheckSquare },
              { name: 'Performance Metrics', path: '/billing-metrics', icon: TrendingUp },
              { name: 'Escalations', path: '/escalations', icon: ShieldAlert },
              { name: 'Quality Trends', path: '/quality-management', icon: ShieldCheck },
              { name: 'Workforce Roster', path: '/scheduling', icon: Clock },
              { name: 'Workflow Automation', path: '/automation', icon: Cpu },
            ]
          },
          {
            title: "ORGANISATION & SYSTEM",
            items: [
              { name: 'Company Profile', path: '/company-profile', icon: Building2 },
              { name: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen },
              { name: 'Messages', path: '/chat', icon: MessageSquare },
            ]
          }
        ];
      }
    }

    if (user.role === 'tl') {
      return [
        {
          title: "OVERVIEW",
          items: [
            ...baseItems
          ]
        },
        {
          title: "TEAM MANAGEMENT",
          items: [
            { name: 'Shift Roster', path: '/scheduling', icon: Clock }
          ]
        },
        {
          title: "OPERATIONS",
          items: [
            { name: 'Task Tracking & Assign', path: '/tasks', icon: CheckSquare },
            { name: 'Escalations', path: '/escalations', icon: ShieldAlert },
            { name: 'Team Quality', path: '/quality-management', icon: ShieldCheck }
          ]
        },
        {
          title: "KNOWLEDGE",
          items: [
            { name: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen }
          ]
        }
      ];
    }

    if (user.role === 'hr') {
      return [
        {
          title: "HR MANAGEMENT",
          items: [
            { name: 'Dashboard', path: '/hr-dashboard', icon: LayoutDashboard },
            { name: 'Communication', path: '/communication', icon: MessageSquare },
            { name: 'My Desk', path: '/my-desk', icon: Briefcase },
            ...(!user.is_owner ? [{ name: 'Profile Setup', path: '/profile-setup', icon: UserCheck }] : []),
            { name: 'Workforce', path: '/employees', icon: Users },
            { name: 'Task Tracking & Assign', path: '/tasks', icon: CheckSquare },
            { name: 'Recruitment', path: '/recruitment', icon: UserPlus },
            { name: 'Asset Management', path: '/asset-management', icon: Laptop },
            { name: 'Payroll', path: '/time-payroll?tab=payroll', icon: DollarSign },
            { name: 'Company Profile', path: '/company-profile', icon: Building2 },
          ]
        }
      ];
    }

    if (user.role === 'employee') {
      const dailyOps = [
        { name: 'Dashboard', path: '/employee-dashboard', icon: LayoutDashboard },
        { name: 'Communication', path: '/communication', icon: MessageSquare },
        { name: 'My Work Queue', path: '/billing', icon: ClipboardList },
        { name: 'Task Tracking & Assign', path: '/tasks', icon: CheckSquare },
      ];

      const selfService = [
        { name: 'My Desk', path: '/my-desk', icon: Briefcase },
        ...(!user.is_owner ? [{ name: 'Profile Setup', path: '/profile-setup', icon: UserCheck }] : []),
        { name: 'Process SOPs & KB', path: '/knowledge-base', icon: BookOpen },
      ];

      const qaWorkspace = [];
      if ((user as any).employee_profile?.qa_enabled) {
        qaWorkspace.push({ name: 'QA Workspace', path: '/qa', icon: ShieldCheck });
      }

      return [
        {
          title: "DAILY OPERATIONS",
          items: dailyOps
        },
        {
          title: "SELF-SERVICE & DESK",
          items: selfService
        },
        ...(qaWorkspace.length > 0 ? [{ title: "QA SYSTEM", items: qaWorkspace }] : []),
      ];
    }

    return [];
  };

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setGlobalSearch(q);
    if (!q.trim()) {
      setShowSearchResults(false);
      setSearchResults({ people: [], projects: [], clients: [], tasks: [] });
      return;
    }

    const qLower = q.toLowerCase().trim();
    const matchedPeople = searchStaffList.filter(emp => {
      const empId = (emp.employee_id || '').toLowerCase();
      const fName = (emp.user_details?.first_name || '').toLowerCase();
      const lName = (emp.user_details?.last_name || '').toLowerCase();
      const fullName = (emp.full_name || `${fName} ${lName}`.trim()).toLowerCase();
      const uName = (emp.user_details?.username || '').toLowerCase();
      const email = (emp.user_details?.email || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      const desg = (emp.designation || '').toLowerCase();
      const role = (emp.user_details?.role || emp.role || '').toLowerCase();

      return (
        empId.includes(qLower) ||
        fullName.includes(qLower) ||
        fName.includes(qLower) ||
        lName.includes(qLower) ||
        uName.includes(qLower) ||
        email.includes(qLower) ||
        dept.includes(qLower) ||
        desg.includes(qLower) ||
        role.includes(qLower)
      );
    }).map(emp => ({
      id: emp.id,
      employee_id: emp.employee_id || `EMP-${emp.id}`,
      name: emp.full_name || `${emp.user_details?.first_name || ''} ${emp.user_details?.last_name || ''}`.trim() || emp.designation || `@${emp.user_details?.username || emp.employee_id}`,
      username: emp.user_details?.username || emp.employee_id,
      role: emp.user_details?.role || emp.role,
      department: emp.department
    }));

    setSearchResults({
      people: matchedPeople,
      projects: [],
      clients: [],
      tasks: []
    });
    setShowSearchResults(true);
  };

  const handleSearchResultClick = (path: string) => {
    navigate(path);
    setGlobalSearch('');
    setShowSearchResults(false);
  };

  // Notification management
  const markAllNotifsRead = async () => {
    setNotifications([]);
    localStorage.setItem('easytrack_notifications', JSON.stringify([]));
    window.dispatchEvent(new Event('easytrack_notifications_updated'));
    try {
      await apiClient.post('/notifications/mark-all-read/');
    } catch (err) {
      console.error('Mark all read API error:', err);
    }
  };

  const markNotifRead = async (id: any) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('easytrack_notifications', JSON.stringify(updated));
      window.dispatchEvent(new Event('easytrack_notifications_updated'));
      return updated;
    });
    try {
      await apiClient.patch(`/notifications/${id}/`, { unread: false });
    } catch (err) {
      console.error('Mark notif read API error:', err);
    }
  };

  const userRole = user?.role || '';

  const roleFilteredNotifications = notifications.filter(n => {
    if (!n.target_roles || !Array.isArray(n.target_roles) || n.target_roles.length === 0) return true;
    if (n.target_roles.includes('all')) return true;
    if (n.target_roles.includes(userRole)) return true;
    if (n.user && String(n.user) === String(user?.id)) return true;
    return false;
  });

  const unreadNotifCount = roleFilteredNotifications.filter(n => n.unread).length;

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
    green: { primary: '#10b981', hover: '#059669', bgLight: '#ecfdf5', text: '#047857' },
    sage: { primary: '#0d9488', hover: '#0f766e', bgLight: '#f0fdfa', text: '#0f766e' },
    rose: { primary: '#f43f5e', hover: '#e11d48', bgLight: '#fff1f2', text: '#be123c' },
    lavender: { primary: '#c084fc', hover: '#a855f7', bgLight: '#faf5ff', text: '#6b21a8' },
    peach: { primary: '#fbbf24', hover: '#f59e0b', bgLight: '#fffbeb', text: '#b45309' },
    sky: { primary: '#38bdf8', hover: '#0ea5e9', bgLight: '#f0f9ff', text: '#0369a1' },
    indigo: { primary: '#6366f1', hover: '#4f46e5', bgLight: '#e0e7ff', text: '#3730a3' }
  };

  const themeData = colorThemes[brandColor] || colorThemes.green;
  const navGroups = getNavigationGroups();

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', themeData.primary);
    document.documentElement.style.setProperty('--brand-primary-hover', themeData.hover);
    document.documentElement.style.setProperty('--brand-primary-light', themeData.bgLight);
    document.documentElement.style.setProperty('--brand-primary-text', themeData.text);
  }, [brandColor, themeData]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Mobile Sidebar Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-slate-950 text-white shadow-2xl z-50">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <EasyTrackLogo />
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  {group.title && (
                    <h4 className="px-3 text-[11px] font-medium tracking-wide text-slate-500 capitalize">
                      {group.title.toLowerCase()}
                    </h4>
                  )}
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || 
                      (item.path === '/' && location.pathname.endsWith('-dashboard')) ||
                      (item.path === '/ceo-dashboard' && (location.pathname === '/' || location.pathname === '/ceo-dashboard')) ||
                      (item.path === '/hr-dashboard' && (location.pathname === '/' || location.pathname === '/hr-dashboard')) ||
                      (item.path === '/recruitment' && ['/recruitment', '/talent'].includes(location.pathname)) ||
                      (item.path === '/talent' && ['/talent', '/recruitment', '/onboarding', '/lifecycle', '/offboarding'].includes(location.pathname)) ||
                      (item.path.startsWith('/time-payroll') && ['/time-payroll', '/scheduling', '/payroll-processing', '/payroll'].includes(location.pathname)) ||
                      (item.path === '/employee-attendance' && ['/employee-attendance', '/attendance'].includes(location.pathname)) ||
                      (item.path === '/portfolio' && ['/portfolio', '/clients', '/projects'].includes(location.pathname)) ||
                      (item.path === '/communication' && ['/communication', '/chat', '/announcements'].includes(location.pathname)) ||
                      (item.path === '/my-desk' && ['/my-desk', '/attendance', '/leave', '/performance', '/documents', '/assets', '/helpdesk'].includes(location.pathname));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                          isActive 
                            ? 'shadow-sm text-white font-bold' 
                            : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                        }`}
                        style={isActive ? { backgroundColor: themeData.primary, color: '#ffffff' } : undefined}
                      >
                        <Icon className="mr-3 h-4 w-4 shrink-0" style={isActive ? { color: '#ffffff' } : { color: '#94a3b8' }} />
                        <span className="flex-1 truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Mobile Drawer Bottom Palette & Theme Controls */}
            <div className="border-t border-slate-800 p-4 space-y-2 bg-transparent shrink-0">
              <button
                onClick={() => setShowCustomize(!showCustomize)}
                className="flex items-center w-full px-4 py-2 text-xs font-medium text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white cursor-pointer"
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
                        localStorage.setItem('brand_color_customized', 'true');
                        window.dispatchEvent(new Event('easytrack_brand_color_changed'));
                      }}
                      className={`h-5 w-5 rounded-full border-2 transition cursor-pointer ${
                        brandColor === c ? 'border-white scale-110 shadow-inner' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: colorThemes[c].primary }}
                      title={c}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={toggleTheme}
                className="flex items-center w-full px-4 py-2 text-xs font-medium text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white cursor-pointer"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="mr-3 h-4 w-4 text-slate-500" />
                    Dark Theme
                  </>
                ) : (
                  <>
                    <Sun className="mr-3 h-4 w-4 text-brand-primary" />
                    Light Theme
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex md:flex-shrink-0 flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-950 text-white border-r border-slate-900 shadow-lg transition-all duration-200`}>
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Tenant Branding Header with Toggle inside Sidebar */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5'} h-16 border-b border-slate-800 shrink-0`}>
            {isSidebarCollapsed ? (
              <button
                onClick={toggleSidebarCollapse}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition focus:outline-none flex items-center justify-center cursor-pointer border border-slate-800"
                title="Expand Sidebar (☰)"
                aria-label="Expand Sidebar"
              >
                <Menu className="h-5 w-5 text-slate-300" />
              </button>
            ) : (
              <>
                <EasyTrackLogo />
                <button
                  onClick={toggleSidebarCollapse}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition focus:outline-none flex items-center justify-center cursor-pointer border border-slate-800"
                  title="Collapse Sidebar (☰)"
                  aria-label="Collapse Sidebar"
                >
                  <Menu className="h-4 w-4 text-slate-400 hover:text-white" />
                </button>
              </>
            )}
          </div>

          {/* Navigation Links Grouped */}
          <nav className="flex-1 px-3 py-5 space-y-5 overflow-y-auto scrollbar-none">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                {!isSidebarCollapsed && group.title && (
                  <h4 className="px-3 text-[11px] font-medium tracking-wide text-slate-500 capitalize">
                    {group.title.toLowerCase()}
                  </h4>
                )}
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || 
                    (item.path === '/' && location.pathname.endsWith('-dashboard')) ||
                    (item.path === '/ceo-dashboard' && (location.pathname === '/' || location.pathname === '/ceo-dashboard')) ||
                    (item.path === '/hr-dashboard' && (location.pathname === '/' || location.pathname === '/hr-dashboard')) ||
                    (item.path === '/recruitment' && ['/recruitment', '/talent'].includes(location.pathname)) ||
                    (item.path === '/talent' && ['/talent', '/recruitment', '/onboarding', '/lifecycle', '/offboarding'].includes(location.pathname)) ||
                    (item.path.startsWith('/time-payroll') && ['/time-payroll', '/scheduling', '/payroll-processing', '/payroll'].includes(location.pathname)) ||
                    (item.path === '/employee-attendance' && ['/employee-attendance', '/attendance'].includes(location.pathname)) ||
                    (item.path === '/portfolio' && ['/portfolio', '/clients', '/projects'].includes(location.pathname)) ||
                    (item.path === '/communication' && ['/communication', '/chat', '/announcements'].includes(location.pathname)) ||
                    (item.path === '/my-desk' && ['/my-desk', '/attendance', '/leave', '/performance', '/documents', '/assets', '/helpdesk'].includes(location.pathname));
                  const Icon = item.icon;

                  const unreadCount = item.path === '/communication' 
                    ? (activeUnreadAnnCount + activeUnreadMsgCount)
                    : item.path === '/announcements' 
                      ? activeUnreadAnnCount 
                      : item.path === '/chat' 
                        ? activeUnreadMsgCount 
                        : 0;

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      title={item.name}
                      className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-4 py-2'} text-sm font-semibold rounded-lg transition-colors duration-150 focus:outline-none relative group ${
                        isActive 
                          ? 'shadow-sm text-white font-bold' 
                          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                      style={isActive ? { backgroundColor: themeData.primary, color: '#ffffff' } : undefined}
                    >
                      <Icon 
                        className={`${isSidebarCollapsed ? 'h-5 w-5' : 'mr-3 h-4 w-4 shrink-0'}`} 
                        style={isActive ? { color: '#ffffff' } : { color: '#94a3b8' }}
                      />
                      {!isSidebarCollapsed && (
                        <span className="flex-1 truncate">{item.name}</span>
                      )}
                      {unreadCount > 0 && (
                        isSidebarCollapsed ? (
                          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-slate-950" />
                        ) : (
                          <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold leading-none bg-rose-600 text-white rounded-full shadow-xs shrink-0">
                            {unreadCount}
                          </span>
                        )
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* Bottom Settings bar inside nav */}
            <div className="border-t border-slate-800 pt-4 mt-6 space-y-1 bg-transparent">
              {!isSidebarCollapsed ? (
                <>
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
                            localStorage.setItem('brand_color_customized', 'true');
                            window.dispatchEvent(new Event('easytrack_brand_color_changed'));
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

                  {/* Sidebar Logout Button */}
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-xs font-bold text-rose-400 rounded-lg hover:bg-rose-950/40 hover:text-rose-300 transition"
                  >
                    <LogOut className="mr-3 h-4 w-4 text-rose-400" />
                    Logout Session
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => {
                      setIsSidebarCollapsed(false);
                      setShowCustomize(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg cursor-pointer"
                    title="Palette Manager"
                  >
                    <Palette className="h-4 w-4" />
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg"
                    title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                  >
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-brand-primary" />}
                  </button>
                  <button
                    onClick={logout}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg"
                    title="Logout Session"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Inject Dynamic Brand Color Styles */}
        <style>{`
          :root {
            --brand-primary: ${themeData.primary};
            --brand-primary-hover: ${themeData.hover};
            --brand-primary-light: ${themeData.bgLight};
            --brand-primary-text: ${themeData.text};
          }
          .bg-brand-primary { background-color: ${themeData.primary} !important; }
          .bg-brand-primary-hover:hover,
          .hover\\:bg-brand-primary:hover,
          .hover\\:bg-brand-primary-hover:hover,
          button.bg-brand-primary:hover,
          a.bg-brand-primary:hover,
          button.bg-brand-primary-hover:hover { background-color: ${themeData.hover} !important; }
          .bg-brand-primary-light { background-color: ${themeData.bgLight} !important; }
          .bg-brand-primary-light\\/10 { background-color: ${themeData.bgLight}1A !important; }
          .bg-brand-primary-light\\/20 { background-color: ${themeData.bgLight}33 !important; }
          .bg-brand-primary-light\\/50 { background-color: ${themeData.bgLight}80 !important; }
          .text-brand-primary { color: ${themeData.text} !important; }
          .text-brand-primary-pastel { color: ${themeData.primary} !important; }
          .hover\\:text-brand-primary:hover { color: ${themeData.text} !important; }
          .border-brand-primary { border-color: ${themeData.primary} !important; }
          .hover\\:border-brand-primary:hover { border-color: ${themeData.primary} !important; }
          .focus\\:ring-brand-primary:focus { --tw-ring-color: ${themeData.primary} !important; }
          .focus\\:border-brand-primary:focus { border-color: ${themeData.primary} !important; }

          /* Enforce white text for all filled brand buttons & active items */
          button.bg-brand-primary,
          a.bg-brand-primary,
          .bg-brand-primary:not(.bg-brand-primary-light):not(.bg-brand-primary-light\\/10):not(.bg-brand-primary-light\\/20):not(.bg-brand-primary-light\\/50),
          [class*="bg-brand-primary"]:not([class*="bg-brand-primary-light"]):not([class*="bg-brand-primary-light\\/10"]):not([class*="bg-brand-primary-light\\/20"]):not([class*="bg-brand-primary-light\\/50"]) {
            color: #ffffff !important;
          }
          button.bg-brand-primary svg,
          a.bg-brand-primary svg,
          .bg-brand-primary:not(.bg-brand-primary-light) svg {
            color: #ffffff !important;
          }
        `}</style>

        {/* Global Header */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm z-30">
          <div className="flex items-center flex-1 max-w-lg">
            {/* Mobile Drawer Trigger (Mobile Only - Desktop Hamburger is inside the sidebar) */}
            <button
              onClick={() => setIsMobileDrawerOpen(prev => !prev)}
              className="md:hidden p-2 mr-3 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700"
              title="Open Navigation Menu (☰)"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Prominent & Highlighted Header Search Bar (Ctrl K removed) */}
            <div className="relative flex-1 max-w-md">
              <div className="relative flex items-center w-full">
                <Search className="absolute left-3.5 h-4 w-4 text-brand-primary pointer-events-none transition-colors" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={handleGlobalSearch}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.people.length > 0) {
                      const topMatch = searchResults.people[0];
                      handleSearchResultClick(`/employees?emp=${encodeURIComponent(topMatch.employee_id || topMatch.id)}`);
                    }
                  }}
                  placeholder="Search staff, ID, projects, campaigns..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100/80 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-brand-primary focus:bg-white dark:focus:bg-slate-850 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-xs focus:ring-4 focus:ring-brand-primary/15 transition-all outline-none"
                />
              </div>
            </div>

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
                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-brand-primary mb-1.5 flex justify-between items-center">
                      <span>Workforce ({searchResults.people.length})</span>
                      <span className="text-[8px] text-slate-400 font-normal">Click to view details</span>
                    </p>
                    <div className="space-y-1">
                      {searchResults.people.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSearchResultClick(`/employees?emp=${encodeURIComponent(p.employee_id || p.id)}`)}
                          className="w-full text-left px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg flex items-center justify-between text-xs transition cursor-pointer group"
                        >
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-primary transition-colors flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.role && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {p.role}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              @{p.username} {p.department ? `• ${p.department}` : ''}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-brand-primary shrink-0 ml-2">
                            {p.employee_id}
                          </span>
                        </button>
                      ))}
                    </div>
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

          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Header Date & Calendar Filter (Default for All Portals) */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-2.5 py-1.5 rounded-xl shadow-2xs">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date:</label>
              <input
                type="text"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 w-22 sm:w-24 focus:outline-none tracking-wide text-center"
                maxLength={10}
              />
              <button
                type="button"
                onClick={() => {
                  if (headerDateInputRef.current && (headerDateInputRef.current as any).showPicker) {
                    (headerDateInputRef.current as any).showPicker();
                  } else if (headerDateInputRef.current) {
                    headerDateInputRef.current.focus();
                  }
                }}
                className="text-brand-primary hover:text-brand-primary-hover dark:text-brand-primary p-0.5 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                title="Pick Date from Calendar"
              >
                <Calendar className="h-4 w-4 text-rose-500" />
              </button>
              <input
                ref={headerDateInputRef}
                type="date"
                value={isoDate}
                onChange={(e) => setIsoDate(e.target.value)}
                className="sr-only"
              />
            </div>
            
            {/* Sound notification toggle (Master for all portals) */}
            <button
              onClick={handleMuteToggle}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
              title={isMuted ? "Unmute portal sounds" : "Mute portal sounds"}
            >
              {isMuted ? <VolumeX className="h-4.5 w-4.5 text-rose-500" /> : <Volume2 className="h-4.5 w-4.5 text-brand-primary" />}
            </button>

            {/* Attendance state controller (visible to employee role) */}
            {user?.role === 'employee' && attendanceState && (
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
                {(attendanceState === 'not_checked_in' || attendanceState === 'checked_out') && (
                  <button
                    disabled={attendanceLoading}
                    onClick={() => handleAttendanceAction('check-in')}
                    className="px-3 py-1 bg-brand-primary hover:bg-brand-primary-hover text-white rounded text-xs font-bold"
                  >
                    Check In
                  </button>
                )}
                {attendanceState === 'working' && (
                  <>
                    <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse mx-1"></span>
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
                      className="px-3 py-1 bg-brand-primary hover:bg-brand-primary-hover text-white rounded text-xs font-bold"
                    >
                      Resume
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Volume Status Toggle & Activity Verification Ping Controller */}
            <ActivityAndVolumeController attendanceState={attendanceState} />

            {/* Notification bell and badge */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifPanel(!showNotifPanel); setShowProfileMenu(false); }}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition focus:outline-none"
              >
                <Bell className="h-5 w-5" />
                {(unreadNotifCount + activeUnreadAnnCount + activeUnreadMsgCount) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold leading-none rounded-full flex items-center justify-center shadow-sm shrink-0 border-2 border-white dark:border-slate-900 pointer-events-none">
                    {unreadNotifCount + activeUnreadAnnCount + activeUnreadMsgCount > 99 ? '99+' : (unreadNotifCount + activeUnreadAnnCount + activeUnreadMsgCount)}
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

                  {/* Announcement Header Item inside Bell Popover */}
                  {activeUnreadAnnCount > 0 && (
                    <Link
                      to="/announcements"
                      onClick={() => setShowNotifPanel(false)}
                      className="p-2.5 bg-brand-primary-light border border-brand-primary/30 rounded-lg flex items-center justify-between text-xs font-bold text-brand-primary hover:opacity-90 transition"
                    >
                      <span className="flex items-center">
                        <Megaphone className="h-3.5 w-3.5 mr-1.5 text-brand-primary" />
                        {activeUnreadAnnCount} New Announcement{activeUnreadAnnCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] underline">View Feed ➔</span>
                    </Link>
                  )}

                  {/* Messages Header Item inside Bell Popover */}
                  {activeUnreadMsgCount > 0 && (
                    <Link
                      to="/chat"
                      onClick={() => setShowNotifPanel(false)}
                      className="p-2.5 bg-brand-primary-light border border-brand-primary/30 rounded-lg flex items-center justify-between text-xs font-bold text-brand-primary hover:opacity-90 transition"
                    >
                      <span className="flex items-center">
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-brand-primary" />
                        {activeUnreadMsgCount} Unread Message{activeUnreadMsgCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] underline">Open Chat ➔</span>
                    </Link>
                  )}

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {roleFilteredNotifications.map((n) => (
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
                          <span className="text-[8px] text-slate-400 font-mono">
                            {formatRelativeTime(n.created_at || n.timestamp || n.date || n.time)}
                          </span>
                        </div>
                        <p className="text-slate-650 dark:text-slate-300 font-medium leading-relaxed">{n.desc || n.description || n.summary}</p>
                      </div>
                    ))}
                    {roleFilteredNotifications.length === 0 && (
                      <p className="text-center text-slate-400 py-4 text-xs">No recent notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Header User Avatar & Logout Shifted to Top Right Edge */}
            <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-slate-800 pl-4 relative">
              <button
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifPanel(false); }}
                className="flex items-center space-x-2 focus:outline-none hover:opacity-85 transition"
                title="User Account Options"
              >
                <div className="h-8 w-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-extrabold text-xs uppercase shadow-sm">
                  {user?.username.substring(0, 2)}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white hidden md:inline">
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                </span>
              </button>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-650 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-lg text-xs font-bold transition-colors shadow-xs"
                title="Logout Session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>

              {/* Profile Menu Popover Overlay on Top Right */}
              {showProfileMenu && (
                <div className="absolute right-0 top-11 z-50 w-56 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs">
                  <div className="px-4 py-2.5 border-b border-gray-150 dark:border-slate-750">
                    <p className="font-bold text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</p>
                    <p className="text-[10px] text-slate-450">{user?.email}</p>
                    <p className="text-[10px] text-brand-primary font-semibold mt-0.5 capitalize">{user?.display_role || (user?.role === 'admin' ? (user?.finance_access ? 'Admin (Finance Access)' : 'Admin') : (user?.role === 'tl' ? 'Team Lead' : user?.role?.replace('_', ' ')))}</p>
                  </div>
                  {!user?.is_owner && (
                    <Link
                      to="/profile-setup"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center font-bold text-brand-primary"
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-2 text-brand-primary" />
                      Profile Setup (KYC & Documents)
                    </Link>
                  )}
                  <button
                    onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center"
                  >
                    <Users className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    My Profile Details
                  </button>
                  <button
                    onClick={() => { setShowSettingsModal(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center"
                  >
                    <Settings className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => { setShowPasswordModal(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center"
                  >
                    <Lock className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    Change Password
                  </button>
                  <button
                    onClick={() => { setShowActivityModal(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center"
                  >
                    <History className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    Login Activity
                  </button>
                  <div className="border-t border-gray-150 dark:border-slate-750 my-1"></div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 font-bold flex items-center"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    Logout Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto min-w-0 w-full p-3 sm:p-4 lg:p-6 bg-gray-50 dark:bg-slate-900 scroll-smooth">
          <div className="w-full max-w-[1600px] mx-auto min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. Profile Details Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-850">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <UserCheck className="h-4.5 w-4.5 mr-2 text-brand-primary" />
                My Profile Details
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-semibold">
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
                <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-bold text-brand-primary">{user?.organization_name || 'Organization'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Authority Role</p>
                <p className="text-slate-800 dark:text-slate-200 capitalize mt-0.5 font-bold">{user?.display_role || (user?.role === 'admin' ? (user?.finance_access ? 'Admin (Finance Access)' : 'Admin') : (user?.role === 'tl' ? 'Team Lead' : user?.role?.replace('_', ' ')))}</p>
              </div>
            </div>
            <div className="flex justify-end p-3 sm:p-4 border-t border-gray-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Account Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-850">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <Settings className="h-4.5 w-4.5 mr-2 text-brand-primary" />
                Account Configuration
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAccountSettingsSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-semibold">
                {settingsSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 text-xs font-bold rounded-lg">
                    {settingsSuccess}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-gray-150 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold text-xs shadow-xs"
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-850">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <Lock className="h-4.5 w-4.5 mr-2 text-brand-primary" />
                Change Account Password
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-semibold">
                {passError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-650 dark:text-rose-400 text-xs rounded-lg border border-rose-200 dark:border-rose-900/60 font-bold">
                    {passError}
                  </div>
                )}
                {passSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg border border-emerald-200 dark:border-emerald-900/60 font-bold">
                    {passSuccess}
                  </div>
                )}

                {user?.role === 'employee' && (
                  <div className="p-2.5 bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 text-[11px] rounded-lg border border-sky-200 dark:border-sky-800 leading-normal">
                    ℹ️ <span className="font-bold">Workforce Security Policy:</span> Employees are permitted to update passwords once every 30 days. For immediate administrative resets, please contact your Team Lead or HR Manager.
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showOldPasswordModal ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-9 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPasswordModal(!showOldPasswordModal)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    >
                      {showOldPasswordModal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNewPasswordModal ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-9 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-mono font-bold text-brand-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPasswordModal(!showNewPasswordModal)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    >
                      {showNewPasswordModal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPasswordModal ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-9 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-mono font-bold text-brand-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPasswordModal(!showConfirmPasswordModal)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    >
                      {showConfirmPasswordModal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-gray-150 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-bold text-xs shadow-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Login Activity / History Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-slate-750 shrink-0 flex justify-between items-center bg-white dark:bg-slate-850">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                <History className="h-4.5 w-4.5 mr-2 text-brand-primary" />
                Login Session History
              </h3>
              <button onClick={() => setShowActivityModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-semibold">
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
            <div className="flex justify-end p-3 sm:p-4 border-t border-gray-100 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 shrink-0">
              <button
                onClick={() => setShowActivityModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
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
