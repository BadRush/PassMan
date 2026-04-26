import { authenticator } from "otplib";
import QRCode from "qrcode";

/**
 * Generate a new TOTP secret
 * @returns Base32 encoded secret
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate an otpauth:// URL for QR code generation
 * @param email User's email
 * @param secret Base32 encoded secret
 * @returns otpauth:// URL
 */
export function generateTotpUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, "PassMan", secret);
}

/**
 * Generate a QR code data URL from an otpauth:// URL
 * @param url otpauth:// URL
 * @returns Data URL (base64 PNG)
 */
export async function generateQrCode(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url);
  } catch (err) {
    console.error("Failed to generate QR code", err);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Verify a TOTP token against a secret
 * @param token 6-digit code
 * @param secret Base32 encoded secret
 * @returns True if valid, false otherwise
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (err) {
    return false;
  }
}
