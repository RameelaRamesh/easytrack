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
          <Routes>
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
              path="/"
              element={
                <AuthGuard>
                  <DashboardLayout />
                </AuthGuard>
              }
            >
              {/* Central Routing based on role */}
              <Route index element={<DashboardRedirect />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="processes" element={<ProcessesPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="leave" element={<LeavePage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="qa" element={<QAPage />} />
              <Route path="escalations" element={<EscalationsPage />} />
              <Route path="roles-permissions" element={<RolesPermissionsPage />} />
              
              {/* Architecture Frozen New Module Routes */}
              <Route path="recruitment" element={<ModulePreviewPage module="recruitment" />} />
              <Route path="lifecycle" element={<ModulePreviewPage module="lifecycle" />} />
              <Route path="scheduling" element={<ModulePreviewPage module="scheduling" />} />
              <Route path="performance" element={<ModulePreviewPage module="performance" />} />
              <Route path="helpdesk" element={<ModulePreviewPage module="helpdesk" />} />
              <Route path="documents" element={<ModulePreviewPage module="documents" />} />
              <Route path="payroll-processing" element={<ModulePreviewPage module="payroll-processing" />} />
              <Route path="offboarding" element={<ModulePreviewPage module="offboarding" />} />
              <Route path="assets" element={<ModulePreviewPage module="assets" />} />
              <Route path="announcements" element={<ModulePreviewPage module="announcements" />} />
              <Route path="knowledge-base" element={<ModulePreviewPage module="knowledge-base" />} />
              <Route path="billing-metrics" element={<ModulePreviewPage module="billing-metrics" />} />
              <Route path="quality-management" element={<ModulePreviewPage module="quality-management" />} />
              <Route path="automation" element={<ModulePreviewPage module="automation" />} />
              
              {/* CEO Restricted Pages */}
              <Route
                path="ceo-dashboard"
                element={
                  <RoleGuard allowedRoles={['ceo']}>
                    <CEODashboard />
                  </RoleGuard>
                }
              />
              
              {/* Operations Restricted Pages */}
              <Route
                path="operations-dashboard"
                element={
                  <RoleGuard allowedRoles={['operations_head']}>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Simple redirect component that routes users to their specific dashboard based on their role
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ceo':
      return <Navigate to="/ceo-dashboard" replace />;
    case 'operations_head':
      return <Navigate to="/operations-dashboard" replace />;
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

// Help helper
