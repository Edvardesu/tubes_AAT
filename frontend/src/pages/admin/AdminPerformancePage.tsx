import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  CheckCircle,
  ArrowUpRight,
  Clock,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { AdminNav } from '@/components/layout';
import { reportService } from '@/services/report.service';

export function AdminPerformancePage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['staffPerformance', dateRange],
    queryFn: () => reportService.getStaffPerformance(dateRange.startDate, dateRange.endDate),
  });

  const performance = data?.data;

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} menit`;
    if (hours < 24) return `${Math.round(hours)} jam`;
    return `${Math.round(hours / 24)} hari`;
  };

  const getPerformanceColor = (resolved: number, escalated: number) => {
    if (escalated === 0 && resolved > 0) return 'text-green-600';
    const ratio = resolved / (resolved + escalated || 1);
    if (ratio >= 0.8) return 'text-green-600';
    if (ratio >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Monitoring Kinerja</h1>
          <p className="text-gray-600">
            Pantau kinerja Pejabat Muda dalam menangani laporan warga
          </p>
        </div>

        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Perubahan Status</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {performance?.summary?.totalReports || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Laporan Diselesaikan</p>
                      <p className="text-2xl font-bold text-green-600">
                        {performance?.summary?.totalResolved || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Laporan Dieskalasi</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {performance?.summary?.totalEscalated || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ArrowUpRight className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Rata-rata Waktu Penyelesaian</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatHours(performance?.summary?.avgResolutionTime || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subordinates Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Kinerja Pejabat Muda
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performance?.subordinates && performance.subordinates.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Nama
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Total Aktivitas
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Diselesaikan
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Dieskalasi
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Rata-rata Waktu
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Kinerja
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {performance.subordinates.map((staff) => {
                          const performanceRatio = staff.resolved / (staff.resolved + staff.escalated || 1);
                          return (
                            <tr key={staff.staffId} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary-600">
                                      {staff.fullName.charAt(0)}
                                    </span>
                                  </div>
                                  <span className="font-medium text-gray-900">{staff.fullName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {staff.totalAssigned}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <Badge className="bg-green-100 text-green-700">
                                  {staff.resolved}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <Badge className="bg-orange-100 text-orange-700">
                                  {staff.escalated}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatHours(staff.avgResolutionTime)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        performanceRatio >= 0.8
                                          ? 'bg-green-500'
                                          : performanceRatio >= 0.5
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                      }`}
                                      style={{ width: `${performanceRatio * 100}%` }}
                                    />
                                  </div>
                                  <span className={`text-sm font-medium ${getPerformanceColor(staff.resolved, staff.escalated)}`}>
                                    {Math.round(performanceRatio * 100)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Tidak ada data kinerja Pejabat Muda</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Data akan muncul setelah Pejabat Muda memproses laporan
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Tips */}
            <Card className="mt-6 bg-primary-50 border-primary-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-6 h-6 text-primary-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary-900">Tips Evaluasi Kinerja</h3>
                    <ul className="mt-2 text-sm text-primary-700 space-y-1">
                      <li>- Kinerja dihitung dari rasio laporan yang diselesaikan vs dieskalasi</li>
                      <li>- Waktu penyelesaian rata-rata mempengaruhi efisiensi penanganan</li>
                      <li>- Eskalasi yang tinggi mungkin menunjukkan kebutuhan pelatihan tambahan</li>
                      <li>- Gunakan filter tanggal untuk melihat tren kinerja dalam periode tertentu</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
