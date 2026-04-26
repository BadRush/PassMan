"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Shield, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useAuthStore } from "@/stores/auth-store";
import { decrypt, type EncryptedPayload } from "@/lib/crypto/aes";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { VaultItemCard, type VaultItemData } from "@/components/vault/vault-item-card";
import { AddItemModal } from "@/components/vault/add-item-modal";
import { ItemDetailPanel } from "@/components/vault/item-detail-panel";
import { Sidebar } from "@/components/vault/sidebar";
import { ExportImportModal } from "@/components/vault/export-import-modal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";

type FilterType = "all" | "login" | "note" | "card" | "identity" | "favorites";

export default function VaultPage() {
  const encryptionKey = useAuthStore((s) => s.encryptionKey);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>(
    (searchParams.get("filter") as FilterType) || "all"
  );
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportImportModal, setShowExportImportModal] = useState(false);
  const [decryptedItems, setDecryptedItems] = useState<Map<string, VaultItemData>>(new Map());
  const [activeDragItem, setActiveDragItem] = useState<VaultItemData | null>(null);

  const queryInput = filter === "favorites"
    ? { favoritesOnly: true }
    : filter !== "all"
    ? { type: filter as "login" | "note" | "card" | "identity" }
    : { folderId: activeFolderId === null ? undefined : activeFolderId }; // Filter by folder when "all"

  const { data: rawItems, refetch } = trpc.vault.list.useQuery(queryInput);
  const toggleFavMutation = trpc.vault.toggleFavorite.useMutation();
  const moveToFolderMutation = trpc.vault.moveToFolder.useMutation();
  const reorderMutation = trpc.vault.reorder.useMutation();

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



  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "VaultItem") {
      setActiveDragItem(active.data.current.item);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    if (active.data.current?.type === "VaultItem" && over.data.current?.type === "Folder") {
      const itemId = active.id as string;
      const folderId = over.data.current.folderId as string | null;
      
      // Don't move if it's already in that folder
      if (filter === "all" && activeFolderId === folderId) return;

      try {
        // Optimistic update
        const itemStrId = String(itemId);
        setDecryptedItems((prev) => {
          const next = new Map(prev);
          next.delete(itemStrId);
          return next;
        });

        await moveToFolderMutation.mutateAsync({ id: itemId, folderId });
        refetch();
        toast.success("Item moved");
      } catch {
        refetch();
        toast.error("Failed to move item");
      }
    } else if (active.id !== over.id && active.data.current?.type === "VaultItem" && over.data.current?.type === "VaultItem") {
      // Reordering
      const items = Array.from(decryptedItems.values());
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // Update local state optimistically
      const newMap = new Map();
      newItems.forEach((i) => newMap.set(i.id, i));
      setDecryptedItems(newMap);

      // Save to backend
      const updates = newItems.map((item, index) => ({
        id: item.id,
        sortOrder: index,
      }));

      try {
        await reorderMutation.mutateAsync(updates);
      } catch {
        refetch();
        toast.error("Failed to save order");
      }
    }
  };



  // If no encryption key, show re-login prompt
  if (!encryptionKey) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Lock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Vault Locked</h1>
          <p className="text-zinc-400 mb-6">Your encryption key is not in memory. Please login again.</p>
          <button 
            onClick={() => {
              clearAuth();
              signOut({ callbackUrl: "/login" });
            }} 
            className="px-6 py-2.5 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-zinc-950 flex">
        <Sidebar 
          filter={filter}
          activeFolderId={activeFolderId}
          onFilterChange={setFilter}
          onFolderSelect={(id) => {
            setActiveFolderId(id);
            if (id !== null) {
              setFilter("all");
            }
            setSelectedId(null);
          }}
          onShowExportImport={() => setShowExportImportModal(true)}
        />

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
                <SortableContext items={filteredItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {filteredItems.map((item) => (
                    <VaultItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedId === item.id}
                      onSelect={setSelectedId}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </SortableContext>
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

        {/* Export/Import Modal */}
        <ExportImportModal
          isOpen={showExportImportModal}
          onClose={() => setShowExportImportModal(false)}
          onSuccess={() => refetch()}
        />

        <DragOverlay>
          {activeDragItem ? (
            <div className="opacity-80 scale-105 shadow-2xl pointer-events-none">
              <VaultItemCard
                item={activeDragItem}
                isSelected={false}
                onSelect={() => {}}
                onToggleFavorite={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
