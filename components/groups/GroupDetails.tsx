"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Users } from "lucide-react";
import type { Conversation } from "@/types";

interface GroupDetailsProps {
  conversation: Conversation | null;
}

export function GroupDetails({ conversation }: GroupDetailsProps) {
  if (!conversation || conversation.type !== "GROUP") {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <div className="mx-auto mb-4 rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-muted-foreground">Group info</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a group chat to see members
          </p>
        </div>
      </div>
    );
  }

  const members = conversation.members ?? [];
  const onlineCount = conversation.onlineCount ?? members.filter((m) => m.isOnline).length;

  return (
    <div className="p-6">
      <div className="flex flex-col items-center text-center">
        <Avatar src={null} name={conversation.name ?? "Group"} size="xl" />
        <h2 className="mt-4 text-xl font-bold">{conversation.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {members.length} members · {onlineCount} online
        </p>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Members
        </h3>
        <div className="space-y-1">
          {members.map((member) => (
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
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.isOnline ? "Online" : `@${member.username}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
