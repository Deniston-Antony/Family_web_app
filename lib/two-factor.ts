import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";

const APP_NAME = "FamilyChat";
const ENCRYPTION_SALT = "familychat-2fa-v1";

function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for two-factor authentication");
  }
  return scryptSync(secret, ENCRYPTION_SALT, 32);
}

export function encryptTwoFactorSecret(plainSecret: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainSecret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptTwoFactorSecret(encryptedSecret: string): string {
  const key = getEncryptionKey();
  const buffer = Buffer.from(encryptedSecret, "base64");
  const iv = buffer.subarray(0, 16);
  const tag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function generateTwoFactorSecret(): string {
  return generateSecret();
}

export function getOtpAuthUrl(email: string, secret: string): string {
  return generateURI({
    issuer: APP_NAME,
    label: email,
    secret,
  });
}

export async function generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl);
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }

  const result = verifySync({
    secret,
    token: normalized,
    epochTolerance: 30,
  });

  return result.valid;
}

export function verifyStoredTotpCode(encryptedSecret: string, code: string): boolean {
  const secret = decryptTwoFactorSecret(encryptedSecret);
  return verifyTotpCode(secret, code);
}
