import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronRight, Clock, ArrowUpRight } from 'lucide-react';
import {
  Button,
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
import type { ReportCategory } from '@/types';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'INFRASTRUCTURE', label: 'Infrastruktur' },
  { value: 'PUBLIC_SERVICE', label: 'Pelayanan Publik' },
  { value: 'ENVIRONMENT', label: 'Lingkungan' },
  { value: 'SECURITY', label: 'Keamanan' },
  { value: 'SOCIAL', label: 'Sosial' },
  { value: 'HEALTH', label: 'Kesehatan' },
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Terbaru' },
  { value: 'createdAt:asc', label: 'Terlama' },
  { value: 'priority:desc', label: 'Prioritas Tertinggi' },
];

export function AdminEscalatedPage() {
  const [filters, setFilters] = useState({
    category: '' as ReportCategory | '',
    sort: 'createdAt:desc',
    page: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['escalatedReports', filters],
    queryFn: () =>
      reportService.getEscalatedReports({
        category: filters.category || undefined,
        sort: filters.sort,
        page: filters.page,
        limit: 20,
      }),
  });

  const reports = data?.data?.reports || [];
  const meta = data?.data?.meta;

  return (
    <>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Laporan Eskalasi</h1>
            <Badge className="bg-orange-100 text-orange-700">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Perlu Perhatian
            </Badge>
          </div>
          <p className="text-gray-600">
            Laporan yang dieskalasi oleh Pejabat Muda dan membutuhkan penanganan Anda
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ArrowUpRight className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Tentang Laporan Eskalasi</p>
                <p className="text-sm text-orange-700 mt-1">
                  Laporan ini dieskalasi karena Pejabat Muda membutuhkan bantuan atau keputusan dari Anda.
                  Tinjau setiap laporan dan ambil tindakan yang diperlukan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
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
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Daftar Laporan Eskalasi
              {meta && (
                <span className="font-normal text-gray-500 ml-2">
                  ({meta.total} laporan)
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
              <div className="p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Tidak ada laporan eskalasi</p>
                <p className="text-sm text-gray-400 mt-1">
                  Semua laporan sedang ditangani dengan baik oleh Pejabat Muda
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <Link
                      key={report.id}
                      to={`/reports/${report.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-primary-600">
                              {report.referenceNumber}
                            </span>
                            <Badge className={getStatusColor(report.status)} size="sm">
                              {getStatusLabel(report.status)}
                            </Badge>
                            <Badge className="bg-orange-100 text-orange-700" size="sm">
                              Level {report.escalationLevel}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-gray-900 truncate">
                            {report.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{getCategoryLabel(report.category)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(report.createdAt)}
                            </span>
                            {report.status === 'ESCALATED' && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <ArrowUpRight className="w-3 h-3" />
                                Dieskalasi {formatRelativeTime(report.updatedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
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
