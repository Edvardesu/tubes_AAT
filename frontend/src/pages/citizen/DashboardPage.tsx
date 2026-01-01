import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { useAuth } from '@/stores/auth.store';
import { useSocket } from '@/stores/socket.store';
import { reportService } from '@/services/report.service';
import { notificationService } from '@/services/notification.service';
import {
  getStatusLabel,
  getStatusColor,
  formatRelativeTime,
} from '@/lib/utils';

export function DashboardPage() {
  const { user } = useAuth();
  const { unreadCount } = useSocket();

  const { data: reportsData } = useQuery({
    queryKey: ['myReportsStats'],
    queryFn: () => reportService.getMyReports({ limit: 5 }),
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['recentNotifications'],
    queryFn: () => notificationService.getNotifications({ page: 1, limit: 5 }),
  });

  const reports = reportsData?.data?.reports || [];
  const notifications = notificationsData?.data?.notifications || [];
  const totalReports = reportsData?.data?.meta?.total || 0;

  // Calculate stats
  const pendingCount = reports.filter((r) =>
    ['PENDING', 'RECEIVED', 'IN_REVIEW'].includes(r.status)
  ).length;
  const inProgressCount = reports.filter((r) =>
    ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)
  ).length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Selamat Datang, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">
          Pantau laporan dan notifikasi Anda dari dashboard ini
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <Link to="/create-report">
          <Button size="lg" leftIcon={<Plus className="w-5 h-5" />}>
            Buat Laporan Baru
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Laporan</p>
                <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Menunggu</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Diproses</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Selesai</p>
                <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Laporan Terbaru</CardTitle>
            <Link to="/my-reports">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Lihat Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada laporan</p>
                <Link to="/create-report" className="mt-4 inline-block">
                  <Button size="sm">Buat Laporan</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.slice(0, 5).map((report) => (
                  <Link
                    key={report.id}
                    to={`/reports/${report.id}`}
                    className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {report.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {report.referenceNumber} • {formatRelativeTime(report.createdAt)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(report.status)} size="sm">
                        {getStatusLabel(report.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Notifikasi
              {unreadCount > 0 && (
                <Badge variant="danger" size="sm">{unreadCount}</Badge>
              )}
            </CardTitle>
            <Link to="/notifications">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Lihat Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.isRead ? 'bg-white' : 'bg-primary-50 border-primary-200'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
