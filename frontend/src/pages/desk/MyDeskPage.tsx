import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, FileText, Award, FileDigit, Laptop, HelpCircle, Briefcase, Calendar, PartyPopper, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AttendancePage from '../attendance/AttendancePage';
import LeavePage from '../leave/LeavePage';
import ProfileSetupPage from '../profile/ProfileSetupPage';
import ModulePreviewPage from '../ModulePreviewPage';
import ShiftCalendarView from './ShiftCalendarView';
import HolidayCalendarView from './HolidayCalendarView';
import HolidayApprovalsView from './HolidayApprovalsView';

interface MyDeskPageProps {
  defaultTab?: string;
}

export const MyDeskPage: React.FC<MyDeskPageProps> = ({ defaultTab }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<string>(() => {
    return urlTab || defaultTab || 'attendance';
  });

  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  const calculatePendingCount = () => {
    try {
      const saved = localStorage.getItem('easytrack_holidays');
      if (saved) {
        const list = JSON.parse(saved);
        const userRole = user?.role || '';
        const pending = list.filter((h: any) => 
          h.status === 'pending_approval' && (h.target_approvers || []).includes(userRole)
        );
        setPendingApprovalsCount(pending.length);
      } else {
        setPendingApprovalsCount(0);
      }
    } catch {
      setPendingApprovalsCount(0);
    }
  };

  useEffect(() => {
    calculatePendingCount();
    const handleUpdate = () => calculatePendingCount();
    window.addEventListener('easytrack_holidays_updated', handleUpdate);
    return () => window.removeEventListener('easytrack_holidays_updated', handleUpdate);
  }, [user]);

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    } else if (!urlTab && defaultTab && defaultTab !== activeTab) {
      setActiveTab(defaultTab);
    }
  }, [urlTab, defaultTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const canApproveHolidays = ['ceo', 'operations_head', 'tl'].includes(user?.role || '');

  const tabs = [
    { id: 'attendance', label: 'My Attendance', icon: CalendarDays },
    { id: 'shift-calendar', label: 'Shift Calendar', icon: Calendar },
    { id: 'holiday-calendar', label: 'Holiday Calendar', icon: PartyPopper },
    ...(!user?.is_owner ? [{ id: 'profile-setup', label: 'Profile Setup', icon: UserCheck }] : []),
    { id: 'leave', label: 'My Leave', icon: FileText },
    { id: 'performance', label: 'My Performance', icon: Award },
    { id: 'documents', label: 'My Documents', icon: FileDigit },
    { id: 'assets', label: 'My Assets', icon: Laptop },
    { id: 'requests', label: 'My Requests', icon: HelpCircle },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendancePage selfOnly={true} />;
      case 'shift-calendar':
        return <ShiftCalendarView />;
      case 'holiday-calendar':
        return <HolidayCalendarView />;
      case 'profile-setup':
        return <ProfileSetupPage />;
      case 'leave':
        return <LeavePage />;
      case 'performance':
        return <ModulePreviewPage module="performance" />;
      case 'documents':
        return <ModulePreviewPage module="documents" />;
      case 'assets':
        return <ModulePreviewPage module="assets" />;
      case 'requests':
        return <ModulePreviewPage module="helpdesk" />;
      default:
        return <AttendancePage selfOnly={true} />;
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-primary-light text-brand-primary rounded-xl">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center leading-normal">
              My Desk
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access and manage your attendance, leaves, performance metrics, documents, assets, and helpdesk requests in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-2 shadow-sm">
        <div className="flex overflow-x-auto space-x-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-primary text-white font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {(tab as any).badge !== undefined && (tab as any).badge > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] animate-pulse">
                    {(tab as any).badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Component Render */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MyDeskPage;
