import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/store';
import { useEmployeeStore } from '@/store';
import { Toaster } from '@/components/ui/toaster';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import TermsPage from '@/pages/TermsPage';
import HomePage from '@/pages/HomePage';
import GoogleCallback from '@/pages/GoogleCallback';
import CallAssistantPage from '@/pages/CallAssistantPage';

// Subscription & Billing pages
import LandingPage from '@/pages/LandingPage';
import PricingPage from '@/pages/PricingPage';
import CheckoutSuccessPage from '@/pages/CheckoutSuccessPage';
import SubscriptionPage from '@/pages/SubscriptionPage';

// Guest Portal pages
import GuestChatPage from '@/pages/GuestChatPage';
import GuestServicesPage from '@/pages/GuestServicesPage';
import GuestGuidePage from '@/pages/GuestGuidePage';
import GuestWeatherPage from '@/pages/GuestWeatherPage';
import GuestTransportPage from '@/pages/GuestTransportPage';
import GuestWifiPage from '@/pages/GuestWifiPage';
import GuestCheckoutPage from '@/pages/GuestCheckoutPage';
import GuestHouseRulesPage from '@/pages/GuestHouseRulesPage';
import GuestReviewPage from '@/pages/GuestReviewPage';
import GuestRestaurantsPage from '@/pages/GuestRestaurantsPage';
import GuestAIChatPage from '@/pages/GuestAIChatPage';
import GuestJournalPage from '@/pages/GuestJournalPage';

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
import PointagePage from '@/pages/employee/PointagePage';

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

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing & Pricing (public) */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccessPage /></ProtectedRoute>} />

        {/* Public routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Protected guest portal routes */}
        <Route path="/terms" element={<ProtectedRoute><TermsPage /></ProtectedRoute>} />
        <Route path="/call-assistant" element={<ProtectedRoute><CallAssistantPage /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><GuestChatPage /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><GuestServicesPage /></ProtectedRoute>} />
        <Route path="/guide" element={<ProtectedRoute><GuestGuidePage /></ProtectedRoute>} />
        <Route path="/weather" element={<ProtectedRoute><GuestWeatherPage /></ProtectedRoute>} />
        <Route path="/transport" element={<ProtectedRoute><GuestTransportPage /></ProtectedRoute>} />
        <Route path="/wifi" element={<ProtectedRoute><GuestWifiPage /></ProtectedRoute>} />
        <Route path="/checkout-checklist" element={<ProtectedRoute><GuestCheckoutPage /></ProtectedRoute>} />
        <Route path="/rules" element={<ProtectedRoute><GuestHouseRulesPage /></ProtectedRoute>} />
        <Route path="/review" element={<ProtectedRoute><GuestReviewPage /></ProtectedRoute>} />
        <Route path="/restaurants" element={<ProtectedRoute><GuestRestaurantsPage /></ProtectedRoute>} />
        <Route path="/ai-chat" element={<ProtectedRoute><GuestAIChatPage /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><GuestJournalPage /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

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
          <Route path="pointage" element={<PointagePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="security-alerts" element={<SecurityAlertsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <Toaster />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
