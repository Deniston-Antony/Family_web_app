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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const participation = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId: id, userId: user.id },
      },
    });

    if (!participation) {
      return apiError("Conversation not found", 404);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: { sender: { select: userSelect } },
      orderBy: { createdAt: "asc" },
    });

    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId: id, userId: user.id },
      },
      data: { lastReadAt: new Date() },
    });

    const formatted = messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      sender: {
        ...m.sender,
        lastSeen: m.sender.lastSeen?.toISOString() ?? null,
        createdAt: m.sender.createdAt.toISOString(),
      },
    }));

    return apiSuccess({ messages: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}
