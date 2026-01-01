import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export interface EncryptedData {
  encryptedUserId: string;
  encryptionKeyId: string;
  trackingToken: string;
}

class EncryptionService {
  private key: string;

  constructor() {
    this.key = config.encryption.key;
  }

  // Encrypt user ID for anonymous reports
  encryptUserId(userId: string): EncryptedData {
    const keyId = uuidv4();
    const trackingToken = this.generateTrackingToken();

    // Create a unique key by combining the main key with keyId
    const derivedKey = CryptoJS.SHA256(this.key + keyId).toString();

    // Encrypt the user ID
    const encrypted = CryptoJS.AES.encrypt(userId, derivedKey).toString();

    return {
      encryptedUserId: encrypted,
      encryptionKeyId: keyId,
      trackingToken,
    };
  }

  // Decrypt user ID (only for authorized operations)
  decryptUserId(encryptedUserId: string, encryptionKeyId: string): string {
    const derivedKey = CryptoJS.SHA256(this.key + encryptionKeyId).toString();
    const bytes = CryptoJS.AES.decrypt(encryptedUserId, derivedKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Generate a unique tracking token for anonymous reports
  generateTrackingToken(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}${random}`.toUpperCase();
  }

  // Verify tracking token format
  isValidTrackingToken(token: string): boolean {
    // Token should be alphanumeric and reasonable length
    return /^[A-Z0-9]{10,20}$/.test(token);
  }
}

export const encryptionService = new EncryptionService();
export default encryptionService;
