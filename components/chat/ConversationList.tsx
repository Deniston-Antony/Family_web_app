"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConversationSkeleton } from "@/components/ui/Skeleton";
import { useChat } from "@/components/providers/ChatProvider";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Conversation } from "@/types";

interface ConversationListProps {
  onSelect: (conversation: Conversation) => void;
}

function getConversationTitle(conversation: Conversation): string {
  if (conversation.type === "GROUP") {
    return conversation.name ?? "Group";
  }
  return conversation.participant?.name ?? "Unknown";
}

function getConversationPreview(conversation: Conversation): string {
  if (!conversation.lastMessage) return "No messages yet";

  const prefix =
    conversation.type === "GROUP" && conversation.lastMessage.sender
      ? `${conversation.lastMessage.sender.name.split(" ")[0]}: `
      : "";

  return `${prefix}${conversation.lastMessage.content}`;
}

export function ConversationList({ onSelect }: ConversationListProps) {
  const { conversations, activeConversation, setConversations } = useChat();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setConversations(d.data.conversations);
      })
      .finally(() => setLoading(false));
  }, [setConversations]);

  if (loading) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3, 4].map((i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon="chat"
        title="No conversations"
        description="Start chatting with your friends or create a group"
        className="py-12"
      />
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {conversations.map((conversation) => {
        const isGroup = conversation.type === "GROUP";
        const title = getConversationTitle(conversation);

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all",
              activeConversation?.id === conversation.id
                ? "bg-primary/10"
                : "hover:bg-accent/50",
            )}
          >
            {isGroup ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            ) : (
              <Avatar
                src={conversation.participant?.profilePicture}
                name={title}
                size="md"
                showOnline
                isOnline={conversation.participant?.isOnline}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate font-medium">{title}</p>
                {conversation.lastMessage && (
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                      addSuffix: false,
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="truncate text-sm text-muted-foreground">
                  {getConversationPreview(conversation)}
                </p>
                {conversation.unreadCount > 0 && (
                  <Badge count={conversation.unreadCount} className="ml-2" />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
