"use client";

import { useState } from "react";
import { X, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useFriends } from "@/hooks/useFriends";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}

export function CreateGroupModal({ open, onClose, onCreated }: CreateGroupModalProps) {
  const { friends, loading } = useFriends();
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const toggleMember = (friendId: string) => {
    setSelectedIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId],
    );
  };

  const handleCreate = async () => {
    setError("");
    if (!name.trim()) {
      setError("Enter a group name");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Select at least one friend");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), memberIds: selectedIds }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to create group");
        return;
      }

      onCreated(data.data.conversation);
      setName("");
      setSelectedIds([]);
      onClose();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Create Group</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            id="group-name"
            label="Group name"
            placeholder="Family, Weekend plans..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div>
            <p className="mb-2 text-sm font-medium">Add friends</p>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-2 scrollbar-thin">
              {loading ? (
                <p className="p-3 text-sm text-muted-foreground">Loading friends...</p>
              ) : friends.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Add friends first before creating a group.
                </p>
              ) : (
                friends.map(({ friend }) => {
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
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              loading={submitting}
              disabled={friends.length === 0}
            >
              Create Group
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
