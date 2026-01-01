import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth, useIsStaff } from '@/stores/auth.store';
import { useSocket } from '@/stores/socket.store';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useSocket();
  const isStaff = useIsStaff();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Primary Nav */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-600">Lapor Pakdhe</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              <Link
                to="/"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Beranda
              </Link>
              <Link
                to="/reports"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Laporan Publik
              </Link>
              <Link
                to="/track"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Lacak Laporan
              </Link>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Create Report Button */}
                <Link to="/create-report" className="hidden sm:block">
                  <Button size="sm" leftIcon={<FileText className="w-4 h-4" />}>
                    Buat Laporan
                  </Button>
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-primary-600">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:text-primary-600"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.fullName?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>

                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>

                      <Link
                        to="/my-reports"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Laporan Saya
                      </Link>

                      {isStaff && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Link>
                      )}

                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Pengaturan
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Masuk
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button size="sm">Daftar</Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn('md:hidden', isMobileMenuOpen ? 'block' : 'hidden')}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
          <Link
            to="/"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Beranda
          </Link>
          <Link
            to="/reports"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Laporan Publik
          </Link>
          <Link
            to="/track"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Lacak Laporan
          </Link>
          {isAuthenticated && (
            <Link
              to="/create-report"
              className="block px-3 py-2 text-base font-medium text-primary-600 hover:bg-primary-50 rounded-md"
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
