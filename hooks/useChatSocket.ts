"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useChat } from "@/components/providers/ChatProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useSession } from "next-auth/react";
import type { Message } from "@/types";

/** Register socket listeners once at the app level (e.g. in ChatApp). */
export function useChatSocketEvents() {
  const { on, off, emit, isConnected } = useSocket();
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const {
    activeConversation,
    addMessage,
    setTypingUser,
    updateConversationLastMessage,
    setConversations,
    updateUserPresence,
  } = useChat();

  const activeConversationRef = useRef(activeConversation);
  activeConversationRef.current = activeConversation;

  useEffect(() => {
    const handleMessageSent = (message: Message) => {
      if (message.senderId !== session?.user?.id) {
        updateUserPresence(message.senderId, true);
      }

      if (activeConversationRef.current?.id === message.conversationId) {
        addMessage(message);
      }
      updateConversationLastMessage(message.conversationId, message);

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === message.conversationId && message.senderId !== session?.user?.id) {
            const isActive = activeConversationRef.current?.id === message.conversationId;
            return { ...c, unreadCount: isActive ? 0 : c.unreadCount + 1 };
          }
          return c;
        }),
      );

      if (
        message.senderId !== session?.user?.id &&
        activeConversationRef.current?.id !== message.conversationId
      ) {
        emit("message:delivered", {
          messageId: message.id,
          conversationId: message.conversationId,
        });
      }
    };

    const handleTypingStart = (data: {
      conversationId: string;
      userId: string;
      username: string;
    }) => {
      if (data.userId !== session?.user?.id) {
        updateUserPresence(data.userId, true);
        setTypingUser(data.conversationId, data.username, true);
      }
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      if (data.userId !== session?.user?.id) {
        setTypingUser(data.conversationId, "", false);
      }
    };

    const handleNotification = (notification: Parameters<typeof addNotification>[0]) => {
      addNotification(notification);
    };

    const handleFriendOnline = (data: { userId: string }) => {
      updateUserPresence(data.userId, true);
    };

    const handleFriendOffline = (data: { userId: string; lastSeen: string }) => {
      updateUserPresence(data.userId, false, data.lastSeen);
    };

    on("message:sent", handleMessageSent);
    on("typing:start", handleTypingStart);
    on("typing:stop", handleTypingStop);
    on("notification", handleNotification);
    on("friend:online", handleFriendOnline);
    on("friend:offline", handleFriendOffline);

    return () => {
      off("message:sent", handleMessageSent);
      off("typing:start", handleTypingStart);
      off("typing:stop", handleTypingStop);
      off("notification", handleNotification);
      off("friend:online", handleFriendOnline);
      off("friend:offline", handleFriendOffline);
    };
  }, [
    on,
    off,
    emit,
    session?.user?.id,
    addMessage,
    setTypingUser,
    updateConversationLastMessage,
    addNotification,
    updateUserPresence,
  ]);

  useEffect(() => {
    if (!isConnected) return;

    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConversations(data.data.conversations);
        }
      })
      .catch((error) => {
        console.error("Failed to refresh conversations:", error);
      });
  }, [isConnected, setConversations]);
}

/** Socket emit helpers — safe to call from multiple components. */
export function useChatSocket() {
  const { emit, isConnected } = useSocket();

  const joinConversation = useCallback(
    (conversationId: string) => {
      emit("join:conversation", conversationId);
    },
    [emit],
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      emit("leave:conversation", conversationId);
    },
    [emit],
  );

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      emit("message:send", { conversationId, content });
    },
    [emit],
  );

  const startTyping = useCallback(
    (conversationId: string, username: string) => {
      emit("typing:start", { conversationId, username });
    },
    [emit],
  );

  const stopTyping = useCallback(
    (conversationId: string) => {
      emit("typing:stop", { conversationId });
    },
    [emit],
  );

  const markAsRead = useCallback(
    (messageId: string, conversationId: string) => {
      emit("message:read", { messageId, conversationId });
    },
    [emit],
  );

  return {
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    isConnected,
  };
}
