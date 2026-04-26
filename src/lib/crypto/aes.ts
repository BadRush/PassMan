// AES-256-GCM encryption/decryption using Web Crypto API (browser-native, zero dependencies)

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

const bytesToHex = (buffer: Uint8Array): string => {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const bytesToBase64 = (buffer: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // hex
  authTag: string; // hex
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * The encryptionKeyHex is the 64-char hex string from Argon2id derivation.
 */
export const encrypt = async (
  plaintext: string,
  encryptionKeyHex: string
): Promise<EncryptedPayload> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Import the raw key
  const keyBytes = hexToBytes(encryptionKeyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Generate random 12-byte IV (recommended for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt — Web Crypto appends the 16-byte auth tag to the ciphertext
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    cryptoKey,
    data
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);

  // Split: last 16 bytes = authTag, rest = ciphertext
  const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - 16);
  const authTagBytes = encryptedBytes.slice(encryptedBytes.length - 16);

  return {
    ciphertext: bytesToBase64(ciphertextBytes),
    iv: bytesToHex(iv),
    authTag: bytesToHex(authTagBytes),
  };
};

/**
 * Decrypts AES-256-GCM encrypted data back to plaintext.
 */
export const decrypt = async (
  payload: EncryptedPayload,
  encryptionKeyHex: string
): Promise<string> => {
  const keyBytes = hexToBytes(encryptionKeyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const iv = hexToBytes(payload.iv);
  const ciphertextBytes = base64ToBytes(payload.ciphertext);
  const authTagBytes = hexToBytes(payload.authTag);

  // Recombine ciphertext + authTag (Web Crypto expects them together)
  const combined = new Uint8Array(ciphertextBytes.length + authTagBytes.length);
  combined.set(ciphertextBytes, 0);
  combined.set(authTagBytes, ciphertextBytes.length);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    cryptoKey,
    combined
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
};
