"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { FriendSkeleton } from "@/components/ui/Skeleton";
import { useFriends } from "@/hooks/useFriends";
import { useChat } from "@/components/providers/ChatProvider";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/types";

interface FriendsListProps {
  onSelectFriend: (friend: PublicUser) => void;
}

export function FriendsList({ onSelectFriend }: FriendsListProps) {
  const { friends, loading } = useFriends();
  const { selectedFriend } = useChat();
  const [search, setSearch] = useState("");

  const filtered = friends.filter(
    (f) =>
      f.friend.name.toLowerCase().includes(search.toLowerCase()) ||
      f.friend.username.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <FriendSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-input bg-background/50 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <EmptyState
            icon="friends"
            title={search ? "No friends found" : "No friends yet"}
            description={
              search
                ? "Try a different search term"
                : "Search for users and send friend requests to get started"
            }
          />
        ) : (
          <div className="space-y-0.5 p-2">
            {filtered.map(({ friend }) => (
              <button
                key={friend.id}
                onClick={() => onSelectFriend(friend)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                  selectedFriend?.id === friend.id
                    ? "bg-primary/10 text-foreground"
                    : "hover:bg-accent/50",
                )}
              >
                <Avatar
                  src={friend.profilePicture}
                  name={friend.name}
                  size="sm"
                  showOnline
                  isOnline={friend.isOnline}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{friend.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {friend.isOnline ? "Online" : friend.statusMessage || `@${friend.username}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
