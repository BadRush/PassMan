import { argon2id } from "hash-wasm";

export interface DerivedKeys {
  authKeyHash: string;
  encryptionKey: string;
  saltAuth: string;
  saltEnc: string;
}

const generateSalt = (): Uint8Array => {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
};

const toHex = (buffer: Uint8Array): string => {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const fromHex = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

export const deriveMasterKeys = async (
  email: string,
  masterPass: string,
  existingSaltAuth?: string,
  existingSaltEnc?: string
): Promise<DerivedKeys> => {
  const saltAuthBytes = existingSaltAuth ? fromHex(existingSaltAuth) : generateSalt();
  const saltEncBytes = existingSaltEnc ? fromHex(existingSaltEnc) : generateSalt();

  const password = masterPass + email;

  // Derive Auth Key (sent to server for verification)
  const authKeyHash = await argon2id({
    password,
    salt: saltAuthBytes,
    parallelism: 1,
    iterations: 2,
    memorySize: 19456, // 19MB
    hashLength: 32,
    outputType: "hex",
  });

  // Derive Encryption Key (kept in memory only, never sent to server)
  const encryptionKey = await argon2id({
    password,
    salt: saltEncBytes,
    parallelism: 1,
    iterations: 2,
    memorySize: 19456, // 19MB
    hashLength: 32,
    outputType: "hex",
  });

  return {
    authKeyHash,
    encryptionKey,
    saltAuth: toHex(saltAuthBytes),
    saltEnc: toHex(saltEncBytes),
  };
};
