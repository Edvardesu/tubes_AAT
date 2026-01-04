import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Bell,
  BarChart3,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/stores/auth.store';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-primary-500 via-primary-700 to-primary-950 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content Container */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24 lg:pt-36 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                <Zap className="w-4 h-4 mr-2" />
                Platform Pelaporan Warga Terpadu
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Lapor Pakdhe 10x
                <span className="block text-primary-200">Lebih Cepat</span>
              </h1>

              <p className="text-xl lg:text-2xl text-primary-100 leading-relaxed max-w-xl">
                Laporkan permasalahan di lingkungan Anda dengan mudah, transparan, dan
                dapatkan penanganan yang cepat dari pihak berwenang.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to={isAuthenticated ? '/create-report' : '/register'}>
                  <Button
                    size="lg"
                    className="bg-white text-primary-700 hover:bg-primary-50 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-6 group"
                  >
                    Buat Laporan Sekarang
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/track">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-primary-700 hover:bg-white hover:text-primary-700 transition-all duration-300 text-lg px-8 py-6"
                  >
                    Lacak Laporan
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-2 text-sm text-primary-100 pt-2">
                <CheckCircle className="w-4 h-4" />
                <span>Tanpa biaya apapun • Proses transparan • Notifikasi real-time</span>
              </div>
            </div>

            {/* Right Side */}
            <div className="relative lg:block animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
              <div className="relative z-10">
                {/* Card 1 */}
                <div className="absolute top-0 right-0 bg-white rounded-2xl shadow-2xl p-6 max-w-xs animate-float-delayed">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        Laporan Selesai
                      </div>
                      <div className="text-xs text-gray-500">
                        Jalan rusak di Jl. Sudirman berhasil diperbaiki
                      </div>
                      <div className="text-xs text-green-600 font-medium mt-2">
                        ✓ Ditangani dalam 3 hari
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="absolute top-32 left-0 bg-white rounded-2xl shadow-2xl p-6 max-w-xs animate-float">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        Statistik Real-time
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">2,847</div>
                      <div className="text-xs text-gray-500">Laporan diproses bulan ini</div>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="absolute bottom-12 right-36 bg-white rounded-2xl shadow-2xl p-6 max-w-xs animate-float">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        Komunitas Aktif
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Bergabunglah dengan ribuan warga
                      </div>
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                          >
                            {i === 4 ? '+' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Decorative Element */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-transparent rounded-3xl blur-3xl -z-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-auto" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Fitur Unggulan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Kami menyediakan berbagai fitur untuk memudahkan Anda dalam melaporkan
              dan memantau penanganan permasalahan dengan teknologi terkini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards with Hover Effects */}
            {[
              {
                icon: FileText,
                color: 'primary',
                title: 'Laporan Mudah',
                description:
                  'Buat laporan dengan mudah dan cepat. Dukung dengan foto dan lokasi GPS untuk dokumentasi yang lebih baik.',
              },
              {
                icon: Clock,
                color: 'green',
                title: 'Tracking Real-time',
                description:
                  'Pantau status laporan Anda secara real-time. Dapatkan notifikasi setiap ada update penanganan.',
              },
              {
                icon: Bell,
                color: 'blue',
                title: 'Notifikasi Instan',
                description:
                  'Terima notifikasi langsung ke perangkat Anda saat ada perkembangan terkait laporan yang Anda buat.',
              },
              {
                icon: BarChart3,
                color: 'purple',
                title: 'Transparansi Data',
                description:
                  'Lihat statistik dan tren penanganan laporan secara transparan melalui dashboard publik.',
              },
              {
                icon: Shield,
                color: 'orange',
                title: 'Laporan Anonim',
                description:
                  'Laporkan tanpa khawatir. Kami menyediakan opsi laporan anonim untuk menjaga privasi Anda.',
              },
              {
                icon: Search,
                color: 'red',
                title: 'Routing Otomatis',
                description:
                  'Laporan Anda akan otomatis diteruskan ke departemen terkait berdasarkan kategori dan lokasi.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: '2.5M+', label: 'Warga Terlayani', gradient: 'bg-gradient-to-br from-primary-600 to-primary-700' },
              { value: '10K+', label: 'Laporan Diproses', gradient: 'bg-gradient-to-br from-green-600 to-green-700' },
              { value: '85%', label: 'Tingkat Penyelesaian', gradient: 'bg-gradient-to-br from-blue-600 to-blue-700' },
              { value: '6', label: 'Departemen Terhubung', gradient: 'bg-gradient-to-br from-purple-600 to-purple-700' },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center group cursor-default"
              >
                <div className={`text-5xl md:text-6xl font-bold ${stat.gradient} bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Siap Membuat Perubahan?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan warga lainnya yang telah menggunakan Lapor Pakdhe
            untuk membuat lingkungan kita lebih baik.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link to="/register">
                  <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                    Mulai Sekarang
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    Sudah Punya Akun?
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/create-report">
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                  Buat Laporan Baru
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Inline CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite 2s;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-in-from-bottom-8 {
          from { transform: translateY(2rem); }
          to { transform: translateY(0); }
        }

        @keyframes slide-in-from-right-8 {
          from { transform: translateX(2rem); }
          to { transform: translateX(0); }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .fade-in {
          animation-name: fade-in;
        }

        .slide-in-from-bottom-8 {
          animation-name: slide-in-from-bottom-8;
        }

        .slide-in-from-right-8 {
          animation-name: slide-in-from-right-8;
        }

        .duration-700 {
          animation-duration: 700ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}