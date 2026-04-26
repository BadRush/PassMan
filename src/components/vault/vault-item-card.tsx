"use client";

import { Star, Globe, StickyNote, CreditCard, User, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface VaultItemData {
  id: string;
  name: string;
  username?: string;
  type: string;
  isFavorite: boolean;
  updatedAt: Date;
}

const typeIcons: Record<string, React.ReactNode> = {
  login: <Globe className="w-5 h-5 text-blue-400" />,
  note: <StickyNote className="w-5 h-5 text-yellow-400" />,
  card: <CreditCard className="w-5 h-5 text-emerald-400" />,
  identity: <User className="w-5 h-5 text-purple-400" />,
};

interface Props {
  item: VaultItemData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function VaultItemCard({ item, isSelected, onSelect, onToggleFavorite }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "VaultItem",
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(item.id)}
      className={`group flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 border ${
        isSelected
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800/70 hover:border-zinc-700"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
        {typeIcons[item.type] || <Globe className="w-5 h-5 text-zinc-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.name || "Untitled"}</p>
        {item.username && (
          <p className="text-xs text-zinc-500 truncate">{item.username}</p>
        )}
      </div>
      <div className="flex items-center gap-1 pr-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          className="p-1.5 rounded-md hover:bg-zinc-700/50 transition-colors"
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              item.isFavorite
                ? "text-yellow-400 fill-yellow-400"
                : "text-zinc-600 group-hover:text-zinc-400"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
