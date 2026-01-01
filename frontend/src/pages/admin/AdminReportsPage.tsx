import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ChevronRight, Download } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui';
import { AdminNav } from '@/components/layout';
import { reportService } from '@/services/report.service';
import {
  getStatusLabel,
  getStatusColor,
  getCategoryLabel,
  formatRelativeTime,
} from '@/lib/utils';
import type { ReportStatus, ReportCategory } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'ESCALATED', label: 'Dieskalasi' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'REJECTED', label: 'Ditolak' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'INFRASTRUCTURE', label: 'Infrastruktur' },
  { value: 'PUBLIC_SERVICE', label: 'Pelayanan Publik' },
  { value: 'ENVIRONMENT', label: 'Lingkungan' },
  { value: 'SECURITY', label: 'Keamanan' },
  { value: 'SOCIAL', label: 'Sosial' },
  { value: 'HEALTH', label: 'Kesehatan' },
  { value: 'EDUCATION', label: 'Pendidikan' },
  { value: 'TRANSPORTATION', label: 'Transportasi' },
  { value: 'OTHER', label: 'Lainnya' },
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Terbaru' },
  { value: 'createdAt:asc', label: 'Terlama' },
  { value: 'updatedAt:desc', label: 'Baru Diupdate' },
  { value: 'priority:desc', label: 'Prioritas Tertinggi' },
];

export function AdminReportsPage() {
  const [filters, setFilters] = useState({
    status: '' as ReportStatus | '',
    category: '' as ReportCategory | '',
    search: '',
    sort: 'createdAt:desc',
    page: 1,
  });

  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminReports', filters],
    queryFn: () =>
      reportService.getReports({
        status: filters.status || undefined,
        category: filters.category || undefined,
        search: filters.search || undefined,
        sort: filters.sort,
        page: filters.page,
        limit: 20,
      }),
  });

  const reports = data?.data?.reports || [];
  const meta = data?.data?.meta;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput, page: 1 });
  };

  const handleExport = async () => {
    try {
      const response = await reportService.exportReports({
        status: filters.status || undefined,
        category: filters.category || undefined,
        search: filters.search || undefined,
      });

      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Laporan</h1>
          <p className="text-gray-600">
            Kelola dan proses laporan dari warga
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari laporan..."
                  className="pl-10"
                />
              </div>
            </form>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as ReportStatus | '',
                  page: 1,
                })
              }
              options={STATUS_OPTIONS}
              className="w-40"
            />

            {/* Category Filter */}
            <Select
              value={filters.category}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category: e.target.value as ReportCategory | '',
                  page: 1,
                })
              }
              options={CATEGORY_OPTIONS}
              className="w-48"
            />

            {/* Sort */}
            <Select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              options={SORT_OPTIONS}
              className="w-48"
            />
          </div>

          {/* Active Filters */}
          {(filters.status || filters.category || filters.search) && (
            <div className="mt-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Filter aktif:</span>
              {filters.status && (
                <Badge variant="outline" size="sm">
                  Status: {getStatusLabel(filters.status)}
                  <button
                    onClick={() => setFilters({ ...filters, status: '', page: 1 })}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.category && (
                <Badge variant="outline" size="sm">
                  Kategori: {getCategoryLabel(filters.category)}
                  <button
                    onClick={() => setFilters({ ...filters, category: '', page: 1 })}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.search && (
                <Badge variant="outline" size="sm">
                  Pencarian: "{filters.search}"
                  <button
                    onClick={() => {
                      setFilters({ ...filters, search: '', page: 1 });
                      setSearchInput('');
                    }}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <button
                onClick={() => {
                  setFilters({
                    status: '',
                    category: '',
                    search: '',
                    sort: 'createdAt:desc',
                    page: 1,
                  });
                  setSearchInput('');
                }}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Reset semua
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Daftar Laporan
            {meta && (
              <span className="font-normal text-gray-500 ml-2">
                ({meta.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Tidak ada laporan ditemukan</p>
            </div>
          ) : (
            <>
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
                        Pelapor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Waktu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Link
                            to={`/reports/${report.id}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                          >
                            {report.referenceNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-900 max-w-xs truncate">
                            {report.title}
                          </p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="outline" size="sm">
                            {getCategoryLabel(report.category)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(report.status)} size="sm">
                            {getStatusLabel(report.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.type === 'ANONYMOUS'
                            ? 'Anonim'
                            : (report.reporter?.name || report.reporter?.fullName || '-')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatRelativeTime(report.createdAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Link to={`/reports/${report.id}`}>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="p-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Menampilkan {(filters.page - 1) * 20 + 1} -{' '}
                    {Math.min(filters.page * 20, meta.total)} dari {meta.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters({ ...filters, page: filters.page - 1 })
                      }
                      disabled={filters.page === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters({ ...filters, page: filters.page + 1 })
                      }
                      disabled={filters.page === meta.totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
