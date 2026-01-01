import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(d);
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Menunggu',
    RECEIVED: 'Diterima',
    IN_REVIEW: 'Ditinjau',
    ASSIGNED: 'Ditugaskan',
    IN_PROGRESS: 'Diproses',
    WAITING_FEEDBACK: 'Menunggu Feedback',
    RESOLVED: 'Selesai',
    CLOSED: 'Ditutup',
    REJECTED: 'Ditolak',
    ESCALATED: 'Dieskalasi',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    RECEIVED: 'bg-blue-100 text-blue-800',
    IN_REVIEW: 'bg-indigo-100 text-indigo-800',
    ASSIGNED: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-cyan-100 text-cyan-800',
    WAITING_FEEDBACK: 'bg-orange-100 text-orange-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    REJECTED: 'bg-red-100 text-red-800',
    ESCALATED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    INFRASTRUCTURE: 'Infrastruktur',
    PUBLIC_SERVICE: 'Pelayanan Publik',
    ENVIRONMENT: 'Lingkungan',
    SECURITY: 'Keamanan',
    SOCIAL: 'Sosial',
    HEALTH: 'Kesehatan',
    EDUCATION: 'Pendidikan',
    TRANSPORTATION: 'Transportasi',
    OTHER: 'Lainnya',
  };
  return labels[category] || category;
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PUBLIC: 'Publik',
    PRIVATE: 'Privat',
    ANONYMOUS: 'Anonim',
  };
  return labels[type] || type;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    INFRASTRUCTURE: 'building',
    PUBLIC_SERVICE: 'users',
    ENVIRONMENT: 'leaf',
    SECURITY: 'shield',
    SOCIAL: 'heart',
    HEALTH: 'activity',
    EDUCATION: 'book-open',
    TRANSPORTATION: 'car',
    OTHER: 'help-circle',
  };
  return icons[category] || 'help-circle';
}

export function getPriorityLabel(priority: number): string {
  const labels: Record<number, string> = {
    1: 'Sangat Tinggi',
    2: 'Tinggi',
    3: 'Sedang',
    4: 'Rendah',
    5: 'Sangat Rendah',
  };
  return labels[priority] || 'Sedang';
}

export function getPriorityColor(priority: number): string {
  const colors: Record<number, string> = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-orange-100 text-orange-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-green-100 text-green-800',
    5: 'bg-gray-100 text-gray-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
