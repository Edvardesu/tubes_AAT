import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  User,
  LogOut,
  Settings,
  FileText,
  LayoutDashboard,
  ChevronDown,
  Users,
} from 'lucide-react';
import { useAuth, useIsStaff, useIsPejabatMuda, useIsPejabatUtama, useIsAdmin } from '@/stores/auth.store';
import { useSocket } from '@/stores/socket.store';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useSocket();
  const isStaff = useIsStaff();
  const isPejabatMuda = useIsPejabatMuda();
  const isPejabatUtama = useIsPejabatUtama();
  const isAdmin = useIsAdmin();
  const isPejabat = isPejabatMuda || isPejabatUtama;
  const isAdminOnly = isAdmin && !isPejabat;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isTransparent = isHomePage && !isScrolled;

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
        isTransparent
          ? 'bg-transparent py-6'
          : 'bg-white/95 backdrop-blur-md shadow-sm py-3'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <span
                className={cn(
                  'text-2xl font-bold transition-colors duration-300',
                  isTransparent ? 'text-white' : 'text-primary-600'
                )}
              >
                Lapor Pakdhe
              </span>
            </Link>

            <div className="hidden md:flex md:space-x-1">
              <Link
                to="/"
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isTransparent
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                )}
              >
                Beranda
              </Link>
              <Link
                to="/reports"
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isTransparent
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                )}
              >
                Laporan Publik
              </Link>
              <Link
                to="/track"
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isTransparent
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                )}
              >
                Lacak Laporan
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {!isStaff && (
                  <Link to="/create-report" className="hidden sm:block">
                    <Button
                      size="sm"
                      leftIcon={<FileText className="w-4 h-4" />}
                      className={cn(
                        'transition-all duration-200',
                        isTransparent && 'bg-white text-primary-700 hover:bg-white/90'
                      )}
                    >
                      Buat Laporan
                    </Button>
                  </Link>
                )}

                <Link
                  to="/notifications"
                  className={cn(
                    'relative p-2 rounded-lg transition-colors duration-200',
                    isTransparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                  )}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200',
                      isTransparent
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200',
                        isTransparent ? 'bg-white/20' : 'bg-primary-100'
                      )}
                    >
                      <User
                        className={cn(
                          'w-4 h-4',
                          isTransparent ? 'text-white' : 'text-primary-600'
                        )}
                      />
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.fullName?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Dropdown */}
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">
                            {user?.fullName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                        </div>

                        <div className="py-1">
                          {isPejabat ? (
                            // Pejabat Muda / Pejabat Utama
                            <Link
                              to="/admin"
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <LayoutDashboard className="w-4 h-4 mr-3" />
                              {isPejabatUtama ? 'Panel Pejabat Utama' : 'Panel Pejabat Muda'}
                            </Link>
                          ) : isAdminOnly ? (
                            // Admin only (manages accounts)
                            <Link
                              to="/admin/staff"
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <Users className="w-4 h-4 mr-3" />
                              Kelola Akun
                            </Link>
                          ) : (
                            // Regular citizen
                            <>
                              <Link
                                to="/dashboard"
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <LayoutDashboard className="w-4 h-4 mr-3" />
                                Dashboard
                              </Link>

                              <Link
                                to="/my-reports"
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <FileText className="w-4 h-4 mr-3" />
                                Laporan Saya
                              </Link>
                            </>
                          )}

                          <Link
                            to="/settings"
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Pengaturan
                          </Link>
                        </div>

                        <div className="border-t border-gray-100 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Keluar
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'transition-colors duration-200',
                      isTransparent && 'text-white hover:bg-white/10 hover:text-white'
                    )}
                  >
                    Masuk
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button
                    size="sm"
                    className={cn(
                      'transition-all duration-200',
                      isTransparent && 'bg-white text-primary-700 hover:bg-white/90'
                    )}
                  >
                    Daftar
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                'md:hidden p-2 rounded-lg transition-colors duration-200',
                isTransparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 pt-4 pb-6 space-y-2 bg-white/95 backdrop-blur-md border-t border-gray-100">
          <Link
            to="/"
            className="block px-4 py-2.5 text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Beranda
          </Link>
          <Link
            to="/reports"
            className="block px-4 py-2.5 text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Laporan Publik
          </Link>
          <Link
            to="/track"
            className="block px-4 py-2.5 text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Lacak Laporan
          </Link>
          {isAuthenticated && !isStaff && (
            <Link
              to="/create-report"
              className="block px-4 py-2.5 text-base font-medium text-primary-600 bg-primary-50 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Buat Laporan
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}