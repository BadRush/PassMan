/**
 * TOTP (RFC 6238) implementation using node:crypto only.
 * No external dependencies required.
 */
import crypto from "node:crypto";
import QRCode from "qrcode";

// ─── Constants ───────────────────────────────────────────────────────
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const SECRET_LENGTH = 20; // bytes (160-bit, standard for TOTP)

// ─── Server-side encryption key for storing secrets ──────────────────
const ALGORITHM = "aes-256-cbc";
const SERVER_KEY = crypto.scryptSync(
  process.env.AUTH_SECRET || "default_secret_key",
  "passman-totp-salt",
  32
);

// ─── Base32 Encoding/Decoding (RFC 4648) ─────────────────────────────
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = "";
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }
  // Pad to multiple of 5
  while (bits.length % 5 !== 0) {
    bits += "0";
  }
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const index = parseInt(bits.substring(i, i + 5), 2);
    result += BASE32_CHARS[index];
  }
  return result;
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const char of cleaned) {
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) throw new Error(`Invalid base32 character: ${char}`);
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// ─── TOTP Core ───────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure random TOTP secret (base32 encoded).
 */
export function generateTotpSecret(): string {
  const buffer = crypto.randomBytes(SECRET_LENGTH);
  return base32Encode(buffer);
}

/**
 * Generate a TOTP code for a given secret and time.
 */
function generateCode(secret: string, counter: bigint): string {
  const key = base32Decode(secret);

  // Convert counter to 8-byte big-endian buffer
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(counter);

  // HMAC-SHA1
  const hmac = crypto.createHmac("sha1", key);
  hmac.update(counterBuf);
  const hash = hmac.digest();

  // Dynamic truncation (RFC 4226 §5.4)
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = code % 10 ** TOTP_DIGITS;
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

/**
 * Generate the current TOTP code for a secret.
 */
export function generateCurrentCode(secret: string): string {
  const counter = BigInt(Math.floor(Date.now() / 1000 / TOTP_PERIOD));
  return generateCode(secret, counter);
}

/**
 * Verify a TOTP token against a secret.
 * Allows ±1 time step window to account for clock drift.
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  if (!token || token.length !== TOTP_DIGITS) return false;

  const currentCounter = BigInt(Math.floor(Date.now() / 1000 / TOTP_PERIOD));

  // Check current and ±1 window
  for (let i = -1; i <= 1; i++) {
    const counter = currentCounter + BigInt(i);
    const expected = generateCode(secret, counter);
    if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

// ─── otpauth:// URI & QR Code ────────────────────────────────────────

/**
 * Generate an otpauth:// URL for authenticator apps.
 */
export function generateTotpUrl(email: string, secret: string): string {
  const issuer = encodeURIComponent("PassMan");
  const account = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Generate a QR code data URL from an otpauth:// URL.
 */
export async function generateQrCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

// ─── Secret Encryption (server-side storage) ─────────────────────────

/**
 * Encrypt a TOTP secret for database storage.
 */
export function encryptSecret(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SERVER_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a TOTP secret from database.
 */
export function decryptSecret(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, SERVER_KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
