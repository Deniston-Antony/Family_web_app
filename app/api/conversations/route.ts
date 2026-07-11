import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const userSelect = {
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

export async function GET() {
  try {
    const user = await requireAuth();

    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: userSelect } },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: { select: userSelect } },
            },
          },
        },
      },
    });

    const conversations = await Promise.all(
      participations.map(async (p) => {
        const otherParticipant = p.conversation.participants.find(
          (part) => part.userId !== user.id,
        );
        if (!otherParticipant) return null;

        const lastMessage = p.conversation.messages[0] ?? null;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: p.conversation.id,
            senderId: { not: user.id },
            ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
          },
        });

        return {
          id: p.conversation.id,
          participant: {
            ...otherParticipant.user,
            lastSeen: otherParticipant.user.lastSeen?.toISOString() ?? null,
            createdAt: otherParticipant.user.createdAt.toISOString(),
          },
          lastMessage: lastMessage
            ? {
                ...lastMessage,
                createdAt: lastMessage.createdAt.toISOString(),
                updatedAt: lastMessage.updatedAt.toISOString(),
                sender: lastMessage.sender
                  ? {
                      ...lastMessage.sender,
                      lastSeen: lastMessage.sender.lastSeen?.toISOString() ?? null,
                      createdAt: lastMessage.sender.createdAt.toISOString(),
                    }
                  : undefined,
              }
            : null,
          unreadCount,
          updatedAt: p.conversation.updatedAt.toISOString(),
        };
      }),
    );

    const filtered = conversations
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = a!.lastMessage?.createdAt ?? a!.updatedAt;
        const bTime = b!.lastMessage?.createdAt ?? b!.updatedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

    return apiSuccess({ conversations: filtered });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { friendId } = await request.json();

    if (!friendId) {
      return apiError("Friend ID is required", 400);
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: friendId },
          { user1Id: friendId, user2Id: user.id },
        ],
      },
    });

    if (!friendship) {
      return apiError("You can only message friends", 403);
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: [user.id, friendId] },
          },
        },
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: friendId } } },
        ],
      },
      include: {
        participants: { include: { user: { select: userSelect } } },
      },
    });

    if (existing) {
      const other = existing.participants.find((p) => p.userId !== user.id);
      return apiSuccess({
        conversation: {
          id: existing.id,
          participant: other
            ? {
                ...other.user,
                lastSeen: other.user.lastSeen?.toISOString() ?? null,
                createdAt: other.user.createdAt.toISOString(),
              }
            : null,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: existing.updatedAt.toISOString(),
        },
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: user.id }, { userId: friendId }],
        },
      },
      include: {
        participants: { include: { user: { select: userSelect } } },
      },
    });

    const other = conversation.participants.find((p) => p.userId !== user.id);

    return apiSuccess(
      {
        conversation: {
          id: conversation.id,
          participant: other
            ? {
                ...other.user,
                lastSeen: other.user.lastSeen?.toISOString() ?? null,
                createdAt: other.user.createdAt.toISOString(),
              }
            : null,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: conversation.updatedAt.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
