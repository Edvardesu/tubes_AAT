import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-primary-600">Lapor Pakdhe</h3>
            <p className="mt-2 text-sm text-gray-600">
              Sistem Pelaporan Warga Terpadu untuk membantu masyarakat melaporkan
              permasalahan di lingkungannya kepada pihak berwenang.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Tautan Cepat
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary-600">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-sm text-gray-600 hover:text-primary-600">
                  Laporan Publik
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-sm text-gray-600 hover:text-primary-600">
                  Lacak Laporan
                </Link>
              </li>
              <li>
                <Link to="/create-report" className="text-sm text-gray-600 hover:text-primary-600">
                  Buat Laporan
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Kontak
            </h4>
            <ul className="mt-4 space-y-2">
              <li className="text-sm text-gray-600">
                Email: info@lapor-pakdhe.id
              </li>
              <li className="text-sm text-gray-600">
                Telepon: (021) 123-4567
              </li>
              <li className="text-sm text-gray-600">
                Alamat: Jl. Merdeka No. 1, Kota
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Lapor Pakdhe. Tugas Besar IF4031 - Arsitektur Aplikasi Terdistribusi.
          </p>
        </div>
      </div>
    </footer>
  );
}
