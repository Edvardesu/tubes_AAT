import bcrypt from 'bcryptjs';
import { prisma, UserRole, Role } from '@lapor-pakdhe/prisma-client';
import { RegisterInput, LoginInput } from '@lapor-pakdhe/shared';
import { config } from '../config';
import { Errors } from '../utils/errors';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpirySeconds,
  getRefreshTokenExpirySeconds,
  TokenPayload
} from '../utils/jwt';
import { redisClient } from '../utils/redis';
import { logger } from '../utils/logger';

type UserRoleWithRole = UserRole & { role: Role };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    isVerified: boolean;
    roles: string[];
  };
  tokens: AuthTokens;
}

class AuthService {
  async register(data: RegisterInput): Promise<AuthResult> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw Errors.alreadyExists('User with this email');
    }

    // Check if NIK already exists (if provided)
    if (data.nik) {
      const existingNik = await prisma.user.findUnique({
        where: { nik: data.nik },
      });
      if (existingNik) {
        throw Errors.alreadyExists('User with this NIK');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);

    // Get CITIZEN role
    const citizenRole = await prisma.role.findUnique({
      where: { name: 'CITIZEN' },
    });

    if (!citizenRole) {
      throw Errors.internalError('Default role not found');
    }

    // Create user with role
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        nik: data.nik,
        address: data.address,
        isVerified: false,
        isActive: true,
        roles: {
          create: {
            roleId: citizenRole.id,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const roles = user.roles.map((ur: UserRoleWithRole) => ur.role.name);

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roles,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const { token: refreshToken, tokenId } = generateRefreshToken(tokenPayload);

    // Store refresh token in Redis
    await redisClient.storeRefreshToken(user.id, tokenId, getRefreshTokenExpirySeconds());

    // Store refresh token in database as well
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + getRefreshTokenExpirySeconds() * 1000),
      },
    });

    logger.info('User registered', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        isVerified: user.isVerified,
        roles,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: getAccessTokenExpirySeconds(),
      },
    };
  }

  async login(data: LoginInput): Promise<AuthResult> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw Errors.invalidCredentials();
    }

    // Check if user is active
    if (!user.isActive) {
      throw Errors.forbidden('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw Errors.invalidCredentials();
    }

    const roles = user.roles.map((ur: UserRoleWithRole) => ur.role.name);

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roles,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const { token: refreshToken, tokenId } = generateRefreshToken(tokenPayload);

    // Store refresh token in Redis
    await redisClient.storeRefreshToken(user.id, tokenId, getRefreshTokenExpirySeconds());

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + getRefreshTokenExpirySeconds() * 1000),
      },
    });

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        isVerified: user.isVerified,
        roles,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: getAccessTokenExpirySeconds(),
      },
    };
  }

  async refreshToken(refreshTokenStr: string): Promise<AuthTokens> {
    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshTokenStr);

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.isTokenBlacklisted(refreshTokenStr);
    if (isBlacklisted) {
      throw Errors.tokenInvalid();
    }

    // Check if refresh token exists in Redis
    if (decoded.tokenId) {
      const isValid = await redisClient.isRefreshTokenValid(decoded.userId, decoded.tokenId);
      if (!isValid) {
        throw Errors.tokenInvalid();
      }
    }

    // Verify token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw Errors.tokenExpired();
    }

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw Errors.unauthorized('User not found or inactive');
    }

    const roles = user.roles.map((ur: UserRoleWithRole) => ur.role.name);

    // Invalidate old refresh token
    if (decoded.tokenId) {
      await redisClient.invalidateRefreshToken(decoded.userId, decoded.tokenId);
    }
    await redisClient.blacklistToken(refreshTokenStr, getRefreshTokenExpirySeconds());
    await prisma.refreshToken.delete({ where: { token: refreshTokenStr } });

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roles,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const { token: newRefreshToken, tokenId } = generateRefreshToken(tokenPayload);

    // Store new refresh token
    await redisClient.storeRefreshToken(user.id, tokenId, getRefreshTokenExpirySeconds());
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + getRefreshTokenExpirySeconds() * 1000),
      },
    });

    logger.info('Token refreshed', { userId: user.id });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: getAccessTokenExpirySeconds(),
    };
  }

  async logout(userId: string, refreshTokenStr?: string): Promise<void> {
    // Blacklist the refresh token if provided
    if (refreshTokenStr) {
      try {
        const decoded = verifyRefreshToken(refreshTokenStr);
        if (decoded.tokenId) {
          await redisClient.invalidateRefreshToken(userId, decoded.tokenId);
        }
        await redisClient.blacklistToken(refreshTokenStr, getRefreshTokenExpirySeconds());
        await prisma.refreshToken.delete({ where: { token: refreshTokenStr } }).catch(() => {});
      } catch {
        // Token might be invalid, but we still want to logout
      }
    }

    // Delete user session
    await redisClient.deleteSession(userId);

    logger.info('User logged out', { userId });
  }

  async logoutAll(userId: string): Promise<void> {
    // Invalidate all refresh tokens for user
    await redisClient.invalidateAllUserTokens(userId);

    // Delete all refresh tokens from database
    await prisma.refreshToken.deleteMany({ where: { userId } });

    // Delete user session
    await redisClient.deleteSession(userId);

    logger.info('User logged out from all devices', { userId });
  }
}

export const authService = new AuthService();
export default authService;
