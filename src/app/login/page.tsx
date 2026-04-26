"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { deriveMasterKeys } from "@/lib/crypto/argon2";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const encryptionKey = useAuthStore((state) => state.encryptionKey);
  const setEncryptionKey = useAuthStore((state) => state.setEncryptionKey);
  const { refetch: fetchSalts } = trpc.auth.getSalts.useQuery({ email }, { enabled: false });

  useEffect(() => {
    if (encryptionKey) {
      router.push("/vault");
    }
  }, [encryptionKey, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToastId = toast.loading("Unlocking vault...");

    try {
      const saltsResult = await fetchSalts();
      if (!saltsResult.data || !saltsResult.data.exists) {
        throw new Error("Invalid email or master password");
      }

      const keys = await deriveMasterKeys(
        email,
        password,
        saltsResult.data.saltAuth,
        saltsResult.data.saltEnc
      );

      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        authKeyHash: keys.authKeyHash,
      });

      if (signInResult?.error) {
        throw new Error("Invalid email or master password");
      }

      setEncryptionKey(keys.encryptionKey);

      toast.success("Vault unlocked!", { id: loadingToastId });
      router.push("/vault");
    } catch (error: any) {
      toast.error(error.message || "Failed to unlock vault", { id: loadingToastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <a href="/" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </a>

        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Unlock Vault</h1>
              <p className="text-sm text-zinc-500">Enter your master password</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Master Password</label>
              <input
                type="password"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Your master password"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-zinc-900 font-semibold rounded-xl px-4 py-2.5 mt-2 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 transition-all"
            >
              {isLoading ? "Decrypting..." : "Unlock Vault"}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Don't have a vault?{" "}
            <a href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
              Create one
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-4">
          Your password is hashed locally before any network request.
        </p>
      </motion.div>
    </div>
  );
}
