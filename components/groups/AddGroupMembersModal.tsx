"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useFriends } from "@/hooks/useFriends";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface AddGroupMembersModalProps {
  open: boolean;
  conversation: Conversation;
  onClose: () => void;
  onAdded: (conversation: Conversation) => void;
}

export function AddGroupMembersModal({
  open,
  conversation,
  onClose,
  onAdded,
}: AddGroupMembersModalProps) {
  const { friends } = useFriends();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const memberIds = new Set(conversation.members?.map((m) => m.id) ?? []);
  const availableFriends = friends.filter(({ friend }) => !memberIds.has(friend.id));

  const toggleMember = (friendId: string) => {
    setSelectedIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId],
    );
  };

  const handleAdd = async () => {
    setError("");
    if (selectedIds.length === 0) {
      setError("Select at least one friend");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addMembers", memberIds: selectedIds }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      onAdded(data.data.conversation);
      setSelectedIds([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add members</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-2 scrollbar-thin">
          {availableFriends.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              All your friends are already in this group.
            </p>
          ) : (
            availableFriends.map(({ friend }) => {
              const selected = selectedIds.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => toggleMember(friend.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                    selected ? "bg-primary/10" : "hover:bg-accent/50",
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
                    <p className="truncate text-xs text-muted-foreground">@{friend.username}</p>
                  </div>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input",
                    )}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleAdd}
            loading={loading}
            disabled={availableFriends.length === 0}
          >
            Add to group
          </Button>
        </div>
      </div>
    </div>
  );
}
