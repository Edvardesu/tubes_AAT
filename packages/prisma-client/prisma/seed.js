"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting seed...');
    // ==================== ROLES ====================
    console.log('Creating roles...');
    const roles = await Promise.all([
        prisma.role.upsert({
            where: { name: 'CITIZEN' },
            update: {},
            create: {
                name: 'CITIZEN',
                description: 'Warga biasa',
                level: 0,
                permissions: JSON.stringify(['report:create', 'report:read', 'report:update:own']),
            },
        }),
        prisma.role.upsert({
            where: { name: 'STAFF_L1' },
            update: {},
            create: {
                name: 'STAFF_L1',
                description: 'Petugas Lapangan',
                level: 1,
                permissions: JSON.stringify(['report:read', 'report:update', 'report:assign']),
            },
        }),
        prisma.role.upsert({
            where: { name: 'STAFF_L2' },
            update: {},
            create: {
                name: 'STAFF_L2',
                description: 'Kepala Dinas',
                level: 2,
                permissions: JSON.stringify(['report:read', 'report:update', 'report:assign', 'report:escalate', 'staff:manage']),
            },
        }),
        prisma.role.upsert({
            where: { name: 'STAFF_L3' },
            update: {},
            create: {
                name: 'STAFF_L3',
                description: 'Walikota/Sekda',
                level: 3,
                permissions: JSON.stringify(['report:read', 'report:update', 'report:assign', 'report:escalate', 'staff:manage', 'analytics:read']),
            },
        }),
        prisma.role.upsert({
            where: { name: 'ADMIN' },
            update: {},
            create: {
                name: 'ADMIN',
                description: 'System Administrator',
                level: 99,
                permissions: JSON.stringify(['*']),
            },
        }),
    ]);
    const roleMap = roles.reduce((acc, role) => {
        acc[role.name] = role.id;
        return acc;
    }, {});
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
    }, {});
    console.log(`✅ Created ${departments.length} departments`);
    // ==================== ROUTING RULES ====================
    console.log('Creating routing rules...');
    const routingRules = await Promise.all([
        prisma.routingRule.create({
            data: {
                category: client_1.ReportCategory.SECURITY,
                keywords: ['kriminal', 'pencurian', 'perampokan', 'tawuran', 'keamanan', 'preman', 'maling', 'copet', 'begal'],
                departmentId: deptMap['KEAMANAN'],
                priority: 1,
            },
        }),
        prisma.routingRule.create({
            data: {
                category: client_1.ReportCategory.CLEANLINESS,
                keywords: ['sampah', 'kotor', 'bau', 'polusi', 'limbah', 'banjir', 'selokan', 'got', 'saluran'],
                departmentId: deptMap['KEBERSIHAN'],
                priority: 1,
            },
        }),
        prisma.routingRule.create({
            data: {
                category: client_1.ReportCategory.HEALTH,
                keywords: ['sakit', 'wabah', 'demam', 'puskesmas', 'rumah sakit', 'nyamuk', 'dbd', 'malaria', 'covid'],
                departmentId: deptMap['KESEHATAN'],
                priority: 1,
            },
        }),
        prisma.routingRule.create({
            data: {
                category: client_1.ReportCategory.INFRASTRUCTURE,
                keywords: ['jalan', 'rusak', 'lampu', 'jembatan', 'trotoar', 'lubang', 'aspal', 'penerangan', 'listrik'],
                departmentId: deptMap['INFRASTRUKTUR'],
                priority: 1,
            },
        }),
        prisma.routingRule.create({
            data: {
                category: client_1.ReportCategory.SOCIAL,
                keywords: ['miskin', 'gelandangan', 'kdrt', 'anak terlantar', 'tunawisma', 'pengemis', 'kekerasan'],
                departmentId: deptMap['SOSIAL'],
                priority: 1,
            },
        }),
        prisma.routingRule.create({
            data: {
                category: client_1.ReportCategory.PERMITS,
                keywords: ['izin', 'ilegal', 'bangunan liar', 'pelanggaran', 'tanpa izin', 'sertifikat', 'imb'],
                departmentId: deptMap['PERIZINAN'],
                priority: 1,
            },
        }),
    ]);
    console.log(`✅ Created ${routingRules.length} routing rules`);
    // ==================== USERS ====================
    console.log('Creating users...');
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const wargaPasswordHash = await bcrypt.hash('Warga123!', 10);
    const petugasPasswordHash = await bcrypt.hash('Petugas123!', 10);
    const kadisPasswordHash = await bcrypt.hash('Kadis123!', 10);
    const walikotaPasswordHash = await bcrypt.hash('Walikota123!', 10);
    // Admin User
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@lapor.pakdhe' },
        update: {},
        create: {
            email: 'admin@lapor.pakdhe',
            passwordHash: passwordHash,
            fullName: 'System Administrator',
            phone: '081234567890',
            isVerified: true,
            isActive: true,
        },
    });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: roleMap['ADMIN'] } },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: roleMap['ADMIN'],
        },
    });
    // Citizen User
    const citizenUser = await prisma.user.upsert({
        where: { email: 'warga@example.com' },
        update: {},
        create: {
            email: 'warga@example.com',
            passwordHash: wargaPasswordHash,
            fullName: 'Budi Santoso',
            phone: '081234567891',
            nik: '3273012345670001',
            address: 'Jl. Merdeka No. 123, Bandung',
            isVerified: true,
            isActive: true,
        },
    });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: citizenUser.id, roleId: roleMap['CITIZEN'] } },
        update: {},
        create: {
            userId: citizenUser.id,
            roleId: roleMap['CITIZEN'],
        },
    });
    // Staff Level 1 - Petugas Infrastruktur
    const staffL1User = await prisma.user.upsert({
        where: { email: 'petugas@infra.go.id' },
        update: {},
        create: {
            email: 'petugas@infra.go.id',
            passwordHash: petugasPasswordHash,
            fullName: 'Ahmad Petugas',
            phone: '081234567892',
            isVerified: true,
            isActive: true,
        },
    });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: staffL1User.id, roleId: roleMap['STAFF_L1'] } },
        update: {},
        create: {
            userId: staffL1User.id,
            roleId: roleMap['STAFF_L1'],
        },
    });
    // Staff Level 2 - Kepala Dinas Infrastruktur
    const staffL2User = await prisma.user.upsert({
        where: { email: 'kadis@infra.go.id' },
        update: {},
        create: {
            email: 'kadis@infra.go.id',
            passwordHash: kadisPasswordHash,
            fullName: 'Ir. Suharto Kepala',
            phone: '081234567893',
            isVerified: true,
            isActive: true,
        },
    });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: staffL2User.id, roleId: roleMap['STAFF_L2'] } },
        update: {},
        create: {
            userId: staffL2User.id,
            roleId: roleMap['STAFF_L2'],
        },
    });
    // Staff Level 3 - Walikota
    const staffL3User = await prisma.user.upsert({
        where: { email: 'walikota@pemkot.go.id' },
        update: {},
        create: {
            email: 'walikota@pemkot.go.id',
            passwordHash: walikotaPasswordHash,
            fullName: 'H. Ridwan Kamil',
            phone: '081234567894',
            isVerified: true,
            isActive: true,
        },
    });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: staffL3User.id, roleId: roleMap['STAFF_L3'] } },
        update: {},
        create: {
            userId: staffL3User.id,
            roleId: roleMap['STAFF_L3'],
        },
    });
    console.log('✅ Created users with roles');
    // ==================== STAFF MEMBERS ====================
    console.log('Creating staff members...');
    // Kepala Dinas first (so we can assign as superior)
    const kadisStaff = await prisma.staffMember.upsert({
        where: { userId: staffL2User.id },
        update: {},
        create: {
            userId: staffL2User.id,
            departmentId: deptMap['INFRASTRUKTUR'],
            position: 'Kepala Dinas Infrastruktur',
            level: client_1.StaffLevel.LEVEL_2,
        },
    });
    // Petugas Lapangan (subordinate to Kepala Dinas)
    await prisma.staffMember.upsert({
        where: { userId: staffL1User.id },
        update: {},
        create: {
            userId: staffL1User.id,
            departmentId: deptMap['INFRASTRUKTUR'],
            position: 'Petugas Lapangan',
            level: client_1.StaffLevel.LEVEL_1,
            superiorId: kadisStaff.id,
        },
    });
    // Walikota (no specific department)
    await prisma.staffMember.upsert({
        where: { userId: staffL3User.id },
        update: {},
        create: {
            userId: staffL3User.id,
            departmentId: deptMap['INFRASTRUKTUR'], // Assigned to one for demo
            position: 'Walikota',
            level: client_1.StaffLevel.LEVEL_3,
        },
    });
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
    console.log('┌─────────────────────────────┬──────────────┬────────────┐');
    console.log('│ Email                       │ Password     │ Role       │');
    console.log('├─────────────────────────────┼──────────────┼────────────┤');
    console.log('│ admin@lapor.pakdhe          │ Admin123!    │ ADMIN      │');
    console.log('│ warga@example.com           │ Warga123!    │ CITIZEN    │');
    console.log('│ petugas@infra.go.id         │ Petugas123!  │ STAFF_L1   │');
    console.log('│ kadis@infra.go.id           │ Kadis123!    │ STAFF_L2   │');
    console.log('│ walikota@pemkot.go.id       │ Walikota123! │ STAFF_L3   │');
    console.log('└─────────────────────────────┴──────────────┴────────────┘');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map