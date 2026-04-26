"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { deriveMasterKeys } from "@/lib/crypto/argon2";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { PasswordStrength } from "@/components/ui/password-strength";
import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";

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
      const keys = await deriveMasterKeys(email, password);

      await registerMutation.mutateAsync({
        email,
        authKeyHash: keys.authKeyHash,
        saltAuth: keys.saltAuth,
        saltEnc: keys.saltEnc,
      });

      setEncryptionKey(keys.encryptionKey);

      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        authKeyHash: keys.authKeyHash,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      toast.success("Vault created successfully!", { id: loadingToastId });
      router.push("/vault");
    } catch (error: any) {
      toast.error(error.message || "Registration failed", { id: loadingToastId });
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
              <h1 className="text-2xl font-bold text-white tracking-tight">Create Vault</h1>
              <p className="text-sm text-zinc-500">Setup your zero-knowledge vault</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
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
                placeholder="Choose a strong master password"
              />
              <PasswordStrength password={password} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Repeat your master password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-zinc-900 font-semibold rounded-xl px-4 py-2.5 mt-2 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 transition-all"
            >
              {isLoading ? "Encrypting & Creating..." : "Create Vault"}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have a vault?{" "}
            <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              Unlock it
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-4">
          Your master password never leaves your browser.
        </p>
      </motion.div>
    </div>
  );
}
