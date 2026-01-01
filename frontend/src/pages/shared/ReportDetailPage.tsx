import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  ThumbsUp,
  Eye,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Textarea,
  Select,
} from '@/components/ui';
import { reportService } from '@/services/report.service';
import { useAuth } from '@/stores/auth.store';
import {
  getStatusLabel,
  getStatusColor,
  getCategoryLabel,
  getTypeLabel,
  formatDate,
  formatRelativeTime,
} from '@/lib/utils';
import type { ReportStatus } from '@/types';

const STATUS_TRANSITIONS: Partial<Record<ReportStatus, { value: ReportStatus; label: string }[]>> = {
  PENDING: [
    { value: 'IN_PROGRESS', label: 'Mulai Proses' },
    { value: 'REJECTED', label: 'Tolak Laporan' },
  ],
  RECEIVED: [
    { value: 'IN_REVIEW', label: 'Tinjau' },
    { value: 'REJECTED', label: 'Tolak Laporan' },
  ],
  IN_REVIEW: [
    { value: 'ASSIGNED', label: 'Tugaskan' },
    { value: 'REJECTED', label: 'Tolak Laporan' },
  ],
  ASSIGNED: [
    { value: 'IN_PROGRESS', label: 'Mulai Proses' },
  ],
  IN_PROGRESS: [
    { value: 'RESOLVED', label: 'Selesaikan' },
    { value: 'ESCALATED', label: 'Eskalasi' },
    { value: 'WAITING_FEEDBACK', label: 'Menunggu Feedback' },
  ],
  WAITING_FEEDBACK: [
    { value: 'IN_PROGRESS', label: 'Lanjutkan Proses' },
    { value: 'RESOLVED', label: 'Selesaikan' },
  ],
  ESCALATED: [
    { value: 'IN_PROGRESS', label: 'Kembali ke Proses' },
    { value: 'RESOLVED', label: 'Selesaikan' },
  ],
  RESOLVED: [
    { value: 'CLOSED', label: 'Tutup Laporan' },
  ],
  CLOSED: [],
  REJECTED: [],
};

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState<ReportStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.roles?.some((ur) =>
    ['ADMIN', 'CITY_ADMIN', 'DEPARTMENT_HEAD', 'STAFF_L1', 'STAFF_L2', 'STAFF_L3'].includes(ur.role.name)
  );
  const justCreated = location.state?.justCreated;
  const referenceNumber = location.state?.referenceNumber;

  const { data, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportService.getReport(id!),
    enabled: !!id,
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => reportService.addComment(id!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      setComment('');
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: () => reportService.upvoteReport(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', id] });
    },
  });

  const removeUpvoteMutation = useMutation({
    mutationFn: () => reportService.removeUpvote(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', id] });
    },
  });

  const handleUpvoteToggle = () => {
    if (report?.hasUpvoted) {
      removeUpvoteMutation.mutate();
    } else {
      upvoteMutation.mutate();
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, note }: { status: ReportStatus; note?: string }) =>
      reportService.updateStatus(id!, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      setNewStatus('');
      setStatusNote('');
    },
  });

  const report = data?.data;
  const availableTransitions = report ? (STATUS_TRANSITIONS[report.status] || []) : [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-8" />
          <div className="space-y-4">
            <div className="h-40 bg-gray-200 rounded" />
            <div className="h-40 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Laporan tidak ditemukan
            </h3>
            <p className="text-gray-600 mb-6">
              Laporan yang Anda cari tidak ada atau telah dihapus
            </p>
            <Button onClick={() => navigate(-1)}>Kembali</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Banner */}
      {justCreated && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Laporan berhasil dibuat!</p>
            <p className="text-sm text-green-700">
              Nomor referensi Anda: <strong>{referenceNumber}</strong>. Simpan nomor ini
              untuk melacak status laporan Anda.
            </p>
          </div>
        </div>
      )}

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        Kembali
      </Button>

      {/* Report Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm text-gray-500">{report.referenceNumber}</span>
          <Badge variant="outline">{getCategoryLabel(report.category)}</Badge>
          <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
          <Badge className={getStatusColor(report.status)}>
            {getStatusLabel(report.status)}
          </Badge>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          {/* Upvote Button - Only for PUBLIC reports */}
          {report.type === 'PUBLIC' && (
            <div className="flex items-center gap-4">
              <Button
                variant={report.hasUpvoted ? 'primary' : 'outline'}
                size="sm"
                onClick={handleUpvoteToggle}
                disabled={!user || upvoteMutation.isPending || removeUpvoteMutation.isPending}
                leftIcon={<ThumbsUp className={`w-4 h-4 ${report.hasUpvoted ? 'fill-current' : ''}`} />}
              >
                {report.upvoteCount}
              </Button>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Eye className="w-4 h-4" />
                <span>{report.viewCount}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(report.createdAt)}</span>
          </div>
          {report.reporter && report.type !== 'ANONYMOUS' && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{report.reporter.name || report.reporter.fullName}</span>
            </div>
          )}
          {report.locationAddress && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{report.locationAddress}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Deskripsi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
            </CardContent>
          </Card>

          {/* Media */}
          {report.media && report.media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Foto Pendukung ({report.media.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {report.media.map((media, index) => (
                    <a
                      key={media.id}
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={media.url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Komentar ({report.comments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.comments && report.comments.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {report.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-4 rounded-lg ${
                        c.isAdmin ? 'bg-primary-50 border-l-4 border-primary-500' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {c.isAdmin ? 'Petugas' : (c.author?.name || c.author?.fullName || 'Anonim')}
                        </span>
                        {c.isAdmin && (
                          <Badge size="sm" variant="outline">
                            Admin
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700">{c.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 mb-6">Belum ada komentar</p>
              )}

              {/* Add Comment Form */}
              {user && (
                <div className="border-t pt-4">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tulis komentar..."
                    rows={3}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      onClick={() => addCommentMutation.mutate(comment)}
                      isLoading={addCommentMutation.isPending}
                      disabled={!comment.trim()}
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      Kirim
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Status</CardTitle>
            </CardHeader>
            <CardContent>
              {report.statusHistory && report.statusHistory.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {report.statusHistory.map((history, index) => (
                      <div key={history.id} className="relative pl-10">
                        <div
                          className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 ${
                            index === 0
                              ? 'bg-primary-500 border-primary-500'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                        <div>
                          <Badge
                            className={getStatusColor(history.newStatus)}
                            size="sm"
                          >
                            {getStatusLabel(history.newStatus)}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(history.createdAt)}
                          </p>
                          {history.notes && (
                            <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Belum ada riwayat</p>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions */}
          {isAdmin && availableTransitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                    options={[
                      { value: '', label: 'Pilih status baru' },
                      ...availableTransitions,
                    ]}
                  />
                  {newStatus && (
                    <>
                      <Textarea
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder="Catatan (opsional)"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        {newStatus === 'REJECTED' ? (
                          <Button
                            variant="danger"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                status: newStatus,
                                note: statusNote,
                              })
                            }
                            isLoading={updateStatusMutation.isPending}
                            leftIcon={<XCircle className="w-4 h-4" />}
                            className="flex-1"
                          >
                            Tolak
                          </Button>
                        ) : newStatus === 'RESOLVED' ? (
                          <Button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                status: newStatus,
                                note: statusNote,
                              })
                            }
                            isLoading={updateStatusMutation.isPending}
                            leftIcon={<CheckCircle className="w-4 h-4" />}
                            className="flex-1"
                          >
                            Selesaikan
                          </Button>
                        ) : (
                          <Button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                status: newStatus,
                                note: statusNote,
                              })
                            }
                            isLoading={updateStatusMutation.isPending}
                            className="flex-1"
                          >
                            Update
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Nomor Referensi</dt>
                  <dd className="font-medium text-gray-900">{report.referenceNumber}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Kategori</dt>
                  <dd className="font-medium text-gray-900">
                    {getCategoryLabel(report.category)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Jenis Laporan</dt>
                  <dd className="font-medium text-gray-900">
                    {getTypeLabel(report.type)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Dibuat</dt>
                  <dd className="font-medium text-gray-900">
                    {formatDate(report.createdAt)}
                  </dd>
                </div>
                {report.updatedAt !== report.createdAt && (
                  <div>
                    <dt className="text-gray-500">Terakhir Diperbarui</dt>
                    <dd className="font-medium text-gray-900">
                      {formatDate(report.updatedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
