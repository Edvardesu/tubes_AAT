import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/stores/auth.store';
import { SocketProvider } from '@/stores/socket.store';
import { MainLayout } from '@/components/layout';

// Public Pages
import { HomePage, LoginPage, RegisterPage, TrackReportPage, PublicReportsPage } from '@/pages/public';

// Citizen Pages
import { DashboardPage, MyReportsPage, CreateReportPage, NotificationsPage } from '@/pages/citizen';

// Admin Pages
import { AdminDashboardPage, AdminReportsPage, AdminAnalyticsPage, AdminSettingsPage, AdminStaffPage, AdminPerformancePage, AdminEscalatedPage } from '@/pages/admin';

// Shared Pages
import { ReportDetailPage } from '@/pages/shared';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin Route Component - for any admin/staff user
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.role === 'ADMIN' || user?.roles?.some((ur) => {
    const roleName = typeof ur === 'string' ? ur : (ur.role?.name ?? '');
    return ['ADMIN', 'CITY_ADMIN', 'DEPARTMENT_HEAD', 'STAFF_L1', 'STAFF_L2', 'STAFF_L3'].includes(roleName);
  });

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Pejabat Route - for Pejabat Muda and Pejabat Utama only (not pure admin)
function PejabatRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isPejabat = user?.roles?.some((ur) => {
    const roleName = typeof ur === 'string' ? ur : (ur.role?.name ?? '');
    return ['DEPARTMENT_HEAD', 'STAFF_L1', 'STAFF_L2'].includes(roleName);
  });

  if (!isPejabat) {
    return <Navigate to="/admin/staff" replace />;
  }

  return <>{children}</>;
}

// Pejabat Utama Route - for Pejabat Utama only
function PejabatUtamaRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isPejabatUtama = user?.roles?.some((ur) => {
    const roleName = typeof ur === 'string' ? ur : (ur.role?.name ?? '');
    return ['DEPARTMENT_HEAD', 'STAFF_L2'].includes(roleName);
  });

  if (!isPejabatUtama) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/track" element={<TrackReportPage />} />
        <Route path="/reports" element={<PublicReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />

        {/* Protected Citizen Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-reports"
          element={
            <ProtectedRoute>
              <MyReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-report"
          element={
            <ProtectedRoute>
              <CreateReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        {/* Dashboard - for Pejabat only, Admin redirects to /admin/staff */}
        <Route
          path="/admin"
          element={
            <PejabatRoute>
              <AdminDashboardPage />
            </PejabatRoute>
          }
        />
        {/* Department Reports - for Pejabat only */}
        <Route
          path="/admin/reports"
          element={
            <PejabatRoute>
              <AdminReportsPage />
            </PejabatRoute>
          }
        />
        {/* Escalated Reports - for Pejabat Utama only */}
        <Route
          path="/admin/escalated"
          element={
            <PejabatUtamaRoute>
              <AdminEscalatedPage />
            </PejabatUtamaRoute>
          }
        />
        {/* Performance - for Pejabat Utama only */}
        <Route
          path="/admin/performance"
          element={
            <PejabatUtamaRoute>
              <AdminPerformancePage />
            </PejabatUtamaRoute>
          }
        />
        {/* Analytics - for Pejabat Utama only */}
        <Route
          path="/admin/analytics"
          element={
            <PejabatUtamaRoute>
              <AdminAnalyticsPage />
            </PejabatUtamaRoute>
          }
        />
        {/* Staff Management - for Admin only */}
        <Route
          path="/admin/staff"
          element={
            <AdminRoute>
              <AdminStaffPage />
            </AdminRoute>
          }
        />
        {/* Settings - for all admin/staff */}
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettingsPage />
            </AdminRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Halaman tidak ditemukan</p>
              <a href="/" className="text-primary-600 hover:text-primary-700">
                Kembali ke Beranda
              </a>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
