"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Shield, LogOut, Globe, StickyNote, CreditCard, User, Star, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useAuthStore } from "@/stores/auth-store";
import { decrypt, type EncryptedPayload } from "@/lib/crypto/aes";
import { signOut } from "next-auth/react";
import { VaultItemCard, type VaultItemData } from "@/components/vault/vault-item-card";
import { AddItemModal } from "@/components/vault/add-item-modal";
import { ItemDetailPanel } from "@/components/vault/item-detail-panel";

type FilterType = "all" | "login" | "note" | "card" | "identity" | "favorites";

export default function VaultPage() {
  const encryptionKey = useAuthStore((s) => s.encryptionKey);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [decryptedItems, setDecryptedItems] = useState<Map<string, VaultItemData>>(new Map());

  const queryInput = filter === "favorites"
    ? { favoritesOnly: true }
    : filter !== "all"
    ? { type: filter as "login" | "note" | "card" | "identity" }
    : undefined;

  const { data: rawItems, refetch } = trpc.vault.list.useQuery(queryInput);
  const toggleFavMutation = trpc.vault.toggleFavorite.useMutation();

  // Decrypt items for display (name + username only)
  useEffect(() => {
    if (!rawItems || !encryptionKey) return;
    const decryptAll = async () => {
      const map = new Map<string, VaultItemData>();
      for (const item of rawItems) {
        try {
          const payload: EncryptedPayload = {
            ciphertext: item.encryptedData,
            iv: item.iv,
            authTag: item.authTag,
          };
          const plain = await decrypt(payload, encryptionKey);
          const parsed = JSON.parse(plain);
          map.set(item.id, {
            id: item.id,
            name: parsed.name || "Untitled",
            username: parsed.username,
            type: item.type,
            isFavorite: item.isFavorite,
            updatedAt: item.updatedAt,
          });
        } catch {
          map.set(item.id, {
            id: item.id,
            name: "⚠ Decryption Failed",
            type: item.type,
            isFavorite: item.isFavorite,
            updatedAt: item.updatedAt,
          });
        }
      }
      setDecryptedItems(map);
    };
    decryptAll();
  }, [rawItems, encryptionKey]);

  const filteredItems = useMemo(() => {
    const items = Array.from(decryptedItems.values());
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.username && i.username.toLowerCase().includes(q))
    );
  }, [decryptedItems, search]);

  const selectedRawItem = rawItems?.find((i) => i.id === selectedId) || null;

  const handleToggleFavorite = async (id: string) => {
    await toggleFavMutation.mutateAsync({ id });
    refetch();
  };

  const handleLogout = async () => {
    clearAuth();
    await signOut({ callbackUrl: "/login" });
  };

  const sidebarCategories: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "All Items", icon: <Shield className="w-4 h-4" /> },
    { key: "favorites", label: "Favorites", icon: <Star className="w-4 h-4" /> },
    { key: "login", label: "Logins", icon: <Globe className="w-4 h-4" /> },
    { key: "note", label: "Secure Notes", icon: <StickyNote className="w-4 h-4" /> },
    { key: "card", label: "Cards", icon: <CreditCard className="w-4 h-4" /> },
    { key: "identity", label: "Identities", icon: <User className="w-4 h-4" /> },
  ];

  // If no encryption key, show re-login prompt
  if (!encryptionKey) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Lock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Vault Locked</h1>
          <p className="text-zinc-400 mb-6">Your encryption key is not in memory. Please login again.</p>
          <a href="/login" className="px-6 py-2.5 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 transition-colors">
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-zinc-950 border-r border-zinc-800/50 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-white text-lg tracking-tight">PassMan</span>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setFilter(cat.key); setSelectedId(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                filter === cat.key
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Lock Vault
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Item List */}
        <div className="w-80 border-r border-zinc-800/50 flex flex-col">
          {/* Search + Add */}
          <div className="p-4 border-b border-zinc-800/50 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vault..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg py-2 text-sm font-medium hover:bg-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No items found</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <VaultItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onSelect={setSelectedId}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))
            )}
          </div>

          {/* Count */}
          <div className="p-3 border-t border-zinc-800/50 text-xs text-zinc-600 text-center">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedRawItem ? (
            <ItemDetailPanel
              item={selectedRawItem}
              onClose={() => setSelectedId(null)}
              onDeleted={() => { setSelectedId(null); refetch(); }}
              onUpdated={() => refetch()}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Shield className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500">Select an item to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
