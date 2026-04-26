"use client";

import { useAuthStore } from "@/stores/auth-store";
import { signOut } from "next-auth/react";

export default function VaultPage() {
  const encryptionKey = useAuthStore((state) => state.encryptionKey);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    clearAuth();
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Vault</h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 rounded-lg transition-colors"
          >
            Lock Vault
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Security Status</h2>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-sm text-zinc-400">
              <span className="w-32">Master Key:</span>
              {encryptionKey ? (
                <span className="text-green-400 font-mono flex items-center">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Present in Memory
                </span>
              ) : (
                <span className="text-red-400 font-mono">Missing! (Please login again)</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border-2 border-zinc-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 h-48">
            <p className="font-medium">Vault Items</p>
            <p className="text-xs mt-2">(Coming in Phase 3)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
