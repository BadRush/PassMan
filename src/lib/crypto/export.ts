import { encrypt, decrypt, type EncryptedPayload } from "./aes";

export interface ExportFormat {
  version: number;
  timestamp: string;
  data: EncryptedPayload;
}

export async function exportVault(items: any[], encryptionKey: CryptoKey): Promise<string> {
  const plainData = JSON.stringify(items);
  const encrypted = await encrypt(plainData, encryptionKey);

  const payload: ExportFormat = {
    version: 1,
    timestamp: new Date().toISOString(),
    data: encrypted,
  };

  return JSON.stringify(payload, null, 2);
}

export async function importVault(fileContent: string, encryptionKey: CryptoKey): Promise<any[]> {
  try {
    const payload = JSON.parse(fileContent) as ExportFormat;
    
    if (!payload.version || !payload.data) {
      throw new Error("Invalid vault file format");
    }

    const plainData = await decrypt(payload.data, encryptionKey);
    return JSON.parse(plainData);
  } catch (error) {
    throw new Error("Failed to decrypt vault. Make sure you are using the correct master password.");
  }
}
