"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageSkeleton } from "@/components/ui/Skeleton";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { useChat } from "@/components/providers/ChatProvider";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { formatLastSeen } from "@/lib/utils";
import type { Message } from "@/types";

interface ChatWindowProps {
  onBack?: () => void;
  showBack?: boolean;
}

export function ChatWindow({ onBack, showBack }: ChatWindowProps) {
  const { data: session } = useSession();
  const {
    activeConversation,
    messages,
    setMessages,
    typingUsers,
    updateMessage,
    removeMessage,
    setConversations,
    conversations,
    addMessage,
    updateConversationLastMessage,
  } = useChat();
  const { joinConversation, leaveConversation, sendMessage, startTyping, stopTyping, markAsRead, isConnected } =
    useChatSocket();
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(
    null,
  );
  const scrollRef = useAutoScroll<HTMLDivElement>([messages.length, typingUsers]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages);
        const lastOtherMessage = [...data.data.messages]
          .reverse()
          .find((m: Message) => m.senderId !== session?.user?.id);
        if (lastOtherMessage) {
          markAsRead(lastOtherMessage.id, conversationId);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [setMessages, session?.user?.id, markAsRead]);

  useEffect(() => {
    if (!activeConversation) return;

    joinConversation(activeConversation.id);
    loadMessages(activeConversation.id);

    setConversations(
      conversations.map((c) =>
        c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c,
      ),
    );

    return () => {
      leaveConversation(activeConversation.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id]);

  const handleSend = async (content: string) => {
    if (!activeConversation) return;

    if (editingMessage) {
      const res = await fetch(`/api/messages/${editingMessage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        updateMessage(data.data.message);
      }
      setEditingMessage(null);
    } else if (isConnected) {
      sendMessage(activeConversation.id, content);
    } else {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConversation.id, content }),
      });
      const data = await res.json();
      if (data.success) {
        addMessage(data.data.message);
        updateConversationLastMessage(activeConversation.id, data.data.message);
      }
    }
  };

  const handleDelete = async (messageId: string) => {
    const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      removeMessage(messageId);
    }
  };

  if (!activeConversation) {
    return (
      <EmptyState
        icon="chat"
        title="Select a conversation"
        description="Choose a conversation from the list or message a friend"
        className="h-full"
      />
    );
  }

  const typing = typingUsers[activeConversation.id] ?? [];
  const isGroup = activeConversation.type === "GROUP";
  const participant = activeConversation.participant;
  const groupName = activeConversation.name ?? "Group";
  const memberCount = activeConversation.memberCount ?? activeConversation.members?.length ?? 0;
  const onlineCount =
    activeConversation.onlineCount ??
    activeConversation.members?.filter((m) => m.isOnline).length ??
    0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {showBack && (
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {isGroup ? (
          <Avatar src={activeConversation.image} name={groupName} size="md" />
        ) : (
          participant && (
            <Avatar
              src={participant.profilePicture}
              name={participant.name}
              size="md"
              showOnline
              isOnline={participant.isOnline || typing.length > 0}
            />
          )
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium">{isGroup ? groupName : participant?.name}</p>
          <p className="text-xs text-muted-foreground">
            {typing.length > 0
              ? `${typing.join(", ")} typing...`
              : isGroup
                ? `${memberCount} members · ${onlineCount} online`
                : participant?.isOnline
                  ? "Online"
                  : `Last seen ${formatLastSeen(participant?.lastSeen ?? null)}`}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
        {loading ? (
          <>
            <MessageSkeleton />
            <MessageSkeleton isOwn />
            <MessageSkeleton />
          </>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {isGroup
                ? `No messages yet. Say hello to ${groupName}!`
                : `No messages yet. Say hello to ${participant?.name}!`}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === session?.user?.id}
              showSenderName={isGroup}
              onEdit={(msg) => setEditingMessage({ id: msg.id, content: msg.content })}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <MessageInput
        onSend={handleSend}
        onTyping={() =>
          startTyping(activeConversation.id, session?.user?.username ?? "")
        }
        onStopTyping={() => stopTyping(activeConversation.id)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
}
