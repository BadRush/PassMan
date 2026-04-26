import { create } from "zustand";

interface AuthState {
  encryptionKey: string | null;
  setEncryptionKey: (key: string) => void;
  clearAuth: () => void;
}

// Memory-only store. Does not use persist middleware to keep encryption key secure.
export const useAuthStore = create<AuthState>((set) => ({
  encryptionKey: null,
  setEncryptionKey: (key) => set({ encryptionKey: key }),
  clearAuth: () => set({ encryptionKey: null }),
}));
