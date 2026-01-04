import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, ThumbsUp, Eye, MapPin, Calendar } from 'lucide-react';
import { Button, Input, Select, Card, CardContent, Badge } from '@/components/ui';
import { reportService } from '@/services/report.service';
import { useAuth } from '@/stores/auth.store';
import {
  getStatusLabel,
  getStatusColor,
  getCategoryLabel,
  formatRelativeTime,
  truncateText,
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
  { value: 'EDUCATION', label: 'Pendidikan' },
  { value: 'TRANSPORTATION', label: 'Transportasi' },
  { value: 'OTHER', label: 'Lainnya' },
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Terbaru' },
  { value: 'createdAt:asc', label: 'Terlama' },
  { value: 'upvoteCount:desc', label: 'Terpopuler' },
];

export function PublicReportsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ReportCategory | ''>('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);

  const [sortBy, sortOrder] = sort.split(':') as ['createdAt' | 'upvoteCount', 'asc' | 'desc'];

  const upvoteMutation = useMutation({
    mutationFn: (reportId: string) => reportService.upvoteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicReports'] });
    },
  });

  const removeUpvoteMutation = useMutation({
    mutationFn: (reportId: string) => reportService.removeUpvote(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicReports'] });
    },
  });

  const handleUpvote = (e: React.MouseEvent, reportId: string, hasUpvoted: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    if (hasUpvoted) {
      removeUpvoteMutation.mutate(reportId);
    } else {
      upvoteMutation.mutate(reportId);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['publicReports', { search, category, sortBy, sortOrder, page }],
    queryFn: () =>
      reportService.getPublicReports({
        search: search || undefined,
        category: category || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 12,
      }),
  });

  const reports = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Publik</h1>
        <p className="text-gray-600">
          Lihat laporan yang dibuat oleh warga untuk lingkungan kita bersama
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari laporan..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-4">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory | '')}
            options={CATEGORY_OPTIONS}
            className="w-48"
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={SORT_OPTIONS}
            className="w-40"
          />
        </div>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak ada laporan ditemukan
            </h3>
            <p className="text-gray-600">
              Coba ubah filter atau kata kunci pencarian
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Link key={report.id} to={`/reports/${report.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" size="sm">
                        {getCategoryLabel(report.category)}
                      </Badge>
                      <Badge className={getStatusColor(report.status)} size="sm">
                        {getStatusLabel(report.status)}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {report.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {truncateText(report.description, 100)}
                    </p>

                    {report.locationAddress && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{report.locationAddress}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatRelativeTime(report.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleUpvote(e, report.id, report.hasUpvoted || false)}
                          disabled={!user || upvoteMutation.isPending || removeUpvoteMutation.isPending}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                            report.hasUpvoted
                              ? 'bg-primary-100 text-primary-600'
                              : 'hover:bg-gray-100 text-gray-500'
                          } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          title={user ? (report.hasUpvoted ? 'Hapus dukungan' : 'Dukung laporan ini') : 'Login untuk mendukung'}
                        >
                          <ThumbsUp className={`w-4 h-4 ${report.hasUpvoted ? 'fill-current' : ''}`} />
                          <span>{report.upvoteCount}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{report.viewCount}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Halaman {page} dari {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === meta.totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}