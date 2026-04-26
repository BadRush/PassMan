"use client";

import { useState } from "react";
import { Folder, Plus, MoreVertical, Trash2, Edit2, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useDroppable } from "@dnd-kit/core";

interface FolderItemProps {
  id: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
  onRename: (id: string, currentName: string) => void;
  onDelete: (id: string) => void;
}

function FolderItem({ id, name, isActive, onClick, onRename, onDelete }: FolderItemProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${id}`,
    data: {
      type: "Folder",
      folderId: id,
    },
  });

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
        isOver
          ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
          : isActive
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5 truncate">
        <Folder className={`w-4 h-4 ${isOver ? "text-blue-400" : isActive ? "text-blue-400" : "text-zinc-500"}`} />
        <span className="truncate">{name}</span>
      </div>

      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-1 hover:bg-zinc-700 rounded"
        >
          <MoreVertical className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onRename(id, name); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700"
            >
              <Edit2 className="w-3 h-3" /> Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(id); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-zinc-700"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

export function FolderSidebar({ activeFolderId, onSelectFolder }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const { data: folders, refetch } = trpc.folder.list.useQuery();
  const createMutation = trpc.folder.create.useMutation();
  const updateMutation = trpc.folder.update.useMutation();
  const deleteMutation = trpc.folder.delete.useMutation();

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await createMutation.mutateAsync({ name: newFolderName });
      setNewFolderName("");
      setIsCreating(false);
      refetch();
      toast.success("Folder created");
    } catch {
      toast.error("Failed to create folder");
    }
  };

  const handleRename = async (id: string, currentName: string) => {
    const newName = prompt("Rename folder:", currentName);
    if (newName && newName !== currentName) {
      try {
        await updateMutation.mutateAsync({ id, name: newName });
        refetch();
        toast.success("Folder renamed");
      } catch {
        toast.error("Failed to rename folder");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this folder? Items inside will be moved to Uncategorized.")) {
      try {
        if (activeFolderId === id) onSelectFolder(null);
        await deleteMutation.mutateAsync({ id });
        refetch();
        toast.success("Folder deleted");
      } catch {
        toast.error("Failed to delete folder");
      }
    }
  };

  // Uncategorized droppable area
  const { setNodeRef: setUncategorizedRef, isOver: isUncategorizedOver } = useDroppable({
    id: "folder-uncategorized",
    data: {
      type: "Folder",
      folderId: null,
    },
  });

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between px-3 mb-2">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Folders</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-zinc-800 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      <div className="space-y-1">
        <div
          ref={setUncategorizedRef}
          onClick={() => onSelectFolder(null)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
            isUncategorizedOver
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
              : activeFolderId === null
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
          }`}
        >
          <Shield className={`w-4 h-4 ${isUncategorizedOver ? "text-blue-400" : activeFolderId === null ? "text-blue-400" : "text-zinc-500"}`} />
          <span>Uncategorized</span>
        </div>

        {folders?.map((folder) => (
          <FolderItem
            key={folder.id}
            id={folder.id}
            name={folder.name}
            isActive={activeFolderId === folder.id}
            onClick={() => onSelectFolder(folder.id)}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        ))}

        {isCreating && (
          <form onSubmit={handleCreateFolder} className="px-2 pt-1">
            <input
              autoFocus
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => setIsCreating(false)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </form>
        )}
      </div>
    </div>
  );
}
