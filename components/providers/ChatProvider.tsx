"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Conversation, Message, PublicUser } from "@/types";

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  selectedFriend: PublicUser | null;
  typingUsers: Record<string, string[]>;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setSelectedFriend: (friend: PublicUser | null) => void;
  setTypingUser: (conversationId: string, username: string, isTyping: boolean) => void;
  updateConversationLastMessage: (conversationId: string, message: Message) => void;
}

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  activeConversation: null,
  messages: [],
  selectedFriend: null,
  typingUsers: {},
  setConversations: () => {},
  setActiveConversation: () => {},
  setMessages: () => {},
  addMessage: () => {},
  updateMessage: () => {},
  removeMessage: () => {},
  setSelectedFriend: () => {},
  setTypingUser: () => {},
  updateConversationLastMessage: () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<PublicUser | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const updateMessage = useCallback((message: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const setTypingUser = useCallback(
    (conversationId: string, username: string, isTyping: boolean) => {
      setTypingUsers((prev) => {
        const current = prev[conversationId] ?? [];
        if (isTyping) {
          if (current.includes(username)) return prev;
          return { ...prev, [conversationId]: [...current, username] };
        }
        return {
          ...prev,
          [conversationId]: current.filter((u) => u !== username),
        };
      });
    },
    [],
  );

  const updateConversationLastMessage = useCallback(
    (conversationId: string, message: Message) => {
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: message, updatedAt: message.createdAt }
              : c,
          )
          .sort((a, b) => {
            const aTime = a.lastMessage?.createdAt ?? a.updatedAt;
            const bTime = b.lastMessage?.createdAt ?? b.updatedAt;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          }),
      );
    },
    [],
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        selectedFriend,
        typingUsers,
        setConversations,
        setActiveConversation,
        setMessages,
        addMessage,
        updateMessage,
        removeMessage,
        setSelectedFriend,
        setTypingUser,
        updateConversationLastMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
