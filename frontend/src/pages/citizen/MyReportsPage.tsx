import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Button, Select, Card, CardContent, Badge } from '@/components/ui';
import { reportService } from '@/services/report.service';
import {
  getStatusLabel,
  getStatusColor,
  getCategoryLabel,
  formatRelativeTime,
} from '@/lib/utils';
import type { ReportStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'REJECTED', label: 'Ditolak' },
];

export function MyReportsPage() {
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['myReports', { status, page }],
    queryFn: () =>
      reportService.getMyReports({
        status: status || undefined,
        page,
        limit: 10,
      }),
  });

  const reports = data?.data?.reports || [];
  const meta = data?.data?.meta;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 mt-16">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Saya</h1>
          <p className="text-gray-600">
            Lihat dan kelola semua laporan yang Anda buat
          </p>
        </div>
        <Link to="/create-report">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Buat Laporan
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ReportStatus | '');
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          className="w-40"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum ada laporan
            </h3>
            <p className="text-gray-600 mb-6">
              {status
                ? 'Tidak ada laporan dengan status ini'
                : 'Anda belum membuat laporan apapun'}
            </p>
            <Link to="/create-report">
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                Buat Laporan Pertama
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reports.map((report) => (
              <Link key={report.id} to={`/reports/${report.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-500">
                            {report.referenceNumber}
                          </span>
                          <Badge variant="outline" size="sm">
                            {getCategoryLabel(report.category)}
                          </Badge>
                          <Badge className={getStatusColor(report.status)} size="sm">
                            {getStatusLabel(report.status)}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {report.title}
                        </h3>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {report.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatRelativeTime(report.createdAt)}</span>
                          </div>
                          {report.locationAddress && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate max-w-xs">
                                {report.locationAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

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
