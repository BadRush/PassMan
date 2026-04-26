"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { deriveMasterKeys } from "@/lib/crypto/argon2";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const setEncryptionKey = useAuthStore((state) => state.setEncryptionKey);
  const { refetch: fetchSalts } = trpc.auth.getSalts.useQuery({ email }, { enabled: false });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToastId = toast.loading("Unlocking vault...");

    try {
      // 1. Fetch user salts (Auth and Enc salts)
      const saltsResult = await fetchSalts();
      if (!saltsResult.data || !saltsResult.data.exists) {
        throw new Error("Invalid email or master password");
      }

      // 2. Derive keys client-side (Zero-Knowledge)
      const keys = await deriveMasterKeys(
        email, 
        password, 
        saltsResult.data.saltAuth, 
        saltsResult.data.saltEnc
      );

      // 3. Login using NextAuth and AuthKeyHash
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        authKeyHash: keys.authKeyHash,
      });

      if (signInResult?.error) {
        throw new Error("Invalid email or master password");
      }

      // 4. Store EncryptionKey in memory
      setEncryptionKey(keys.encryptionKey);

      toast.success("Vault unlocked successfully!", { id: loadingToastId });
      router.push("/vault"); // Redirection dummy route for now
    } catch (error: any) {
      toast.error(error.message || "Failed to unlock vault", { id: loadingToastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Unlock Vault</h1>
        <p className="text-zinc-400 mb-8">Enter your master password to access your credentials.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Master Password</label>
            <input
              type="password"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-zinc-900 font-semibold rounded-lg px-4 py-2 mt-4 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 transition-all"
          >
            {isLoading ? "Decrypting..." : "Unlock Vault"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          Don't have a vault? <a href="/register" className="text-blue-400 hover:text-blue-300">Create one</a>
        </div>
      </div>
    </div>
  );
}
