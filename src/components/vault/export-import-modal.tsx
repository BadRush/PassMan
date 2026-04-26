"use client";

import { useState, useRef } from "react";
import { X, Download, Upload, ShieldAlert, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useAuthStore } from "@/stores/auth-store";
import { exportVault, importVault } from "@/lib/crypto/export";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExportImportModal({ isOpen, onClose, onSuccess }: Props) {
  const encryptionKey = useAuthStore((s) => s.encryptionKey);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const { data: allItems } = trpc.vault.list.useQuery();
  const importMutation = trpc.vault.importItems.useMutation();

  const handleExport = async () => {
    if (!encryptionKey || !allItems || allItems.length === 0) {
      toast.error("No items to export or key missing.");
      return;
    }
    
    setIsExporting(true);
    try {
      // Export original encrypted contents.
      // Wait, if we export original encrypted contents, it's just the db contents.
      // But the export.ts takes plaintext.
      // Let's modify our approach: we just export the DB items directly since they are already encrypted with the master key.
      // But wait! If we export DB items, we don't need `exportVault` to encrypt it again.
      // Let's just create a JSON of the raw items.
      const exportData = {
        version: 1,
        timestamp: new Date().toISOString(),
        items: allItems.map(i => ({
          encryptedData: i.encryptedData,
          iv: i.iv,
          authTag: i.authTag,
          type: i.type,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `passman_backup_${new Date().toISOString().split('T')[0]}.passman`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Vault exported successfully");
    } catch (err) {
      toast.error("Failed to export vault");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      
      if (!payload.version || !payload.items) {
        throw new Error("Invalid .passman file format");
      }

      const items = payload.items;
      if (items.length === 0) {
        toast.info("No items found in backup file.");
        return;
      }

      await importMutation.mutateAsync(items);
      toast.success(`Successfully imported ${items.length} items`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to import vault");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Export & Import</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-400 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>
              Your exported vault is protected by your current Master Password. 
              If you change your password, you will not be able to decrypt old backup files!
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-white font-medium rounded-lg px-4 py-3 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {isExporting ? "Exporting..." : "Export Vault (.passman)"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500 font-medium">Or</span>
              </div>
            </div>

            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".passman,.json"
                onChange={handleImport}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button
                disabled={isImporting}
                className="w-full flex items-center justify-center gap-2 bg-white text-zinc-900 font-semibold rounded-lg px-4 py-3 hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                {isImporting ? "Importing..." : "Import Vault Backup"}
              </button>
            </div>
            
            <p className="text-xs text-center text-zinc-500">
              Only import backups created by PassMan. Importing will add items to your current vault.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
