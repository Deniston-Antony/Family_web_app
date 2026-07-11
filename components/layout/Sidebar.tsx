"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/useMounted";
import {
  User,
  Users,
  UserPlus,
  Settings,
  LogOut,
  Sun,
  Moon,
  MessageCircle,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type SidebarTab = "profile" | "friends" | "requests" | "settings";

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  requestCount: number;
  unreadCount: number;
}

export function Sidebar({ activeTab, onTabChange, requestCount, unreadCount }: SidebarProps) {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "friends" as const, label: "Friends", icon: Users },
    { id: "requests" as const, label: "Requests", icon: UserPlus, badge: requestCount },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <MessageCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">FamilyChat</span>
          {unreadCount > 0 && <Badge count={unreadCount} />}
        </div>
      </div>

      {session?.user && (
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={session.user.profilePicture}
              name={session.user.name ?? "User"}
              size="md"
              showOnline
              isOnline
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{session.user.name}</p>
              <p className="truncate text-xs text-muted-foreground">@{session.user.username}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 p-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.badge ? <Badge count={tab.badge} className="ml-auto" /> : null}
          </button>
        ))}
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export type { SidebarTab };
