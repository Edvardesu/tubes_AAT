import { PrismaClient, ReportCategory, StaffLevel } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ==================== ROLES ====================
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'CITIZEN' },
      update: { description: 'Warga biasa' },
      create: {
        name: 'CITIZEN',
        description: 'Warga biasa',
        level: 0,
        permissions: JSON.stringify(['report:create', 'report:read', 'report:update:own']),
      },
    }),
    prisma.role.upsert({
      where: { name: 'STAFF_L1' },
      update: { description: 'Pejabat Muda - mengerjakan laporan' },
      create: {
        name: 'STAFF_L1',
        description: 'Pejabat Muda - mengerjakan laporan',
        level: 1,
        permissions: JSON.stringify(['report:read', 'report:update', 'report:assign', 'report:escalate']),
      },
    }),
    prisma.role.upsert({
      where: { name: 'STAFF_L2' },
      update: { description: 'Pejabat Utama - memantau kinerja dan menerima eskalasi' },
      create: {
        name: 'STAFF_L2',
        description: 'Pejabat Utama - memantau kinerja dan menerima eskalasi',
        level: 2,
        permissions: JSON.stringify(['report:read', 'report:update', 'report:assign', 'report:escalate', 'staff:monitor', 'analytics:read']),
      },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: { description: 'Administrator Sistem - mengelola akun pengguna' },
      create: {
        name: 'ADMIN',
        description: 'Administrator Sistem - mengelola akun pengguna',
        level: 99,
        permissions: JSON.stringify(['user:manage', 'role:manage', 'system:config']),
      },
    }),
  ]);

  const roleMap = roles.reduce((acc, role) => {
    acc[role.name] = role.id;
    return acc;
  }, {} as Record<string, string>);

  console.log(`✅ Created ${roles.length} roles`);

  // ==================== DEPARTMENTS ====================
  console.log('Creating departments...');
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'KEAMANAN' },
      update: {},
      create: {
        name: 'Dinas Keamanan & Ketertiban',
        code: 'KEAMANAN',
        description: 'Menangani laporan kriminalitas, gangguan keamanan, tawuran',
        email: 'keamanan@pemkot.go.id',
        phone: '021-1234001',
      },
    }),
    prisma.department.upsert({
      where: { code: 'KEBERSIHAN' },
      update: {},
      create: {
        name: 'Dinas Kebersihan & Lingkungan',
        code: 'KEBERSIHAN',
        description: 'Menangani laporan sampah, polusi, pencemaran',
        email: 'kebersihan@pemkot.go.id',
        phone: '021-1234002',
      },
    }),
    prisma.department.upsert({
      where: { code: 'KESEHATAN' },
      update: {},
      create: {
        name: 'Dinas Kesehatan',
        code: 'KESEHATAN',
        description: 'Menangani laporan wabah, fasilitas kesehatan, sanitasi',
        email: 'kesehatan@pemkot.go.id',
        phone: '021-1234003',
      },
    }),
    prisma.department.upsert({
      where: { code: 'INFRASTRUKTUR' },
      update: {},
      create: {
        name: 'Dinas Infrastruktur',
        code: 'INFRASTRUKTUR',
        description: 'Menangani laporan jalan rusak, lampu mati, fasilitas umum',
        email: 'infrastruktur@pemkot.go.id',
        phone: '021-1234004',
      },
    }),
    prisma.department.upsert({
      where: { code: 'SOSIAL' },
      update: {},
      create: {
        name: 'Dinas Sosial',
        code: 'SOSIAL',
        description: 'Menangani laporan kemiskinan, tunawisma, KDRT',
        email: 'sosial@pemkot.go.id',
        phone: '021-1234005',
      },
    }),
    prisma.department.upsert({
      where: { code: 'PERIZINAN' },
      update: {},
      create: {
        name: 'Dinas Perizinan & Administrasi',
        code: 'PERIZINAN',
        description: 'Menangani laporan pelanggaran izin, bangunan liar',
        email: 'perizinan@pemkot.go.id',
        phone: '021-1234006',
      },
    }),
  ]);

  const deptMap = departments.reduce((acc, dept) => {
    acc[dept.code] = dept.id;
    return acc;
  }, {} as Record<string, string>);

  console.log(`✅ Created ${departments.length} departments`);

  // ==================== ROUTING RULES ====================
  console.log('Creating routing rules...');
  const routingRules = await Promise.all([
    prisma.routingRule.create({
      data: {
        category: ReportCategory.SECURITY,
        keywords: ['kriminal', 'pencurian', 'perampokan', 'tawuran', 'keamanan', 'preman', 'maling', 'copet', 'begal'],
        departmentId: deptMap['KEAMANAN'],
        priority: 1,
      },
    }),
    prisma.routingRule.create({
      data: {
        category: ReportCategory.CLEANLINESS,
        keywords: ['sampah', 'kotor', 'bau', 'polusi', 'limbah', 'banjir', 'selokan', 'got', 'saluran'],
        departmentId: deptMap['KEBERSIHAN'],
        priority: 1,
      },
    }),
    prisma.routingRule.create({
      data: {
        category: ReportCategory.HEALTH,
        keywords: ['sakit', 'wabah', 'demam', 'puskesmas', 'rumah sakit', 'nyamuk', 'dbd', 'malaria', 'covid'],
        departmentId: deptMap['KESEHATAN'],
        priority: 1,
      },
    }),
    prisma.routingRule.create({
      data: {
        category: ReportCategory.INFRASTRUCTURE,
        keywords: ['jalan', 'rusak', 'lampu', 'jembatan', 'trotoar', 'lubang', 'aspal', 'penerangan', 'listrik'],
        departmentId: deptMap['INFRASTRUKTUR'],
        priority: 1,
      },
    }),
    prisma.routingRule.create({
      data: {
        category: ReportCategory.SOCIAL,
        keywords: ['miskin', 'gelandangan', 'kdrt', 'anak terlantar', 'tunawisma', 'pengemis', 'kekerasan'],
        departmentId: deptMap['SOSIAL'],
        priority: 1,
      },
    }),
    prisma.routingRule.create({
      data: {
        category: ReportCategory.PERMITS,
        keywords: ['izin', 'ilegal', 'bangunan liar', 'pelanggaran', 'tanpa izin', 'sertifikat', 'imb'],
        departmentId: deptMap['PERIZINAN'],
        priority: 1,
      },
    }),
  ]);

  console.log(`✅ Created ${routingRules.length} routing rules`);

  // ==================== USERS ====================
  console.log('Creating users...');
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const wargaPassword = await bcrypt.hash('Warga123!', 10);
  const pejabatMudaPassword = await bcrypt.hash('Muda123!', 10);
  const pejabatUtamaPassword = await bcrypt.hash('Utama123!', 10);

  // ===== ADMIN USER =====
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lapor.pakdhe' },
    update: {},
    create: {
      email: 'admin@lapor.pakdhe',
      passwordHash: adminPassword,
      fullName: 'Administrator Sistem',
      phone: '081200000001',
      isVerified: true,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: roleMap['ADMIN'] } },
    update: {},
    create: { userId: adminUser.id, roleId: roleMap['ADMIN'] },
  });

  // ===== CITIZEN USER =====
  const citizenUser = await prisma.user.upsert({
    where: { email: 'warga@example.com' },
    update: {},
    create: {
      email: 'warga@example.com',
      passwordHash: wargaPassword,
      fullName: 'Budi Santoso',
      phone: '081200000002',
      nik: '3273012345670001',
      address: 'Jl. Merdeka No. 123, Bandung',
      isVerified: true,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: citizenUser.id, roleId: roleMap['CITIZEN'] } },
    update: {},
    create: { userId: citizenUser.id, roleId: roleMap['CITIZEN'] },
  });

  // ===== PEJABAT PER BIDANG =====
  // Helper function to create pejabat
  const createPejabat = async (
    email: string,
    fullName: string,
    phone: string,
    roleId: string,
    passwordHash: string
  ) => {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        fullName,
        phone,
        isVerified: true,
        isActive: true,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    });

    return user;
  };

  // ----- BIDANG KEAMANAN -----
  const keamananUtama = await createPejabat(
    'utama.keamanan@pemkot.go.id',
    'Kombes Bambang Sutrisno',
    '081200001001',
    roleMap['STAFF_L2'],
    pejabatUtamaPassword
  );
  const keamananMuda1 = await createPejabat(
    'muda1.keamanan@pemkot.go.id',
    'AKP Rudi Hartono',
    '081200001002',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );
  const keamananMuda2 = await createPejabat(
    'muda2.keamanan@pemkot.go.id',
    'Iptu Sri Wahyuni',
    '081200001003',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );

  // ----- BIDANG KEBERSIHAN -----
  const kebersihanUtama = await createPejabat(
    'utama.kebersihan@pemkot.go.id',
    'Ir. Dewi Lestari, M.Env',
    '081200002001',
    roleMap['STAFF_L2'],
    pejabatUtamaPassword
  );
  const kebersihanMuda1 = await createPejabat(
    'muda1.kebersihan@pemkot.go.id',
    'Agus Prasetyo',
    '081200002002',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );
  const kebersihanMuda2 = await createPejabat(
    'muda2.kebersihan@pemkot.go.id',
    'Fitri Handayani',
    '081200002003',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );

  // ----- BIDANG KESEHATAN -----
  const kesehatanUtama = await createPejabat(
    'utama.kesehatan@pemkot.go.id',
    'dr. Siti Rahayu, Sp.PD',
    '081200003001',
    roleMap['STAFF_L2'],
    pejabatUtamaPassword
  );
  const kesehatanMuda1 = await createPejabat(
    'muda1.kesehatan@pemkot.go.id',
    'dr. Andi Wijaya',
    '081200003002',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );
  const kesehatanMuda2 = await createPejabat(
    'muda2.kesehatan@pemkot.go.id',
    'Ns. Linda Permata, S.Kep',
    '081200003003',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );

  // ----- BIDANG INFRASTRUKTUR -----
  const infrastrukturUtama = await createPejabat(
    'utama.infrastruktur@pemkot.go.id',
    'Ir. Hendra Gunawan, MT',
    '081200004001',
    roleMap['STAFF_L2'],
    pejabatUtamaPassword
  );
  const infrastrukturMuda1 = await createPejabat(
    'muda1.infrastruktur@pemkot.go.id',
    'Dedi Supriadi, ST',
    '081200004002',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );
  const infrastrukturMuda2 = await createPejabat(
    'muda2.infrastruktur@pemkot.go.id',
    'Maya Anggraini, ST',
    '081200004003',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );

  // ----- BIDANG SOSIAL -----
  const sosialUtama = await createPejabat(
    'utama.sosial@pemkot.go.id',
    'Dra. Ratna Kusuma, M.Si',
    '081200005001',
    roleMap['STAFF_L2'],
    pejabatUtamaPassword
  );
  const sosialMuda1 = await createPejabat(
    'muda1.sosial@pemkot.go.id',
    'Yusuf Rahman, S.Sos',
    '081200005002',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );
  const sosialMuda2 = await createPejabat(
    'muda2.sosial@pemkot.go.id',
    'Ani Suryani, S.Sos',
    '081200005003',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );

  // ----- BIDANG PERIZINAN -----
  const perizinanUtama = await createPejabat(
    'utama.perizinan@pemkot.go.id',
    'H. Ahmad Fauzi, SH, MH',
    '081200006001',
    roleMap['STAFF_L2'],
    pejabatUtamaPassword
  );
  const perizinanMuda1 = await createPejabat(
    'muda1.perizinan@pemkot.go.id',
    'Budi Setiawan, SH',
    '081200006002',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );
  const perizinanMuda2 = await createPejabat(
    'muda2.perizinan@pemkot.go.id',
    'Nina Marlina, SH',
    '081200006003',
    roleMap['STAFF_L1'],
    pejabatMudaPassword
  );

  console.log('✅ Created users with roles');

  // ==================== STAFF MEMBERS ====================
  console.log('Creating staff members...');

  // Helper function to create staff member
  const createStaffMember = async (
    userId: string,
    departmentId: string,
    position: string,
    level: StaffLevel,
    superiorId?: string
  ) => {
    return prisma.staffMember.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        departmentId,
        position,
        level,
        superiorId,
      },
    });
  };

  // ----- BIDANG KEAMANAN -----
  const keamananUtamaStaff = await createStaffMember(
    keamananUtama.id, deptMap['KEAMANAN'], 'Pejabat Utama Keamanan', StaffLevel.LEVEL_2
  );
  await createStaffMember(
    keamananMuda1.id, deptMap['KEAMANAN'], 'Pejabat Muda Keamanan', StaffLevel.LEVEL_1, keamananUtamaStaff.id
  );
  await createStaffMember(
    keamananMuda2.id, deptMap['KEAMANAN'], 'Pejabat Muda Keamanan', StaffLevel.LEVEL_1, keamananUtamaStaff.id
  );

  // ----- BIDANG KEBERSIHAN -----
  const kebersihanUtamaStaff = await createStaffMember(
    kebersihanUtama.id, deptMap['KEBERSIHAN'], 'Pejabat Utama Kebersihan', StaffLevel.LEVEL_2
  );
  await createStaffMember(
    kebersihanMuda1.id, deptMap['KEBERSIHAN'], 'Pejabat Muda Kebersihan', StaffLevel.LEVEL_1, kebersihanUtamaStaff.id
  );
  await createStaffMember(
    kebersihanMuda2.id, deptMap['KEBERSIHAN'], 'Pejabat Muda Kebersihan', StaffLevel.LEVEL_1, kebersihanUtamaStaff.id
  );

  // ----- BIDANG KESEHATAN -----
  const kesehatanUtamaStaff = await createStaffMember(
    kesehatanUtama.id, deptMap['KESEHATAN'], 'Pejabat Utama Kesehatan', StaffLevel.LEVEL_2
  );
  await createStaffMember(
    kesehatanMuda1.id, deptMap['KESEHATAN'], 'Pejabat Muda Kesehatan', StaffLevel.LEVEL_1, kesehatanUtamaStaff.id
  );
  await createStaffMember(
    kesehatanMuda2.id, deptMap['KESEHATAN'], 'Pejabat Muda Kesehatan', StaffLevel.LEVEL_1, kesehatanUtamaStaff.id
  );

  // ----- BIDANG INFRASTRUKTUR -----
  const infrastrukturUtamaStaff = await createStaffMember(
    infrastrukturUtama.id, deptMap['INFRASTRUKTUR'], 'Pejabat Utama Infrastruktur', StaffLevel.LEVEL_2
  );
  await createStaffMember(
    infrastrukturMuda1.id, deptMap['INFRASTRUKTUR'], 'Pejabat Muda Infrastruktur', StaffLevel.LEVEL_1, infrastrukturUtamaStaff.id
  );
  await createStaffMember(
    infrastrukturMuda2.id, deptMap['INFRASTRUKTUR'], 'Pejabat Muda Infrastruktur', StaffLevel.LEVEL_1, infrastrukturUtamaStaff.id
  );

  // ----- BIDANG SOSIAL -----
  const sosialUtamaStaff = await createStaffMember(
    sosialUtama.id, deptMap['SOSIAL'], 'Pejabat Utama Sosial', StaffLevel.LEVEL_2
  );
  await createStaffMember(
    sosialMuda1.id, deptMap['SOSIAL'], 'Pejabat Muda Sosial', StaffLevel.LEVEL_1, sosialUtamaStaff.id
  );
  await createStaffMember(
    sosialMuda2.id, deptMap['SOSIAL'], 'Pejabat Muda Sosial', StaffLevel.LEVEL_1, sosialUtamaStaff.id
  );

  // ----- BIDANG PERIZINAN -----
  const perizinanUtamaStaff = await createStaffMember(
    perizinanUtama.id, deptMap['PERIZINAN'], 'Pejabat Utama Perizinan', StaffLevel.LEVEL_2
  );
  await createStaffMember(
    perizinanMuda1.id, deptMap['PERIZINAN'], 'Pejabat Muda Perizinan', StaffLevel.LEVEL_1, perizinanUtamaStaff.id
  );
  await createStaffMember(
    perizinanMuda2.id, deptMap['PERIZINAN'], 'Pejabat Muda Perizinan', StaffLevel.LEVEL_1, perizinanUtamaStaff.id
  );

  console.log('✅ Created staff members');

  // ==================== SYSTEM CONFIG ====================
  console.log('Creating system config...');
  await prisma.systemConfig.upsert({
    where: { key: 'sla_config' },
    update: {},
    create: {
      key: 'sla_config',
      value: {
        level1Hours: 72,
        level2Hours: 168,
        demoLevel1Minutes: 5,
        demoLevel2Minutes: 10,
      },
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'app_config' },
    update: {},
    create: {
      key: 'app_config',
      value: {
        appName: 'Lapor Pakdhe',
        appVersion: '1.0.0',
        maxFileSize: 5242880,
        maxFilesPerReport: 5,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      },
    },
  });

  console.log('✅ Created system config');

  // ==================== REPORT SEQUENCE ====================
  console.log('Creating report sequence...');
  const currentYear = new Date().getFullYear();
  await prisma.reportSequence.upsert({
    where: { year: currentYear },
    update: {},
    create: {
      year: currentYear,
      sequence: 0,
    },
  });

  console.log('✅ Created report sequence');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Test Accounts:');
  console.log('');
  console.log('=== ADMIN & WARGA ===');
  console.log('┌────────────────────────────────────┬──────────────┬─────────────────┐');
  console.log('│ Email                              │ Password     │ Role            │');
  console.log('├────────────────────────────────────┼──────────────┼─────────────────┤');
  console.log('│ admin@lapor.pakdhe                 │ Admin123!    │ Admin Sistem    │');
  console.log('│ warga@example.com                  │ Warga123!    │ Warga           │');
  console.log('└────────────────────────────────────┴──────────────┴─────────────────┘');
  console.log('');
  console.log('=== PEJABAT UTAMA (per Bidang) - Password: Utama123! ===');
  console.log('┌────────────────────────────────────┬─────────────────────────────────┐');
  console.log('│ Email                              │ Bidang                          │');
  console.log('├────────────────────────────────────┼─────────────────────────────────┤');
  console.log('│ utama.keamanan@pemkot.go.id        │ Keamanan & Ketertiban           │');
  console.log('│ utama.kebersihan@pemkot.go.id      │ Kebersihan & Lingkungan         │');
  console.log('│ utama.kesehatan@pemkot.go.id       │ Kesehatan                       │');
  console.log('│ utama.infrastruktur@pemkot.go.id   │ Infrastruktur                   │');
  console.log('│ utama.sosial@pemkot.go.id          │ Sosial                          │');
  console.log('│ utama.perizinan@pemkot.go.id       │ Perizinan & Administrasi        │');
  console.log('└────────────────────────────────────┴─────────────────────────────────┘');
  console.log('');
  console.log('=== PEJABAT MUDA (per Bidang) - Password: Muda123! ===');
  console.log('┌────────────────────────────────────┬─────────────────────────────────┐');
  console.log('│ Email                              │ Bidang                          │');
  console.log('├────────────────────────────────────┼─────────────────────────────────┤');
  console.log('│ muda1.keamanan@pemkot.go.id        │ Keamanan & Ketertiban           │');
  console.log('│ muda2.keamanan@pemkot.go.id        │ Keamanan & Ketertiban           │');
  console.log('│ muda1.kebersihan@pemkot.go.id      │ Kebersihan & Lingkungan         │');
  console.log('│ muda2.kebersihan@pemkot.go.id      │ Kebersihan & Lingkungan         │');
  console.log('│ muda1.kesehatan@pemkot.go.id       │ Kesehatan                       │');
  console.log('│ muda2.kesehatan@pemkot.go.id       │ Kesehatan                       │');
  console.log('│ muda1.infrastruktur@pemkot.go.id   │ Infrastruktur                   │');
  console.log('│ muda2.infrastruktur@pemkot.go.id   │ Infrastruktur                   │');
  console.log('│ muda1.sosial@pemkot.go.id          │ Sosial                          │');
  console.log('│ muda2.sosial@pemkot.go.id          │ Sosial                          │');
  console.log('│ muda1.perizinan@pemkot.go.id       │ Perizinan & Administrasi        │');
  console.log('│ muda2.perizinan@pemkot.go.id       │ Perizinan & Administrasi        │');
  console.log('└────────────────────────────────────┴─────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
