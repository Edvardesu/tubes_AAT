import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCog,
  Building2,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui';
import { AdminNav } from '@/components/layout';
import { staffService, type StaffMember, type CreateStaffData, type UpdateStaffData } from '@/services/staff.service';

const LEVEL_OPTIONS = [
  { value: '', label: 'Semua Level' },
  { value: 'LEVEL_1', label: 'Level 1 - Petugas' },
  { value: 'LEVEL_2', label: 'Level 2 - Supervisor' },
  { value: 'LEVEL_3', label: 'Level 3 - Kepala Dinas' },
];

const LEVEL_LABELS: Record<string, string> = {
  LEVEL_1: 'Petugas',
  LEVEL_2: 'Supervisor',
  LEVEL_3: 'Kepala Dinas',
};

const LEVEL_COLORS: Record<string, string> = {
  LEVEL_1: 'bg-blue-100 text-blue-800',
  LEVEL_2: 'bg-purple-100 text-purple-800',
  LEVEL_3: 'bg-red-100 text-red-800',
};

export function AdminStaffPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    departmentId: '',
    level: '',
    search: '',
    page: 1,
  });
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Queries
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff', filters],
    queryFn: () => staffService.getStaff(filters),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffService.getDepartments(),
  });

  const staff = staffData?.data?.staff || [];
  const meta = staffData?.data?.meta;
  const departments = departmentsData?.data?.departments || [];

  const departmentOptions = [
    { value: '', label: 'Semua Departemen' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateStaffData) => staffService.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffData }) =>
      staffService.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsModalOpen(false);
      setEditingStaff(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffService.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput, page: 1 });
  };

  const handleEdit = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus staff ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  return (
    <>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Staff</h1>
          <p className="text-gray-600">Kelola petugas dan struktur organisasi</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Tambah Staff
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari nama atau email..."
                  className="pl-10"
                />
              </div>
            </form>

            {/* Department Filter */}
            <Select
              value={filters.departmentId}
              onChange={(e) =>
                setFilters({ ...filters, departmentId: e.target.value, page: 1 })
              }
              options={departmentOptions}
              className="w-56"
            />

            {/* Level Filter */}
            <Select
              value={filters.level}
              onChange={(e) =>
                setFilters({ ...filters, level: e.target.value, page: 1 })
              }
              options={LEVEL_OPTIONS}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Daftar Staff
            {meta && (
              <span className="font-normal text-gray-500 ml-2">
                ({meta.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center">
              <UserCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada staff ditemukan</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Staff
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Departemen
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Jabatan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Level
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staff.map((member) => (
                      <>
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                                {(member.user?.name || member.user?.fullName || 'S')
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member.user?.name || member.user?.fullName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.user?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">
                                {member.department?.name || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-900">
                            {member.position || '-'}
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={LEVEL_COLORS[member.level]} size="sm">
                              {LEVEL_LABELS[member.level]}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              className={
                                member.user?.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                              size="sm"
                            >
                              {member.user?.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedRow(
                                    expandedRow === member.id ? null : member.id
                                  )
                                }
                              >
                                {expandedRow === member.id ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(member)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(member.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {expandedRow === member.id && (
                          <tr key={`${member.id}-expanded`}>
                            <td colSpan={6} className="px-4 py-4 bg-gray-50">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">ID Staff</p>
                                  <p className="font-medium">{member.id}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Telepon</p>
                                  <p className="font-medium">
                                    {member.user?.phone || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Atasan</p>
                                  <p className="font-medium">
                                    {member.superior?.user?.fullName || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Bergabung</p>
                                  <p className="font-medium">
                                    {new Date(member.createdAt).toLocaleDateString(
                                      'id-ID'
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="p-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Menampilkan {(filters.page - 1) * 20 + 1} -{' '}
                    {Math.min(filters.page * 20, meta.total)} dari {meta.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters({ ...filters, page: filters.page - 1 })
                      }
                      disabled={filters.page === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters({ ...filters, page: filters.page + 1 })
                      }
                      disabled={filters.page === meta.totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Form */}
      {isModalOpen && (
        <StaffFormModal
          staff={editingStaff}
          departments={departments}
          onClose={handleCloseModal}
          onSubmit={(data) => {
            if (editingStaff) {
              updateMutation.mutate({ id: editingStaff.id, data });
            } else {
              createMutation.mutate(data as CreateStaffData);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
      </div>
    </>
  );
}

// Staff Form Modal Component
interface StaffFormModalProps {
  staff: StaffMember | null;
  departments: { id: string; name: string; code: string }[];
  onClose: () => void;
  onSubmit: (data: CreateStaffData | UpdateStaffData) => void;
  isLoading: boolean;
}

function StaffFormModal({
  staff,
  departments,
  onClose,
  onSubmit,
  isLoading,
}: StaffFormModalProps) {
  const [formData, setFormData] = useState({
    email: staff?.user?.email || '',
    password: '',
    fullName: staff?.user?.name || staff?.user?.fullName || '',
    phone: staff?.user?.phone || '',
    departmentId: staff?.departmentId || '',
    position: staff?.position || '',
    level: staff?.level || 'LEVEL_1',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!staff;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!isEditing && !formData.email) {
      newErrors.email = 'Email wajib diisi';
    }
    if (!isEditing && !formData.password) {
      newErrors.password = 'Password wajib diisi';
    }
    if (!formData.fullName) {
      newErrors.fullName = 'Nama wajib diisi';
    }
    if (!formData.departmentId) {
      newErrors.departmentId = 'Departemen wajib dipilih';
    }
    if (!formData.position) {
      newErrors.position = 'Jabatan wajib diisi';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEditing) {
      onSubmit({
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        departmentId: formData.departmentId,
        position: formData.position,
        level: formData.level as 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3',
      });
    } else {
      onSubmit({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        departmentId: formData.departmentId,
        position: formData.position,
        level: formData.level as 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3',
      });
    }
  };

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const levelOptions = [
    { value: 'LEVEL_1', label: 'Level 1 - Petugas' },
    { value: 'LEVEL_2', label: 'Level 2 - Supervisor' },
    { value: 'LEVEL_3', label: 'Level 3 - Kepala Dinas' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Staff' : 'Tambah Staff Baru'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!isEditing && (
            <>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={errors.email}
                required
              />
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                error={errors.password}
                required
              />
            </>
          )}

          <Input
            label="Nama Lengkap"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            error={errors.fullName}
            required
          />

          <Input
            label="No. Telepon"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          <Select
            label="Departemen"
            value={formData.departmentId}
            onChange={(e) =>
              setFormData({ ...formData, departmentId: e.target.value })
            }
            options={[{ value: '', label: 'Pilih Departemen' }, ...departmentOptions]}
            error={errors.departmentId}
            required
          />

          <Input
            label="Jabatan"
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
            placeholder="Contoh: Petugas Lapangan, Kepala Seksi"
            error={errors.position}
            required
          />

          <Select
            label="Level"
            value={formData.level}
            onChange={(e) =>
              setFormData({ ...formData, level: e.target.value as 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' })
            }
            options={levelOptions}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              {isEditing ? 'Simpan Perubahan' : 'Tambah Staff'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
