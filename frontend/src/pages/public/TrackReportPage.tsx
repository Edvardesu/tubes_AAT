import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Clock, MapPin } from 'lucide-react';
import { Button, Input, Card, CardContent, Badge } from '@/components/ui';
import { reportService } from '@/services/report.service';
import { getStatusLabel, getStatusColor, formatDateTime } from '@/lib/utils';
import type { Report } from '@/types';

export function TrackReportPage() {
  const navigate = useNavigate();
  const [referenceNumber, setReferenceNumber] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) return;

    setError(null);
    setReport(null);
    setIsLoading(true);

    try {
      const response = await reportService.getReportByReference(referenceNumber.trim());
      if (response.success && response.data) {
        setReport(response.data);
      } else {
        setError('Laporan tidak ditemukan. Pastikan nomor referensi benar.');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Lacak Laporan
        </h1>
        <p className="text-gray-600">
          Masukkan nomor referensi laporan untuk melihat status terkini
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Contoh: REP-2024-001234"
                className="pl-10"
              />
            </div>
            <Button type="submit" isLoading={isLoading}>
              Lacak
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="p-6 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {report && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <span className="text-sm text-gray-500">{report.referenceNumber}</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{report.title}</h2>
              </div>
              <Badge className={getStatusColor(report.status)}>
                {getStatusLabel(report.status)}
              </Badge>
            </div>

            <p className="text-gray-600 mb-6">{report.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Dibuat: {formatDateTime(report.createdAt)}</span>
              </div>
              {report.locationAddress && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{report.locationAddress}</span>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            {report.statusHistory && report.statusHistory.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Riwayat Status</h3>
                <div className="space-y-4">
                  {report.statusHistory.map((history, index) => (
                    <div key={history.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary-600' : 'bg-gray-300'}`} />
                        {index < report.statusHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(history.newStatus)} size="sm">
                            {getStatusLabel(history.newStatus)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(history.createdAt)}
                          </span>
                        </div>
                        {history.notes && (
                          <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6 mt-6">
              <Button
                variant="outline"
                onClick={() => navigate(`/reports/${report.id}`)}
                className="w-full"
              >
                Lihat Detail Lengkap
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}