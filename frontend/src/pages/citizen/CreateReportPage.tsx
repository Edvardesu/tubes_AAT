import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, MapPin, AlertCircle } from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { reportService } from '@/services/report.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const createReportSchema = z.object({
  title: z.string().min(10, 'Judul minimal 10 karakter').max(200, 'Judul maksimal 200 karakter'),
  description: z.string().min(50, 'Deskripsi minimal 50 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
  category: z.enum(['INFRASTRUCTURE', 'PUBLIC_SERVICE', 'ENVIRONMENT', 'SECURITY', 'SOCIAL', 'HEALTH', 'EDUCATION', 'TRANSPORTATION', 'OTHER'] as const),
  type: z.enum(['PUBLIC', 'PRIVATE', 'ANONYMOUS'] as const),
  locationAddress: z.string().optional(),
});

type CreateReportFormData = z.infer<typeof createReportSchema>;

const CATEGORY_OPTIONS = [
  { value: 'INFRASTRUCTURE', label: 'Infrastruktur (Jalan, Jembatan, dll)' },
  { value: 'PUBLIC_SERVICE', label: 'Pelayanan Publik' },
  { value: 'ENVIRONMENT', label: 'Lingkungan & Kebersihan' },
  { value: 'SECURITY', label: 'Keamanan & Ketertiban' },
  { value: 'SOCIAL', label: 'Sosial & Kemasyarakatan' },
  { value: 'HEALTH', label: 'Kesehatan' },
  { value: 'EDUCATION', label: 'Pendidikan' },
  { value: 'TRANSPORTATION', label: 'Transportasi' },
  { value: 'OTHER', label: 'Lainnya' },
];

const TYPE_OPTIONS = [
  { value: 'PUBLIC', label: 'Publik - Dapat dilihat semua orang' },
  { value: 'PRIVATE', label: 'Privat - Hanya Anda dan petugas' },
  { value: 'ANONYMOUS', label: 'Anonim - Identitas disembunyikan' },
];

export function CreateReportPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateReportFormData>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      type: 'PUBLIC',
    },
  });

  const reportType = watch('type');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFileError(null);

    // Validate files
    for (const file of selectedFiles) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setFileError('Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError('Ukuran file maksimal 5MB');
        return;
      }
    }

    if (files.length + selectedFiles.length > 5) {
      setFileError('Maksimal 5 file');
      return;
    }

    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setSubmitError('Geolocation tidak didukung oleh browser Anda');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      () => {
        setSubmitError('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.');
        setIsGettingLocation(false);
      }
    );
  };

  const onSubmit = async (data: CreateReportFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await reportService.createReport({
        ...data,
        locationLat: location?.lat,
        locationLng: location?.lng,
        media: files.length > 0 ? files : undefined,
      });

      if (response.success && response.data) {
        navigate(`/reports/${response.data.id}`, {
          state: { justCreated: true, referenceNumber: response.data.referenceNumber },
        });
      } else {
        setSubmitError(response.error?.message || 'Gagal membuat laporan');
      }
    } catch {
      setSubmitError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buat Laporan</h1>
        <p className="text-gray-600">
          Isi formulir di bawah untuk membuat laporan baru
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            <Input
              {...register('title')}
              label="Judul Laporan"
              placeholder="Contoh: Jalan berlubang di Jl. Merdeka"
              error={errors.title?.message}
              required
            />

            <Textarea
              {...register('description')}
              label="Deskripsi"
              placeholder="Jelaskan permasalahan secara detail..."
              error={errors.description?.message}
              required
              rows={5}
            />

            <Select
              {...register('category')}
              label="Kategori"
              options={CATEGORY_OPTIONS}
              placeholder="Pilih kategori"
              error={errors.category?.message}
              required
            />

            <Select
              {...register('type')}
              label="Jenis Laporan"
              options={TYPE_OPTIONS}
              error={errors.type?.message}
              required
            />

            {reportType === 'ANONYMOUS' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Catatan:</strong> Dengan memilih laporan anonim, identitas Anda akan
                  disembunyikan. Namun, Anda tetap dapat melacak laporan dengan nomor referensi.
                </p>
              </div>
            )}

            <div>
              <Input
                {...register('locationAddress')}
                label="Alamat Lokasi"
                placeholder="Masukkan alamat lokasi kejadian"
                error={errors.locationAddress?.message}
              />
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getLocation}
                  isLoading={isGettingLocation}
                  leftIcon={<MapPin className="w-4 h-4" />}
                >
                  Gunakan Lokasi Saya
                </Button>
                {location && (
                  <span className="text-sm text-green-600 flex items-center">
                    Lokasi berhasil diambil
                  </span>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto Pendukung (opsional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Klik untuk upload atau drag & drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WebP maksimal 5MB (maks. 5 file)
                  </p>
                </label>
              </div>
              {fileError && (
                <p className="mt-2 text-sm text-red-600">{fileError}</p>
              )}
              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                Kirim Laporan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
