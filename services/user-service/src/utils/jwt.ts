import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { Errors } from './errors';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  tokenId?: string;
}

export interface DecodedToken extends JwtPayload, TokenPayload {}

// Parse duration string to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 86400; // Default 24 hours
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 86400;
  }
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
      type: 'access',
    },
    config.jwt.accessSecret,
    {
      expiresIn: parseDuration(config.jwt.accessExpiry),
      algorithm: 'HS256',
    }
  );
};

export const generateRefreshToken = (payload: TokenPayload): { token: string; tokenId: string } => {
  const tokenId = uuidv4();

  const token = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
      tokenId,
      type: 'refresh',
    },
    config.jwt.refreshSecret,
    {
      expiresIn: parseDuration(config.jwt.refreshExpiry),
      algorithm: 'HS256',
    }
  );

  return { token, tokenId };
};

export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as DecodedToken;
    if (decoded.type !== 'access') {
      throw Errors.tokenInvalid();
    }
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw Errors.tokenExpired();
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw Errors.tokenInvalid();
    }
    throw error;
  }
};

export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as DecodedToken;
    if (decoded.type !== 'refresh') {
      throw Errors.tokenInvalid();
    }
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw Errors.tokenExpired();
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw Errors.tokenInvalid();
    }
    throw error;
  }
};

export const getAccessTokenExpirySeconds = (): number => {
  return parseDuration(config.jwt.accessExpiry);
};

export const getRefreshTokenExpirySeconds = (): number => {
  return parseDuration(config.jwt.refreshExpiry);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessTokenExpirySeconds,
  getRefreshTokenExpirySeconds,
};
