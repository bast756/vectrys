import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/store';
import { useEmployeeStore } from '@/store';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import TermsPage from '@/pages/TermsPage';
import HomePage from '@/pages/HomePage';
import GoogleCallback from '@/pages/GoogleCallback';
import CallAssistantPage from '@/pages/CallAssistantPage';

// Employee pages
import EmployeeLoginPage from '@/pages/employee/EmployeeLoginPage';
import EmployeeLayout from '@/pages/employee/EmployeeLayout';
import NdaAcceptancePage from '@/pages/employee/NdaAcceptancePage';
import ForgotPasswordPage from '@/pages/employee/ForgotPasswordPage';
import ChangePasswordPage from '@/pages/employee/ChangePasswordPage';
import ProfilePage from '@/pages/employee/ProfilePage';
import DashboardPage from '@/pages/employee/DashboardPage';
import CRMPage from '@/pages/employee/CRMPage';
import NotesPage from '@/pages/employee/NotesPage';
import GanttPage from '@/pages/employee/GanttPage';
import PlanningPage from '@/pages/employee/PlanningPage';
import SecurityAlertsPage from '@/pages/employee/SecurityAlertsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function EmployeeProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isEmployeeAuthenticated, employee } = useEmployeeStore();
  if (!isEmployeeAuthenticated) return <Navigate to="/employee/login" replace />;
  if (employee?.temp_password) return <Navigate to="/employee/change-password" replace />;
  if (employee && !employee.nda_accepted_at) return <Navigate to="/employee/nda" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Navigate to="/employee/login" replace />} />
        <Route path="/register" element={<Navigate to="/employee/login" replace />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Protected routes */}
        <Route path="/terms" element={<ProtectedRoute><TermsPage /></ProtectedRoute>} />
        <Route path="/call-assistant" element={<CallAssistantPage />} />
        <Route path="/" element={<Navigate to="/employee/login" replace />} />

        {/* Employee public routes */}
        <Route path="/employee/login" element={<EmployeeLoginPage />} />
        <Route path="/employee/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/employee/change-password" element={<ChangePasswordPage />} />
        <Route path="/employee/nda" element={<NdaAcceptancePage />} />

        {/* Employee protected routes */}
        <Route path="/employee" element={<EmployeeProtectedRoute><EmployeeLayout /></EmployeeProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calls" element={<CallAssistantPage />} />
          <Route path="crm" element={<CRMPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="gantt" element={<GanttPage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="security-alerts" element={<SecurityAlertsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/employee/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
