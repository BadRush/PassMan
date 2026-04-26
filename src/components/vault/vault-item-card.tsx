"use client";

import { Star, Globe, StickyNote, CreditCard, User, Eye } from "lucide-react";

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
  return (
    <div
      onClick={() => onSelect(item.id)}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 border ${
        isSelected
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800/70 hover:border-zinc-700"
      }`}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
        {typeIcons[item.type] || <Globe className="w-5 h-5 text-zinc-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.name || "Untitled"}</p>
        {item.username && (
          <p className="text-xs text-zinc-500 truncate">{item.username}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
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
