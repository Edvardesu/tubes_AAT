import { prisma, UserRole, Role } from '@lapor-pakdhe/prisma-client';
import { UpdateProfileInput } from '@lapor-pakdhe/shared';
import { Errors } from '../utils/errors';
import { logger } from '../utils/logger';

type UserRoleWithRole = UserRole & { role: Role };

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  nik?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  isActive: boolean;
  roles: string[];
  staffProfile?: {
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    position: string;
    level: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

class UserService {
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        staffProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw Errors.notFound('User');
    }

    const roles = user.roles.map((ur: UserRoleWithRole) => ur.role.name);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      nik: user.nik,
      address: user.address,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isActive: user.isActive,
      roles,
      staffProfile: user.staffProfile
        ? {
            departmentId: user.staffProfile.departmentId,
            departmentName: user.staffProfile.department.name,
            departmentCode: user.staffProfile.department.code,
            position: user.staffProfile.position,
            level: user.staffProfile.level,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfile> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw Errors.notFound('User');
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        avatarUrl: data.avatarUrl,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        staffProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    logger.info('User profile updated', { userId });

    const roles = user.roles.map((ur: UserRoleWithRole) => ur.role.name);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      nik: user.nik,
      address: user.address,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isActive: user.isActive,
      roles,
      staffProfile: user.staffProfile
        ? {
            departmentId: user.staffProfile.departmentId,
            departmentName: user.staffProfile.department.name,
            departmentCode: user.staffProfile.department.code,
            position: user.staffProfile.position,
            level: user.staffProfile.level,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      return await this.getProfile(userId);
    } catch {
      return null;
    }
  }

  async validateUserExists(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });
    return user !== null && user.isActive;
  }
}

export const userService = new UserService();
export default userService;
