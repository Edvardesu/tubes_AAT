import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, TrendingUp, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui';
import { AdminNav } from '@/components/layout';
import { analyticsService } from '@/services/analytics.service';

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Minggu Ini' },
  { value: '30d', label: 'Bulan Ini' },
  { value: '90d', label: '3 Bulan Terakhir' },
  { value: '365d', label: 'Tahun Ini' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#EAB308',
  IN_PROGRESS: '#3B82F6',
  ESCALATED: '#F97316',
  RESOLVED: '#22C55E',
  REJECTED: '#EF4444',
};

const CATEGORY_COLORS = [
  '#3B82F6',
  '#22C55E',
  '#EAB308',
  '#F97316',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#6B7280',
];

export function AdminAnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const { data: statsData } = useQuery({
    queryKey: ['analyticsStats', period],
    queryFn: () => analyticsService.getAnalyticsStats(period),
  });

  const { data: trendsData } = useQuery({
    queryKey: ['analyticsTrends', period],
    queryFn: () => analyticsService.getTrends(parseInt(period.replace('d', '')) || 30),
  });

  const { data: categoryData } = useQuery({
    queryKey: ['analyticsByCategory', period],
    queryFn: () => analyticsService.getByCategory(period),
  });

  const { data: statusData } = useQuery({
    queryKey: ['analyticsByStatus'],
    queryFn: () => analyticsService.getByStatus(),
  });

  const stats = statsData?.data;
  const trends = trendsData?.data || [];
  const categories = categoryData?.data || [];
  const statuses = statusData?.data || [];

  return (
    <>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analitik</h1>
            <p className="text-gray-600">
            Statistik dan tren laporan warga
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={PERIOD_OPTIONS}
            className="w-44"
          />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Laporan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalReports || 0}
                </p>
                {stats?.totalGrowth !== undefined && (
                  <p
                    className={`text-sm ${
                      stats.totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stats.totalGrowth >= 0 ? '+' : ''}
                    {stats.totalGrowth}% dari periode sebelumnya
                  </p>
                )}
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
                <p className="text-sm text-gray-500">Laporan Baru</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.newReports || 0}
                </p>
                <p className="text-sm text-gray-500">Periode ini</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tingkat Penyelesaian</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.resolutionRate?.toFixed(1) || 0}%
                </p>
                <p className="text-sm text-gray-500">Dari total laporan</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rata-rata Waktu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.avgResolutionTime?.toFixed(1) || 0}
                </p>
                <p className="text-sm text-gray-500">Hari penyelesaian</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    name="Dibuat"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    name="Selesai"
                    stroke="#22C55E"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statuses as Array<{ status: string; count: number; [key: string]: unknown }>}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {statuses.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || '#6B7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Laporan per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" name="Jumlah">
                    {categories.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Lokasi Teratas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topLocations?.length ? (
                stats.topLocations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-gray-900">{location.address}</span>
                    </div>
                    <span className="text-gray-500">{location.count} laporan</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Tidak ada data lokasi
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
