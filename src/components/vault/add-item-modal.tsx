"use client";

import { useState } from "react";
import { X, RefreshCw, Eye, EyeOff, Copy, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useAuthStore } from "@/stores/auth-store";
import { encrypt } from "@/lib/crypto/aes";
import { generatePassword, DEFAULT_OPTIONS, type PasswordOptions } from "@/lib/crypto/password-generator";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddItemModal({ isOpen, onClose, onSuccess }: Props) {
  const encryptionKey = useAuthStore((s) => s.encryptionKey);
  const createMutation = trpc.vault.create.useMutation();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<"login" | "note" | "card" | "identity">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [genOptions, setGenOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS);

  const handleGenerate = () => {
    const pw = generatePassword(genOptions);
    setPassword(pw);
    setShowPassword(true);
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encryptionKey) {
      toast.error("Encryption key not found. Please login again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const plainData = JSON.stringify({ name, url, username, password, notes });
      const encrypted = await encrypt(plainData, encryptionKey);

      await createMutation.mutateAsync({
        encryptedData: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        type,
      });

      toast.success("Item added to vault");
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setUrl("");
    setUsername("");
    setPassword("");
    setNotes("");
    setType("login");
    setShowPassword(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Add New Item</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2">
            {(["login", "note", "card", "identity"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  type === t
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Google Account"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {type === "login" && (
            <>
              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Website URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://accounts.google.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Username / Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 pr-20 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 rounded hover:bg-zinc-800"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Eye className="w-4 h-4 text-zinc-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="p-1 rounded hover:bg-zinc-800"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
                    title="Generate password"
                  >
                    <RefreshCw className="w-4 h-4 text-zinc-300" />
                  </button>
                </div>
                {/* Generator Options */}
                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="range" min="8" max="64" value={genOptions.length} onChange={(e) => setGenOptions(o => ({...o, length: +e.target.value}))} className="w-16 h-1 accent-blue-500" />
                    <span>{genOptions.length} chars</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-zinc-900 font-semibold rounded-lg px-4 py-2.5 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? "Encrypting & Saving..." : "Save to Vault"}
          </button>
        </form>
      </div>
    </div>
  );
}
