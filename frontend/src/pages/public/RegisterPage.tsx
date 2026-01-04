import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useAuth } from '@/stores/auth.store';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka')
    .regex(/[@$!%*?&]/, 'Password harus mengandung karakter spesial (@$!%*?&)'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Gagal mendaftar. Silakan coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daftar</h1>
          <p className="mt-2 text-gray-600">
            Buat akun Lapor Pakdhe untuk mulai melaporkan
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Buat Akun Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  {...register('fullName')}
                  type="text"
                  placeholder="Nama Lengkap"
                  className="pl-10"
                  error={errors.fullName?.message}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Email"
                  className="pl-10"
                  error={errors.email?.message}
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  {...register('phone')}
                  type="tel"
                  placeholder="Nomor Telepon (opsional)"
                  className="pl-10"
                  error={errors.phone?.message}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="pl-10 pr-10"
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  {...register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Konfirmasi Password"
                  className="pl-10"
                  error={errors.confirmPassword?.message}
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Saya setuju dengan{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                    Syarat & Ketentuan
                  </Link>{' '}
                  dan{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                    Kebijakan Privasi
                  </Link>
                </span>
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Daftar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Masuk
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}