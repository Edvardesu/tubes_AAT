import { Link } from 'react-router-dom';
import { FileText, Search, Bell, BarChart3, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/stores/auth.store';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Lapor Pakdhe
            </h1>
            <p className="text-xl sm:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Sistem Pelaporan Warga Terpadu untuk melaporkan permasalahan di lingkungan Anda
              kepada pihak berwenang dengan mudah dan transparan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={isAuthenticated ? '/create-report' : '/register'}>
                <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 w-full sm:w-auto">
                  <FileText className="w-5 h-5 mr-2" />
                  Buat Laporan
                </Button>
              </Link>
              <Link to="/track">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  <Search className="w-5 h-5 mr-2" />
                  Lacak Laporan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Kami menyediakan berbagai fitur untuk memudahkan Anda dalam melaporkan
              dan memantau penanganan permasalahan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Laporan Mudah
              </h3>
              <p className="text-gray-600">
                Buat laporan dengan mudah dan cepat. Dukung dengan foto dan lokasi GPS
                untuk dokumentasi yang lebih baik.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tracking Real-time
              </h3>
              <p className="text-gray-600">
                Pantau status laporan Anda secara real-time. Dapatkan notifikasi
                setiap ada update penanganan.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Notifikasi Instan
              </h3>
              <p className="text-gray-600">
                Terima notifikasi langsung ke perangkat Anda saat ada perkembangan
                terkait laporan yang Anda buat.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Transparansi Data
              </h3>
              <p className="text-gray-600">
                Lihat statistik dan tren penanganan laporan secara transparan
                melalui dashboard publik.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Laporan Anonim
              </h3>
              <p className="text-gray-600">
                Laporkan tanpa khawatir. Kami menyediakan opsi laporan anonim
                untuk menjaga privasi Anda.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Routing Otomatis
              </h3>
              <p className="text-gray-600">
                Laporan Anda akan otomatis diteruskan ke departemen terkait
                berdasarkan kategori dan lokasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Siap Melaporkan?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan warga lainnya yang telah menggunakan
            Lapor Pakdhe untuk membuat lingkungan kita lebih baik.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link to="/register">
                  <Button size="lg">Daftar Sekarang</Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Sudah Punya Akun? Masuk
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/create-report">
                <Button size="lg">Buat Laporan Baru</Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">2.5M+</div>
              <div className="text-gray-600">Warga Terlayani</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">10K+</div>
              <div className="text-gray-600">Laporan Diproses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">85%</div>
              <div className="text-gray-600">Tingkat Penyelesaian</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">6</div>
              <div className="text-gray-600">Departemen Terhubung</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
