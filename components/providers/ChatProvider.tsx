"use client";

import { createContext, useContext, useState, useCallback, type Dispatch, type SetStateAction } from "react";
import type { Conversation, Message, PublicUser } from "@/types";

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  selectedFriend: PublicUser | null;
  typingUsers: Record<string, string[]>;
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setSelectedFriend: (friend: PublicUser | null) => void;
  setTypingUser: (conversationId: string, username: string, isTyping: boolean) => void;
  updateConversationLastMessage: (conversationId: string, message: Message) => void;
  updateUserPresence: (userId: string, isOnline: boolean, lastSeen?: string | null) => void;
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
  updateUserPresence: () => {},
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

  const updateUserPresence = useCallback(
    (userId: string, isOnline: boolean, lastSeen?: string | null) => {
      const patchUser = (user: PublicUser): PublicUser =>
        user.id === userId
          ? {
              ...user,
              isOnline,
              ...(lastSeen !== undefined ? { lastSeen } : {}),
            }
          : user;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.type === "GROUP" && c.members) {
            const hasMember = c.members.some((m) => m.id === userId);
            if (!hasMember) return c;
            const members = c.members.map((m) => (m.id === userId ? patchUser(m) : m));
            return {
              ...c,
              members,
              onlineCount: members.filter((m) => m.isOnline).length,
            };
          }

          if (c.participant?.id === userId) {
            return { ...c, participant: patchUser(c.participant) };
          }

          return c;
        }),
      );

      setActiveConversation((prev) => {
        if (!prev) return prev;

        if (prev.type === "GROUP" && prev.members) {
          const hasMember = prev.members.some((m) => m.id === userId);
          if (!hasMember) return prev;
          const members = prev.members.map((m) => (m.id === userId ? patchUser(m) : m));
          return {
            ...prev,
            members,
            onlineCount: members.filter((m) => m.isOnline).length,
          };
        }

        if (prev.participant?.id === userId) {
          return { ...prev, participant: patchUser(prev.participant) };
        }

        return prev;
      });

      setSelectedFriend((prev) => (prev && prev.id === userId ? patchUser(prev) : prev));
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
        updateUserPresence,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
