import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  Settings,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsPejabatUtama, useIsAdmin, useIsPejabatMuda } from '@/stores/auth.store';

interface AdminLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showFor: ('admin' | 'pejabat_utama' | 'pejabat_muda')[];
}

// Role-based menu configuration
// Admin: manages accounts only (Staff, Settings)
// Pejabat Muda: processes reports (Dashboard, Laporan Departemen)
// Pejabat Utama: monitors + escalations (Dashboard, Laporan, Kinerja, Eskalasi)
const adminLinks: AdminLink[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, showFor: ['pejabat_muda', 'pejabat_utama'] },
  { to: '/admin/reports', label: 'Laporan Departemen', icon: FileText, showFor: ['pejabat_muda', 'pejabat_utama'] },
  { to: '/admin/escalated', label: 'Laporan Eskalasi', icon: AlertTriangle, showFor: ['pejabat_utama'] },
  { to: '/admin/performance', label: 'Kinerja Staff', icon: TrendingUp, showFor: ['pejabat_utama'] },
  { to: '/admin/analytics', label: 'Analitik', icon: BarChart3, showFor: ['pejabat_utama'] },
  { to: '/admin/staff', label: 'Kelola Akun', icon: Users, showFor: ['admin'] },
  { to: '/admin/settings', label: 'Pengaturan', icon: Settings, showFor: ['admin', 'pejabat_muda', 'pejabat_utama'] },
];

export function AdminNav() {
  const location = useLocation();
  const isPejabatUtama = useIsPejabatUtama();
  const isPejabatMuda = useIsPejabatMuda();
  const isAdmin = useIsAdmin();

  const filteredLinks = adminLinks.filter((link) => {
    // Admin only sees admin-specific menus
    if (isAdmin && !isPejabatUtama && !isPejabatMuda) {
      return link.showFor.includes('admin');
    }
    // Pejabat Utama sees their menus
    if (isPejabatUtama) {
      return link.showFor.includes('pejabat_utama');
    }
    // Pejabat Muda sees their menus
    if (isPejabatMuda) {
      return link.showFor.includes('pejabat_muda');
    }
    return false;
  });

  return (
    <nav className="bg-white border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.to ||
              (link.to !== '/admin' && location.pathname.startsWith(link.to));

            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
