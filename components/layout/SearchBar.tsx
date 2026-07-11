"use client";

import { useState } from "react";
import { Search, X, UserPlus, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSearchUsers } from "@/hooks/useSearchUsers";
import { useFriends } from "@/hooks/useFriends";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const { data: session } = useSession();
  const { results, loading, query, setQuery, refetch } = useSearchUsers();
  const { sendRequest, cancelRequest, refresh, requests } = useFriends();
  const [isOpen, setIsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAddFriend = async (userId: string) => {
    setActionLoading(userId);
    try {
      await sendRequest(userId);
    } catch (err) {
      console.error(err);
    } finally {
      await refresh();
      refetch();
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (receiverId: string) => {
    setActionLoading(receiverId);
    try {
      const pendingSent = requests.find(
        (r) =>
          r.status === "PENDING" &&
          r.receiverId === receiverId &&
          r.senderId === session?.user?.id,
      );
      if (pendingSent) {
        await cancelRequest(pendingSent.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      await refresh();
      refetch();
      setActionLoading(null);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={cn(
            "h-10 w-full rounded-xl border border-input bg-background/50 pl-10 pr-10 text-sm",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-xl scrollbar-thin">
          {loading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
          ) : (
            results.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 border-b border-border/50 p-3 last:border-0 hover:bg-accent/50"
              >
                <Avatar src={user.profilePicture} name={user.name} size="md" showOnline isOnline={user.isOnline} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                </div>
                {user.isFriend ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-3 w-3" /> Friends
                  </span>
                ) : user.hasPendingRequest ? (
                  user.requestDirection === "sent" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={actionLoading === user.id}
                      onClick={() => handleCancelRequest(user.id)}
                    >
                      <Clock className="h-3 w-3" /> Pending
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Request received</span>
                  )
                ) : (
                  <Button
                    size="sm"
                    loading={actionLoading === user.id}
                    onClick={() => handleAddFriend(user.id)}
                  >
                    <UserPlus className="h-3 w-3" /> Add
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {isOpen && query && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
