"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Eye, EyeOff, ExternalLink, Trash2, Pencil } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { decrypt, encrypt, type EncryptedPayload } from "@/lib/crypto/aes";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

interface VaultItemRaw {
  id: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  type: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DecryptedData {
  name: string;
  url?: string;
  username?: string;
  password?: string;
  notes?: string;
}

interface Props {
  item: VaultItemRaw | null;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

export function ItemDetailPanel({ item, onClose, onDeleted, onUpdated }: Props) {
  const encryptionKey = useAuthStore((s) => s.encryptionKey);
  const [data, setData] = useState<DecryptedData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<DecryptedData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const deleteMutation = trpc.vault.delete.useMutation();
  const updateMutation = trpc.vault.update.useMutation();

  useEffect(() => {
    if (!item || !encryptionKey) {
      setData(null);
      return;
    }
    const decryptItem = async () => {
      try {
        const payload: EncryptedPayload = {
          ciphertext: item.encryptedData,
          iv: item.iv,
          authTag: item.authTag,
        };
        const plaintext = await decrypt(payload, encryptionKey);
        const parsed = JSON.parse(plaintext) as DecryptedData;
        setData(parsed);
        setEditData(parsed);
      } catch {
        setData(null);
        toast.error("Failed to decrypt item");
      }
    };
    decryptItem();
  }, [item, encryptionKey]);

  const handleCopy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteMutation.mutateAsync({ id: item.id });
      toast.success("Item deleted");
      onDeleted();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleSaveEdit = async () => {
    if (!item || !encryptionKey || !editData) return;
    setIsSaving(true);
    try {
      const plaintext = JSON.stringify(editData);
      const encrypted = await encrypt(plaintext, encryptionKey);
      await updateMutation.mutateAsync({
        id: item.id,
        encryptedData: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });
      setData(editData);
      setIsEditing(false);
      toast.success("Item updated");
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  if (!item || !data) return null;

  const CopyButton = ({ value, field }: { value: string; field: string }) => (
    <button onClick={() => handleCopy(value, field)} className="p-1.5 rounded-md hover:bg-zinc-700 transition-colors">
      {copiedField === field ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
    </button>
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">{data.name || "Untitled"}</h2>
          <p className="text-xs text-zinc-500 capitalize mt-1">{item.type}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Pencil className="w-4 h-4 text-zinc-400" />
          </button>
          <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit Mode */
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Name</label>
            <input value={editData?.name || ""} onChange={(e) => setEditData(d => d ? {...d, name: e.target.value} : d)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {item.type === "login" && (
            <>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">URL</label>
                <input value={editData?.url || ""} onChange={(e) => setEditData(d => d ? {...d, url: e.target.value} : d)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Username</label>
                <input value={editData?.username || ""} onChange={(e) => setEditData(d => d ? {...d, username: e.target.value} : d)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Password</label>
                <input type={showPassword ? "text" : "password"} value={editData?.password || ""} onChange={(e) => setEditData(d => d ? {...d, password: e.target.value} : d)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
            <textarea value={editData?.notes || ""} onChange={(e) => setEditData(d => d ? {...d, notes: e.target.value} : d)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 bg-white text-zinc-900 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-zinc-200 disabled:opacity-50 transition-all">
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={() => { setIsEditing(false); setEditData(data); }} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700 transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-4">
          {data.url && (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Website</p>
              <div className="flex items-center gap-2">
                <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline truncate flex items-center gap-1">
                  {data.url} <ExternalLink className="w-3 h-3" />
                </a>
                <CopyButton value={data.url} field="url" />
              </div>
            </div>
          )}

          {data.username && (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Username</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-mono">{data.username}</span>
                <CopyButton value={data.username} field="username" />
              </div>
            </div>
          )}

          {data.password && (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Password</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-mono">
                  {showPassword ? data.password : "•".repeat(Math.min(data.password.length, 20))}
                </span>
                <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 rounded-md hover:bg-zinc-700 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Eye className="w-4 h-4 text-zinc-400" />}
                </button>
                <CopyButton value={data.password} field="password" />
              </div>
            </div>
          )}

          {data.notes && (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Notes</p>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}

          <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-600">
            <p>Updated: {new Date(item.updatedAt).toLocaleString("id-ID")}</p>
            <p>Created: {new Date(item.createdAt).toLocaleString("id-ID")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
