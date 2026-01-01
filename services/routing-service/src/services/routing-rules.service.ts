import { prisma, ReportCategory } from '@lapor-pakdhe/prisma-client';
import { logger } from '../utils';
import { config } from '../config';

export interface RoutingResult {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  priority: number;
  routingReason: string;
}

// Keyword mappings for auto-routing
const DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  INFRASTRUKTUR: [
    'jalan', 'lubang', 'aspal', 'trotoar', 'jembatan', 'gorong-gorong',
    'drainase', 'saluran', 'banjir', 'genangan', 'rusak', 'berlubang',
    'retak', 'amblas', 'longsor', 'infrastruktur', 'perbaikan jalan',
    'pedestrian', 'zebra cross', 'rambu', 'marka'
  ],
  KEBERSIHAN: [
    'sampah', 'limbah', 'kotor', 'bau', 'tumpukan', 'pembuangan',
    'tpa', 'tempat sampah', 'kebersihan', 'jorok', 'kumuh',
    'pencemaran', 'polusi', 'sanitasi', 'wc umum', 'toilet'
  ],
  KEAMANAN: [
    'kriminal', 'pencurian', 'perampokan', 'kekerasan', 'tawuran',
    'premanisme', 'vandalisme', 'keamanan', 'bahaya', 'ancaman',
    'pencopetan', 'pemerasan', 'intimidasi', 'geng', 'motor'
  ],
  SOSIAL: [
    'kemiskinan', 'gelandangan', 'pengemis', 'anak jalanan', 'lansia',
    'disabilitas', 'bantuan', 'sosial', 'kesejahteraan', 'panti',
    'tunawisma', 'pengangguran', 'ekonomi', 'keluarga'
  ],
  KESEHATAN: [
    'penyakit', 'wabah', 'epidemi', 'rumah sakit', 'puskesmas',
    'kesehatan', 'obat', 'medis', 'dokter', 'ambulans', 'gizi',
    'stunting', 'imunisasi', 'demam berdarah', 'nyamuk', 'fogging'
  ],
  PENDIDIKAN: [
    'sekolah', 'pendidikan', 'guru', 'murid', 'siswa', 'belajar',
    'gedung sekolah', 'fasilitas sekolah', 'beasiswa', 'putus sekolah'
  ],
  PERHUBUNGAN: [
    'lalu lintas', 'macet', 'kemacetan', 'parkir', 'angkutan',
    'transportasi', 'bus', 'terminal', 'halte', 'traffic light',
    'lampu merah', 'simpang', 'persimpangan', 'kecelakaan'
  ],
  PERIZINAN: [
    'izin', 'perizinan', 'imb', 'siup', 'sertifikat', 'dokumen',
    'administrasi', 'birokrasi', 'pelayanan publik'
  ],
  LINGKUNGAN: [
    'pohon', 'taman', 'ruang hijau', 'penghijauan', 'udara',
    'polusi udara', 'asap', 'kebakaran hutan', 'illegal logging',
    'satwa', 'konservasi', 'alam', 'lingkungan hidup'
  ],
};

// Priority keywords (higher priority = more urgent)
const PRIORITY_KEYWORDS: Record<number, string[]> = {
  1: ['darurat', 'emergency', 'kritis', 'bahaya', 'segera', 'nyawa', 'kecelakaan fatal', 'korban jiwa'],
  2: ['urgent', 'mendesak', 'parah', 'serius', 'berbahaya', 'kecelakaan', 'ambruk'],
  3: ['penting', 'perlu ditangani', 'perhatian'],
  4: ['sedang', 'biasa'],
  5: ['ringan', 'minor', 'kecil'],
};

// Category to department mapping
const CATEGORY_DEPARTMENT_MAP: Record<string, string> = {
  INFRASTRUCTURE: 'INFRASTRUKTUR',
  PUBLIC_SERVICE: 'SOSIAL',
  ENVIRONMENT: 'LINGKUNGAN',
  SECURITY: 'KEAMANAN',
  SOCIAL: 'SOSIAL',
  HEALTH: 'KESEHATAN',
  EDUCATION: 'PENDIDIKAN',
  TRANSPORTATION: 'PERHUBUNGAN',
  OTHER: 'INFRASTRUKTUR', // Default fallback
};

class RoutingRulesService {
  // Analyze text and find matching department
  private analyzeText(title: string, description: string = ''): { departmentCode: string; matchCount: number; matchedKeywords: string[] } {
    const text = `${title} ${description}`.toLowerCase();

    let bestMatch = {
      departmentCode: '',
      matchCount: 0,
      matchedKeywords: [] as string[],
    };

    for (const [deptCode, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
      const matchedKeywords = keywords.filter(keyword => text.includes(keyword));
      if (matchedKeywords.length > bestMatch.matchCount) {
        bestMatch = {
          departmentCode: deptCode,
          matchCount: matchedKeywords.length,
          matchedKeywords,
        };
      }
    }

    return bestMatch;
  }

  // Calculate priority based on keywords
  private calculatePriority(title: string, description: string = ''): number {
    const text = `${title} ${description}`.toLowerCase();

    for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
      const hasMatch = keywords.some(keyword => text.includes(keyword));
      if (hasMatch) {
        return parseInt(priority);
      }
    }

    return config.routing.defaultPriority;
  }

  // Get department from category
  private getDepartmentFromCategory(category: string): string {
    return CATEGORY_DEPARTMENT_MAP[category] || 'INFRASTRUKTUR';
  }

  // Main routing function
  async routeReport(
    reportId: string,
    title: string,
    description: string,
    category: string
  ): Promise<RoutingResult> {
    logger.info('Starting report routing', { reportId, title, category });

    // Step 1: Analyze text for keyword matches
    const textAnalysis = this.analyzeText(title, description);

    // Step 2: Determine department code
    let departmentCode: string;
    let routingReason: string;

    if (textAnalysis.matchCount >= config.routing.minKeywordMatches) {
      // Use keyword-based routing
      departmentCode = textAnalysis.departmentCode;
      routingReason = `Keyword match: ${textAnalysis.matchedKeywords.slice(0, 3).join(', ')}`;
    } else {
      // Fallback to category-based routing
      departmentCode = this.getDepartmentFromCategory(category);
      routingReason = `Category-based: ${category}`;
    }

    // Step 3: Calculate priority
    const priority = this.calculatePriority(title, description);

    // Step 4: Get department from database
    const department = await prisma.department.findFirst({
      where: { code: departmentCode },
    });

    if (!department) {
      // Fallback to default department if not found
      const defaultDepartment = await prisma.department.findFirst({
        where: { code: 'INFRASTRUKTUR' },
      });

      if (!defaultDepartment) {
        throw new Error('No default department found');
      }

      logger.warn('Department not found, using default', {
        requestedCode: departmentCode,
        usingCode: defaultDepartment.code,
      });

      return {
        departmentId: defaultDepartment.id,
        departmentCode: defaultDepartment.code,
        departmentName: defaultDepartment.name,
        priority,
        routingReason: `Fallback to default department (${routingReason})`,
      };
    }

    logger.info('Report routed successfully', {
      reportId,
      departmentCode: department.code,
      departmentName: department.name,
      priority,
      routingReason,
    });

    return {
      departmentId: department.id,
      departmentCode: department.code,
      departmentName: department.name,
      priority,
      routingReason,
    };
  }

  // Get all routing rules (for admin display)
  getRoutingRules(): { departments: Record<string, string[]>; priorities: Record<number, string[]> } {
    return {
      departments: DEPARTMENT_KEYWORDS,
      priorities: PRIORITY_KEYWORDS,
    };
  }
}

export const routingRulesService = new RoutingRulesService();
export default routingRulesService;
