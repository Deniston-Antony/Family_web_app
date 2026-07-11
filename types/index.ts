import { DefaultSession } from "next-auth";

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  profilePicture: string | null;
  bio: string | null;
  statusMessage: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  twoFactorEnabled?: boolean;
  createdAt?: string;
}

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  profilePicture: string | null;
  bio: string | null;
  statusMessage: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  sender?: PublicUser;
  receiver?: PublicUser;
}

export interface Friendship {
  id: string;
  friend: PublicUser;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: "SENT" | "DELIVERED" | "READ";
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: PublicUser;
}

export interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP";
  name?: string | null;
  createdById?: string | null;
  participant?: PublicUser;
  members?: PublicUser[];
  memberCount?: number;
  onlineCount?: number;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: "message" | "friend_request" | "friend_accepted";
  title: string;
  message: string;
  data?: Record<string, string>;
  createdAt: string;
  read: boolean;
}

export type SocketEvents = {
  "user:connected": { userId: string };
  "user:disconnected": { userId: string };
  "message:sent": Message;
  "message:delivered": { messageId: string; conversationId: string };
  "message:read": { messageId: string; conversationId: string; readBy?: string };
  "typing:start": { conversationId: string; userId: string; username: string };
  "typing:stop": { conversationId: string; userId: string };
  "friend:online": { userId: string };
  "friend:offline": { userId: string; lastSeen: string };
  "friend:request": FriendRequest;
  "friend:accepted": { friendshipId: string; friend: PublicUser };
  notification: Notification;
};

export type ClientEmitEvents = {
  "join:conversation": string;
  "leave:conversation": string;
  "message:send": { conversationId: string; content: string };
  "message:delivered": { messageId: string; conversationId: string };
  "message:read": { messageId: string; conversationId: string };
  "typing:start": { conversationId: string; username: string };
  "typing:stop": { conversationId: string };
};

declare module "next-auth" {
  interface Session {
    user: User & DefaultSession["user"];
  }
}
