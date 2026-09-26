import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AuthGuard } from './guards/AuthGuard';
import { GuestGuard } from './guards/GuestGuard';
import { RoleGuard } from './guards/RoleGuard';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ChangePassword from '../pages/auth/ChangePassword';
import CEODashboard from '../pages/ceo/Dashboard';
import EmployeeDashboard from '../pages/employee/Dashboard';
import OperationsDashboard from '../pages/operations/Dashboard';
import HRDashboard from '../pages/hr/Dashboard';
import TLDashboard from '../pages/tl/Dashboard';
import ChatPage from '../pages/chat/ChatPage';
import SettingsPage from '../pages/settings/SettingsPage';
import EmployeesPage from '../pages/employees/EmployeesPage';
import ClientsPage from '../pages/clients/ClientsPage';
import ProjectsPage from '../pages/projects/ProjectsPage';
import BillingPage from '../pages/billing/BillingPage';
import AuditPage from '../pages/audit/AuditPage';
import ProcessesPage from '../pages/processes/ProcessesPage';
import TasksPage from '../pages/tasks/TasksPage';
import AttendancePage from '../pages/attendance/AttendancePage';
import LeavePage from '../pages/leave/LeavePage';
import PayrollPage from '../pages/payroll/PayrollPage';
import QAPage from '../pages/qa/QAPage';
import EscalationsPage from '../pages/escalations/EscalationsPage';
import ModulePreviewPage from '../pages/ModulePreviewPage';
import RolesPermissionsPage from '../pages/settings/RolesPermissionsPage';
import ProfileSetupPage from '../pages/profile/ProfileSetupPage';
import AccessControlPage from '../pages/access-control/AccessControlPage';
import MyDeskPage from '../pages/desk/MyDeskPage';
import { CommunicationHub } from '../pages/communication/CommunicationHub';
import { BusinessPortfolioPage } from '../pages/portfolio/BusinessPortfolioPage';
import { TalentLifecyclePage } from '../pages/talent/TalentLifecyclePage';
import { TimePayrollPage } from '../pages/time-payroll/TimePayrollPage';
import { DateFilterProvider } from '../context/DateFilterContext';
import AssetManagementPage from '../pages/assets/AssetManagementPage';



// Import globals style
import '../styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <DateFilterProvider>
            <Routes>
              {/* Entry / Landing Route: Always lands on Login page */}
              <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public/Guest Routes */}
            <Route
              path="/login"
              element={
                <GuestGuard>
                  <Login />
                </GuestGuard>
              }
            />
            <Route
              path="/register"
              element={
                <GuestGuard>
                  <Register />
                </GuestGuard>
              }
            />
            <Route
              path="/change-password"
              element={
                <AuthGuard>
                  <ChangePassword />
                </AuthGuard>
              }
            />

            {/* Authenticated Dashboard Routes */}
            <Route
              element={
                <AuthGuard>
                  <DashboardLayout />
                </AuthGuard>
              }
            >
              {/* Central Routing based on role */}
              <Route path="dashboard" element={<DashboardRedirect />} />
              <Route path="communication" element={<CommunicationHub />} />
              <Route path="chat" element={<CommunicationHub />} />
              <Route path="announcements" element={<CommunicationHub />} />
              <Route path="portfolio" element={<BusinessPortfolioPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route 
                path="employees" 
                element={
                  <RoleGuard allowedRoles={['admin', 'ceo', 'operations_head', 'hr', 'tl', 'employee']}>
                    <EmployeesPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="workforce" 
                element={
                  <RoleGuard allowedRoles={['admin', 'ceo', 'operations_head', 'hr', 'tl', 'employee']}>
                    <EmployeesPage />
                  </RoleGuard>
                } 
              />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="processes" element={<ProcessesPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="my-desk" element={<MyDeskPage />} />
              <Route path="attendance" element={<MyDeskPage defaultTab="attendance" />} />
              <Route 
                path="employee-attendance" 
                element={
                  <RoleGuard allowedRoles={['admin', 'ceo', 'operations_head', 'hr', 'tl']}>
                    <AttendancePage selfOnly={false} />
                  </RoleGuard>
                } 
              />
              <Route path="leave" element={<MyDeskPage defaultTab="leave" />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="qa" element={<QAPage />} />
              <Route path="escalations" element={<EscalationsPage />} />
              <Route path="roles-permissions" element={<RolesPermissionsPage />} />
              <Route path="profile-setup" element={<ProfileSetupPage />} />
              <Route path="access-control" element={<AccessControlPage />} />

              {/* Unified Talent & Time/Payroll Hubs */}
              <Route 
                path="talent" 
                element={
                  <RoleGuard allowedRoles={['admin', 'ceo', 'hr']}>
                    <TalentLifecyclePage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="time-payroll" 
                element={
                  <RoleGuard allowedRoles={['admin', 'ceo', 'hr', 'operations_head']}>
                    <TimePayrollPage />
                  </RoleGuard>
                } 
              />

              {/* Architecture Frozen New Module Routes & Direct Aliases */}
              <Route path="recruitment" element={<RoleGuard allowedRoles={['admin', 'ceo', 'hr']}><TalentLifecyclePage defaultTab="recruitment" /></RoleGuard>} />
              <Route path="onboarding" element={<RoleGuard allowedRoles={['admin', 'ceo', 'hr']}><TalentLifecyclePage defaultTab="onboarding" /></RoleGuard>} />
              <Route path="lifecycle" element={<RoleGuard allowedRoles={['admin', 'ceo', 'hr']}><TalentLifecyclePage defaultTab="lifecycle" /></RoleGuard>} />
              <Route path="offboarding" element={<RoleGuard allowedRoles={['admin', 'ceo', 'hr']}><TalentLifecyclePage defaultTab="offboarding" /></RoleGuard>} />
              <Route path="scheduling" element={<RoleGuard allowedRoles={['admin', 'ceo', 'hr', 'operations_head', 'tl']}><TimePayrollPage defaultTab="scheduling" /></RoleGuard>} />
              <Route path="payroll-processing" element={<RoleGuard allowedRoles={['admin', 'ceo', 'hr']}><TimePayrollPage defaultTab="payroll" /></RoleGuard>} />
              <Route path="performance" element={<MyDeskPage defaultTab="performance" />} />
              <Route path="helpdesk" element={<MyDeskPage defaultTab="requests" />} />
              <Route path="documents" element={<MyDeskPage defaultTab="documents" />} />
              <Route path="assets" element={<MyDeskPage defaultTab="assets" />} />
              <Route 
                path="asset-management" 
                element={
                  <RoleGuard allowedRoles={['admin', 'ceo', 'operations_head', 'hr']}>
                    <AssetManagementPage />
                  </RoleGuard>
                } 
              />
              <Route path="announcements" element={<CommunicationHub />} />
              <Route path="knowledge-base" element={<ModulePreviewPage module="knowledge-base" />} />
              <Route path="billing-metrics" element={<ModulePreviewPage module="billing-metrics" />} />
              <Route path="quality-management" element={<ModulePreviewPage module="quality-management" />} />
              <Route path="automation" element={<ModulePreviewPage module="automation" />} />
              <Route path="company-profile" element={<SettingsPage />} />
              
              {/* Admin (CEO / Owner) Dashboard */}
              <Route
                path="ceo-dashboard"
                element={
                  <RoleGuard allowedRoles={['admin', 'ceo']} requireFinanceAccess={true}>
                    <CEODashboard />
                  </RoleGuard>
                }
              />
              
              {/* Admin (Operations Head) Dashboard */}
              <Route
                path="operations-dashboard"
                element={
                  <RoleGuard allowedRoles={['admin', 'operations_head', 'ceo']}>
                    <OperationsDashboard />
                  </RoleGuard>
                }
              />

              {/* HR Restricted Pages */}
              <Route
                path="hr-dashboard"
                element={
                  <RoleGuard allowedRoles={['hr']}>
                    <HRDashboard />
                  </RoleGuard>
                }
              />

              {/* TL Restricted Pages */}
              <Route
                path="tl-dashboard"
                element={
                  <RoleGuard allowedRoles={['tl']}>
                    <TLDashboard />
                  </RoleGuard>
                }
              />
              
              {/* Employee Restricted Pages */}
              <Route
                path="employee-dashboard"
                element={
                  <RoleGuard allowedRoles={['employee']}>
                    <EmployeeDashboard />
                  </RoleGuard>
                }
              />
            </Route>

            {/* Redirects */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </DateFilterProvider>
      </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Simple redirect component that routes users to their specific dashboard based on their role
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin' || user.role === 'ceo' || user.role === 'operations_head') {
    const hasFinance = Boolean(user.is_owner || user.finance_access);
    return <Navigate to={hasFinance ? "/ceo-dashboard" : "/operations-dashboard"} replace />;
  }

  switch (user.role) {
    case 'hr':
      return <Navigate to="/hr-dashboard" replace />;
    case 'tl':
      return <Navigate to="/tl-dashboard" replace />;
    case 'employee':
      return <Navigate to="/employee-dashboard" replace />;
    default:
      return <Navigate to="/employee-dashboard" replace />;
  }
};

const AccessControlRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin' || user.role === 'ceo') {
    return <CEODashboard focusAccessControl={true} />;
  }
  if (user.role === 'operations_head') {
    return <OperationsDashboard focusAccessControl={true} />;
  }
  return <EmployeesPage />;
};


// Help helper
