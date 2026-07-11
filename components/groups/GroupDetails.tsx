"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Camera, UserPlus, Save, LogOut, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AddGroupMembersModal } from "@/components/groups/AddGroupMembersModal";
import type { Conversation } from "@/types";

interface GroupDetailsProps {
  conversation: Conversation | null;
  onConversationUpdate: (conversation: Conversation | null) => void;
}

export function GroupDetails({ conversation, onConversationUpdate }: GroupDetailsProps) {
  const { data: session } = useSession();
  const [name, setName] = useState(conversation?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);

  useEffect(() => {
    setName(conversation?.name ?? "");
    setMessage("");
  }, [conversation?.id, conversation?.name]);

  if (!conversation || conversation.type !== "GROUP") {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <h3 className="font-semibold text-muted-foreground">Group info</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a group chat to manage members and settings
          </p>
        </div>
      </div>
    );
  }

  const members = conversation.members ?? [];
  const onlineCount = conversation.onlineCount ?? members.filter((m) => m.isOnline).length;
  const isCreator = conversation.createdById === session?.user?.id;
  const displayName = conversation.name ?? "Group";

  const handleNameSave = async () => {
    if (!name.trim() || name.trim() === conversation.name) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/groups/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateName", name: name.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onConversationUpdate(data.data.conversation);
      setMessage("Group name updated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/groups/${conversation.id}/image`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onConversationUpdate(data.data.conversation);
      setMessage("Group photo updated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/groups/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeMember", memberId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (data.data.left) {
        onConversationUpdate(null);
        setMessage("You left the group");
        return;
      }

      onConversationUpdate(data.data.conversation);
      setMessage("Member removed");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {message && (
        <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">{message}</div>
      )}

      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <Avatar src={conversation.image} name={displayName} size="xl" />
          <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Camera className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={loading}
            />
          </label>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {members.length} members · {onlineCount} online
        </p>
      </div>

      <div className="space-y-2">
        <Input
          label="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          size="sm"
          onClick={handleNameSave}
          loading={loading}
          disabled={!name.trim() || name.trim() === conversation.name}
        >
          <Save className="h-4 w-4" />
          Save name
        </Button>
      </div>

      <Button variant="outline" className="w-full" onClick={() => setShowAddMembers(true)}>
        <UserPlus className="h-4 w-4" />
        Add members
      </Button>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Members
        </h3>
        <div className="space-y-1">
          {members.map((member) => {
            const isSelf = member.id === session?.user?.id;
            const canRemove = isSelf || isCreator;

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-accent/50"
              >
                <Avatar
                  src={member.profilePicture}
                  name={member.name}
                  size="sm"
                  showOnline
                  isOnline={member.isOnline}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.name}
                    {isSelf ? " (You)" : ""}
                    {member.id === conversation.createdById ? " · Admin" : ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.isOnline ? "Online" : `@${member.username}`}
                  </p>
                </div>
                {canRemove && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={loading}
                    className="text-muted-foreground hover:text-destructive"
                    title={isSelf ? "Leave group" : "Remove member"}
                  >
                    {isSelf ? <LogOut className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AddGroupMembersModal
        open={showAddMembers}
        conversation={conversation}
        onClose={() => setShowAddMembers(false)}
        onAdded={onConversationUpdate}
      />
    </div>
  );
}
