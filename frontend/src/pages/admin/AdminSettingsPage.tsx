import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Bell, Shield, Clock, AlertTriangle } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { AdminNav } from '@/components/layout';
import { useAuth } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

export function AdminSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || user?.fullName || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [escalationSettings, setEscalationSettings] = useState({
    autoEscalationDays: 7,
    reminderDays: 3,
    maxEscalationLevel: 3,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    dailyDigest: false,
  });

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) =>
      authService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess(true);
      setPasswordError('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (error: Error) => {
      setPasswordError(error.message || 'Gagal mengubah password');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Password baru tidak cocok');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password minimal 8 karakter');
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <>
      <AdminNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pengaturan</h1>
        <p className="text-gray-600">
          Kelola profil dan pengaturan sistem
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Profil Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label="Nama"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                required
              />
              <Input
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                required
              />
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  isLoading={updateProfileMutation.isPending}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Simpan Profil
                </Button>
                {profileSuccess && (
                  <span className="text-sm text-green-600">
                    Profil berhasil diperbarui
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Ubah Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Password Saat Ini"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                required
              />
              <Input
                label="Password Baru"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                required
              />
              <Input
                label="Konfirmasi Password Baru"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                required
              />
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  isLoading={updatePasswordMutation.isPending}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Ubah Password
                </Button>
                {passwordSuccess && (
                  <span className="text-sm text-green-600">
                    Password berhasil diubah
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Escalation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Pengaturan Eskalasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Eskalasi Otomatis (hari)"
                type="number"
                value={escalationSettings.autoEscalationDays}
                onChange={(e) =>
                  setEscalationSettings({
                    ...escalationSettings,
                    autoEscalationDays: parseInt(e.target.value) || 0,
                  })
                }
                min={1}
                max={30}
              />
              <p className="text-sm text-gray-500">
                Laporan akan otomatis dieskalasi jika tidak diproses dalam waktu ini
              </p>
              <Input
                label="Pengingat (hari)"
                type="number"
                value={escalationSettings.reminderDays}
                onChange={(e) =>
                  setEscalationSettings({
                    ...escalationSettings,
                    reminderDays: parseInt(e.target.value) || 0,
                  })
                }
                min={1}
                max={14}
              />
              <p className="text-sm text-gray-500">
                Kirim pengingat sebelum eskalasi otomatis
              </p>
              <Button leftIcon={<Save className="w-4 h-4" />}>
                Simpan Pengaturan Eskalasi
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Pengaturan Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Notifikasi Email</p>
                  <p className="text-sm text-gray-500">
                    Terima notifikasi melalui email
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      pushNotifications: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Push Notification</p>
                  <p className="text-sm text-gray-500">
                    Terima notifikasi real-time di browser
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.dailyDigest}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      dailyDigest: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Ringkasan Harian</p>
                  <p className="text-sm text-gray-500">
                    Terima ringkasan laporan setiap hari
                  </p>
                </div>
              </label>

              <Button leftIcon={<Save className="w-4 h-4" />}>
                Simpan Pengaturan Notifikasi
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Informasi Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Versi Aplikasi</dt>
                <dd className="font-medium text-gray-900">1.0.0</dd>
              </div>
              <div>
                <dt className="text-gray-500">Environment</dt>
                <dd className="font-medium text-gray-900">
                  {import.meta.env.MODE}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">API URL</dt>
                <dd className="font-medium text-gray-900 break-all">
                  {import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">WebSocket URL</dt>
                <dd className="font-medium text-gray-900 break-all">
                  {import.meta.env.VITE_WS_URL || 'http://localhost:8081'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}
