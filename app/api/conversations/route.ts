import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { formatConversationForUser, isFriend, userSelect } from "@/lib/conversations";

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

    const conversations = (
      await Promise.all(
        participations.map((p) => formatConversationForUser(p.conversation, user.id)),
      )
    )
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = a!.lastMessage?.createdAt ?? a!.updatedAt;
        const bTime = b!.lastMessage?.createdAt ?? b!.updatedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

    return apiSuccess({ conversations });
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

    if (friendId === user.id) {
      return apiError("You cannot message yourself", 400);
    }

    const friends = await isFriend(user.id, friendId);
    if (!friends) {
      return apiError("You can only message friends", 403);
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
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
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: userSelect } },
        },
      },
    });

    if (existing) {
      const formatted = await formatConversationForUser(existing, user.id);
      return apiSuccess({ conversation: formatted });
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        participants: {
          create: [{ userId: user.id }, { userId: friendId }],
        },
      },
      include: {
        participants: { include: { user: { select: userSelect } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: userSelect } },
        },
      },
    });

    const formatted = await formatConversationForUser(conversation, user.id);
    return apiSuccess({ conversation: formatted }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
