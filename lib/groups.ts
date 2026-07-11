import prisma from "@/lib/prisma";
import { userSelect } from "@/lib/conversations";

export const groupConversationInclude = {
  participants: { include: { user: { select: userSelect } } },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { sender: { select: userSelect } },
  },
};

export async function getGroupConversation(conversationId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, type: "GROUP" },
    include: groupConversationInclude,
  });
}

export async function isGroupMember(conversationId: string, userId: string) {
  const participation = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
  return !!participation;
}
