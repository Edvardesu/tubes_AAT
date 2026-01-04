import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { AdminNav } from '@/components/layout';
import { analyticsService } from '@/services/analytics.service';
import { reportService } from '@/services/report.service';
import { useIsPejabatMuda, useIsPejabatUtama } from '@/stores/auth.store';
import { getStatusLabel, getStatusColor, formatRelativeTime } from '@/lib/utils';

export function AdminDashboardPage() {
  const isPejabatMuda = useIsPejabatMuda();
  const isPejabatUtama = useIsPejabatUtama();
  const isStaff = isPejabatMuda || isPejabatUtama;

  const { data: statsData } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => analyticsService.getDashboardStats(),
  });

  // Use department reports for staff
  const { data: reportsData } = useQuery({
    queryKey: ['recentReportsAdmin', isStaff],
    queryFn: () =>
      isStaff
        ? reportService.getDepartmentReports({ limit: 10 })
        : reportService.getReports({ limit: 10 }),
  });

  // Get escalated reports count for Pejabat Utama
  const { data: escalatedData } = useQuery({
    queryKey: ['escalatedReportsCount'],
    queryFn: () => reportService.getEscalatedReports({ limit: 1 }),
    enabled: isPejabatUtama,
  });

  const stats = statsData?.data;
  const reports = reportsData?.data || [];
  const escalatedCount = escalatedData?.meta?.total || 0;

  // Determine title based on role
  const getDashboardTitle = () => {
    if (isPejabatUtama) return 'Dashboard Pejabat Utama';
    if (isPejabatMuda) return 'Dashboard Pejabat Muda';
    return 'Dashboard Admin';
  };

  const getDashboardSubtitle = () => {
    if (isPejabatUtama) return 'Pantau kinerja tim dan laporan eskalasi';
    if (isPejabatMuda) return 'Kelola dan proses laporan departemen Anda';
    return 'Pantau dan kelola laporan warga';
  };

  return (
    <>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{getDashboardTitle()}</h1>
            {isStaff && (
              <Badge className="bg-primary-100 text-primary-700">
                <Building2 className="w-3 h-3 mr-1" />
                {isPejabatUtama ? 'Pejabat Utama' : 'Pejabat Muda'}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">{getDashboardSubtitle()}</p>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Laporan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalReports || 0}
                </p>
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
                <p className="text-sm text-gray-500">Menunggu Proses</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.pendingReports || 0}
                </p>
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
                <p className="text-sm text-gray-500">Sedang Diproses</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.inProgressReports || 0}
                </p>
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
                <p className="text-2xl font-bold text-green-600">
                  {stats?.resolvedReports || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Escalation Alert for Pejabat Utama */}
      {isPejabatUtama && escalatedCount > 0 && (
        <Card className="mb-8 bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-orange-800">
                    {escalatedCount} Laporan Dieskalasi
                  </p>
                  <p className="text-sm text-orange-700">
                    Laporan yang membutuhkan perhatian Anda dari Pejabat Muda
                  </p>
                </div>
              </div>
              <Link
                to="/admin/escalated"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                Lihat Semua
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Laporan Hari Ini</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.todayReports || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dieskalasi</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isPejabatUtama ? escalatedCount : (stats?.escalatedReports || 0)}
                </p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Minggu Ini</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.weekReports || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Laporan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Referensi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Judul
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Waktu
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-primary-600">
                      <Link to={`/reports/${report.id}`}>
                        {report.referenceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {report.title}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.category}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(report.status)} size="sm">
                        {getStatusLabel(report.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatRelativeTime(report.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
