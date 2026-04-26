"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { deriveMasterKeys } from "@/lib/crypto/argon2";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const setEncryptionKey = useAuthStore((state) => state.setEncryptionKey);
  const registerMutation = trpc.auth.register.useMutation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Master password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    const loadingToastId = toast.loading("Generating secure keys... This may take a few seconds.");

    try {
      // 1. Derive keys client-side (Zero-Knowledge)
      const keys = await deriveMasterKeys(email, password);

      // 2. Send only AuthKeyHash and Salts to server
      await registerMutation.mutateAsync({
        email,
        authKeyHash: keys.authKeyHash,
        saltAuth: keys.saltAuth,
        saltEnc: keys.saltEnc,
      });

      // 3. Store EncryptionKey in memory
      setEncryptionKey(keys.encryptionKey);

      // 4. Auto login using NextAuth
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        authKeyHash: keys.authKeyHash,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      toast.success("Registration successful!", { id: loadingToastId });
      router.push("/vault"); // Redirection dummy route for now
    } catch (error: any) {
      toast.error(error.message || "Registration failed", { id: loadingToastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Vault</h1>
        <p className="text-zinc-400 mb-8">Setup your Zero-Knowledge password manager.</p>

        <form onSubmit={handleRegister} className="space-y-4">
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
            <p className="text-xs text-zinc-500 mt-1">Make sure it's long and memorable.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-zinc-900 font-semibold rounded-lg px-4 py-2 mt-4 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 transition-all"
          >
            {isLoading ? "Encrypting & Creating..." : "Create Vault"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          Already have a vault? <a href="/login" className="text-blue-400 hover:text-blue-300">Login here</a>
        </div>
      </div>
    </div>
  );
}
