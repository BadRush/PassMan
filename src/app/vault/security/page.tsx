"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/vault/sidebar";
import { trpc } from "@/lib/trpc/client";
import { Shield, Key, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function SecurityPage() {
  const [step, setStep] = useState<"initial" | "setup">("initial");
  const [token, setToken] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totpEnabled, setTotpEnabled] = useState(false);

  const setupMutation = trpc.auth.setupTotp.useMutation();
  const verifyMutation = trpc.auth.verifyTotpSetup.useMutation();
  const disableMutation = trpc.auth.disableTotp.useMutation();

  // TanStack Query v5 removed onSuccess callback from useQuery.
  // Use the data directly and sync via useEffect instead.
  const statusQuery = trpc.auth.get2faStatus.useQuery();

  useEffect(() => {
    if (statusQuery.data) {
      setTotpEnabled(statusQuery.data.totpEnabled);
    }
  }, [statusQuery.data]);

  const handleStartSetup = async () => {
    try {
      const res = await setupMutation.mutateAsync();
      setQrCode(res.qrCode);
      setSecret(res.secret);
      setToken("");
      setStep("setup");
    } catch (err) {
      toast.error("Failed to start TOTP setup");
    }
  };

  const handleVerify = async () => {
    if (token.length !== 6) return;
    try {
      await verifyMutation.mutateAsync({ token });
      toast.success("2FA enabled successfully!");
      setTotpEnabled(true);
      setStep("initial");
      setQrCode(null);
      setSecret(null);
      setToken("");
      statusQuery.refetch(); // Sync server state
    } catch (err: any) {
      toast.error(err?.message || "Invalid code. Please try again.");
    }
  };

  const handleDisable = async () => {
    try {
      await disableMutation.mutateAsync();
      toast.success("2FA disabled.");
      setTotpEnabled(false);
      statusQuery.refetch(); // Sync server state
    } catch (err) {
      toast.error("Failed to disable 2FA");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Security Settings</h1>
              <p className="text-zinc-400">Manage your account security and two-factor authentication.</p>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totpEnabled ? "bg-emerald-500/10" : "bg-zinc-800"}`}>
                  <Key className={`w-5 h-5 ${totpEnabled ? "text-emerald-400" : "text-zinc-400"}`} />
                </div>
                <div>
                  <h3 className="text-white font-medium">Two-Factor Authentication (TOTP)</h3>
                  <p className="text-sm text-zinc-500">Secure your account with a secondary 6-digit code.</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                totpEnabled
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}>
                {statusQuery.isLoading ? "..." : totpEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            {/* Body */}
            <div className="p-8">
              {/* Loading state */}
              {statusQuery.isLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                </div>
              )}

              {/* State: TOTP already enabled */}
              {!statusQuery.isLoading && step === "initial" && totpEnabled && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">Two-Factor is Active</h4>
                  <p className="text-zinc-400 text-sm mb-8 max-w-sm mx-auto">
                    Your vault is protected with an additional layer of security.
                    You will need your authenticator app to log in.
                  </p>
                  <button
                    onClick={handleDisable}
                    disabled={disableMutation.isPending}
                    className="px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 font-medium rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {disableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                    Disable Two-Factor
                  </button>
                </div>
              )}

              {/* State: TOTP disabled, show setup prompt */}
              {!statusQuery.isLoading && step === "initial" && !totpEnabled && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">Enhance your Security</h4>
                  <p className="text-zinc-400 text-sm mb-8 max-w-sm mx-auto">
                    By enabling 2FA, you add an extra layer of protection to your vault.
                    Even if someone knows your master password, they can&apos;t log in without your device.
                  </p>
                  <button
                    onClick={handleStartSetup}
                    disabled={setupMutation.isPending}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {setupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Setup Two-Factor
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* State: Setup flow - QR code + verification */}
              {step === "setup" && qrCode && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="p-4 bg-white rounded-2xl shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="TOTP QR Code" width={200} height={200} className="rounded-lg" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 1</span>
                        <h4 className="text-lg font-semibold text-white">Scan the QR Code</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Open your authenticator app (Google Authenticator, Authy, Bitwarden, etc.)
                          and scan this QR code to add PassMan.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">Manual Entry Code:</p>
                        <code className="text-blue-400 font-mono text-sm break-all select-all">{secret}</code>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-800">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 2</span>
                        <h4 className="text-lg font-semibold text-white">Verify Code</h4>
                        <p className="text-sm text-zinc-400">
                          Enter the 6-digit code from your authenticator app to confirm the setup.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={token}
                          onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                          className="w-40 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-2xl tracking-[0.5em] font-mono text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          autoFocus
                        />
                        <button
                          onClick={handleVerify}
                          disabled={token.length !== 6 || verifyMutation.isPending}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Verify & Activate
                        </button>
                      </div>
                      <button
                        onClick={() => { setStep("initial"); setQrCode(null); setSecret(null); setToken(""); }}
                        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        ← Cancel setup
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-400/80 leading-relaxed">
              <strong>Note:</strong> Recovery codes implementation is coming soon. Please ensure you have backed up
              your authenticator app data to avoid losing access to your vault.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
