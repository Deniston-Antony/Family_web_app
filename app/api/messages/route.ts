import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { sendMessageSchema } from "@/lib/validations";

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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { conversationId, content } = sendMessageSchema.parse(body);

    const participation = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: user.id },
      },
    });

    if (!participation) {
      return apiError("Conversation not found", 404);
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content.trim(),
        status: "SENT",
      },
      include: { sender: { select: userSelect } },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const formatted = {
      ...message,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      sender: {
        ...message.sender,
        lastSeen: message.sender.lastSeen?.toISOString() ?? null,
        createdAt: message.sender.createdAt.toISOString(),
      },
    };

    return apiSuccess({ message: formatted }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
