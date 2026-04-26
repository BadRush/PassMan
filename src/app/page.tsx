"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Zap, Server, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Zero-Knowledge Encryption",
    desc: "Your master password never leaves your browser. All data is encrypted client-side with AES-256-GCM.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Self-Hosted & Private",
    desc: "Deploy on your own infrastructure. No third-party cloud. Your data, your rules.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Argon2id Key Derivation",
    desc: "Memory-hard hashing algorithm protects your master password against GPU and ASIC attacks.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: <Server className="w-5 h-5" />,
    title: "Modern Tech Stack",
    desc: "Built with Next.js, Prisma, tRPC, and PostgreSQL for type-safe, reliable performance.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

export default function HomePage() {
  const encryptionKey = useAuthStore((state) => state.encryptionKey);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Nav */}
      <nav className="border-b border-zinc-900 backdrop-blur-xl bg-zinc-950/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg tracking-tight">PassMan</span>
          </div>
          <div className="flex items-center gap-3">
            {mounted && encryptionKey ? (
              <Link href="/vault" className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Go to Vault
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 text-sm bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-500/8 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
              <Lock className="w-3.5 h-3.5" />
              Zero-Knowledge Architecture
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Your passwords,{" "}
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
                truly private.
              </span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
              PassMan is a self-hosted password manager where your data is encrypted before it ever
              reaches the server. Not even the server can read your passwords.
            </p>

            <div className="flex items-center justify-center gap-4">
              {mounted && encryptionKey ? (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/vault"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-zinc-900 font-semibold rounded-xl hover:bg-zinc-100 transition-colors shadow-lg shadow-white/5"
                  >
                    Open Your Vault
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-xl hover:bg-zinc-100 transition-colors shadow-lg shadow-white/5"
                    >
                      Create Your Vault
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all"
                  >
                    Unlock Vault
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold tracking-tight mb-3">Built for Security</h2>
            <p className="text-zinc-500">Every design decision prioritizes your privacy.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700/50 transition-colors"
              >
                <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center ${f.color} mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-zinc-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight mb-12">How It Works</h2>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8">
            {[
              { step: "01", title: "Create Vault", desc: "Choose a strong master password. Argon2id derives two keys locally." },
              { step: "02", title: "Add Credentials", desc: "Your data is encrypted with AES-256-GCM before leaving the browser." },
              { step: "03", title: "Access Anywhere", desc: "Login from any device. Decryption happens only in your browser." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="flex-1"
              >
                <div className="text-4xl font-black text-zinc-800 mb-3">{s.step}</div>
                <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-zinc-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            PassMan
          </div>
          <p>Self-hosted • Zero-Knowledge • Open Source</p>
        </div>
      </footer>
    </div>
  );
}
