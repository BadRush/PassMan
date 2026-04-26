"use client";

import { Shield, Star, Globe, StickyNote, CreditCard, User, LogOut, Lock } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { FolderSidebar } from "./folder-sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { signOut } from "next-auth/react";

interface SidebarProps {
  filter?: string;
  activeFolderId?: string | null;
  onFilterChange?: (filter: any) => void;
  onFolderSelect?: (id: string | null) => void;
  onShowExportImport?: () => void;
}

export function Sidebar({ 
  filter, 
  activeFolderId, 
  onFilterChange, 
  onFolderSelect,
  onShowExportImport 
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const categories = [
    { key: "all", label: "All Items", icon: <Shield className="w-4 h-4" />, href: "/vault" },
    { key: "favorites", label: "Favorites", icon: <Star className="w-4 h-4" />, href: "/vault?filter=favorites" },
    { key: "login", label: "Logins", icon: <Globe className="w-4 h-4" />, href: "/vault?filter=login" },
    { key: "note", label: "Secure Notes", icon: <StickyNote className="w-4 h-4" />, href: "/vault?filter=note" },
    { key: "card", label: "Cards", icon: <CreditCard className="w-4 h-4" />, href: "/vault?filter=card" },
    { key: "identity", label: "Identities", icon: <User className="w-4 h-4" />, href: "/vault?filter=identity" },
  ];

  const handleLogout = async () => {
    clearAuth();
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="w-56 bg-zinc-950 border-r border-zinc-800/50 p-4 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Shield className="w-6 h-6 text-blue-400" />
        <span className="font-bold text-white text-lg tracking-tight">PassMan</span>
      </div>

      <nav className="space-y-1">
        {categories.map((cat) => {
          const isActive = pathname === "/vault" && (filter === cat.key || (!filter && cat.key === "all"));
          return (
            <button
              key={cat.key}
              onClick={() => {
                if (pathname !== "/vault") {
                  router.push(cat.href);
                } else {
                  if (onFilterChange) onFilterChange(cat.key);
                  if (onFolderSelect) onFolderSelect(null);
                }
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          );
        })}

        <Link
          href="/vault/security"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
            pathname === "/vault/security"
              ? "bg-blue-500/10 text-blue-400"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
        >
          <Lock className="w-4 h-4" />
          Security
        </Link>
      </nav>

      <div className="flex-1 overflow-y-auto mt-4">
        {pathname === "/vault" && onFolderSelect && (
          <FolderSidebar
            activeFolderId={activeFolderId || null}
            onSelectFolder={onFolderSelect}
          />
        )}
      </div>

      <div className="pt-4 border-t border-zinc-800/50 space-y-1">
        {onShowExportImport && (
          <button
            onClick={onShowExportImport}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4" />
            Export & Import
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Lock Vault
        </button>
      </div>
    </aside>
  );
}
