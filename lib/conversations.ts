import prisma from "@/lib/prisma";

export const userSelect = {
  id: true,
  name: true,
  username: true,
  profilePicture: true,
  bio: true,
  statusMessage: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
} as const;

type SelectedUser = {
  id: string;
  name: string;
  username: string;
  profilePicture: string | null;
  bio: string | null;
  statusMessage: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
  createdAt: Date;
};

export function formatPublicUser(user: SelectedUser) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture,
    bio: user.bio,
    statusMessage: user.statusMessage,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function isFriend(userId: string, otherUserId: string): Promise<boolean> {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: userId, user2Id: otherUserId },
        { user1Id: otherUserId, user2Id: userId },
      ],
    },
  });

  return !!friendship;
}

export async function getUnreadCount(
  conversationId: string,
  userId: string,
  lastReadAt: Date | null,
): Promise<number> {
  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
    },
  });
}

type ConversationWithRelations = {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  createdById: string | null;
  updatedAt: Date;
  participants: Array<{
    userId: string;
    lastReadAt: Date | null;
    user: SelectedUser;
  }>;
  messages: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    status: "SENT" | "DELIVERED" | "READ";
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
    sender: SelectedUser;
  }>;
};

export async function formatConversationForUser(
  conversation: ConversationWithRelations,
  userId: string,
) {
  const participation = conversation.participants.find((p) => p.userId === userId);
  if (!participation) return null;

  const unreadCount = await getUnreadCount(
    conversation.id,
    userId,
    participation.lastReadAt,
  );

  const lastMessage = conversation.messages[0] ?? null;

  const base = {
    id: conversation.id,
    type: conversation.type,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          conversationId: lastMessage.conversationId,
          senderId: lastMessage.senderId,
          content: lastMessage.content,
          status: lastMessage.status,
          isEdited: lastMessage.isEdited,
          createdAt: lastMessage.createdAt.toISOString(),
          updatedAt: lastMessage.updatedAt.toISOString(),
          sender: formatPublicUser(lastMessage.sender),
        }
      : null,
    unreadCount,
    updatedAt: conversation.updatedAt.toISOString(),
  };

  if (conversation.type === "GROUP") {
    const members = conversation.participants
      .map((p) => formatPublicUser(p.user))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      ...base,
      name: conversation.name,
      createdById: conversation.createdById,
      members,
      memberCount: members.length,
      onlineCount: members.filter((m) => m.isOnline).length,
    };
  }

  const otherParticipant = conversation.participants.find((p) => p.userId !== userId);
  if (!otherParticipant) return null;

  return {
    ...base,
    participant: formatPublicUser(otherParticipant.user),
  };
}
