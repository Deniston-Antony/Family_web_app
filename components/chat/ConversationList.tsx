"use client";

import { useEffect, useState } from "react";
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
        description="Start chatting with your friends"
        className="py-12"
      />
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {conversations.map((conversation) => (
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
          <Avatar
            src={conversation.participant.profilePicture}
            name={conversation.participant.name}
            size="md"
            showOnline
            isOnline={conversation.participant.isOnline}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="truncate font-medium">{conversation.participant.name}</p>
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
                {conversation.lastMessage?.content ?? "No messages yet"}
              </p>
              {conversation.unreadCount > 0 && (
                <Badge count={conversation.unreadCount} className="ml-2" />
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
