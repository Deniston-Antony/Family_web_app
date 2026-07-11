import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { editMessageSchema } from "@/lib/validations";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { content } = editMessageSchema.parse(body);

    const message = await prisma.message.findUnique({ where: { id } });

    if (!message) {
      return apiError("Message not found", 404);
    }

    if (message.senderId !== user.id) {
      return apiError("You can only edit your own messages", 403);
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { content: content.trim(), isEdited: true },
      include: { sender: { select: userSelect } },
    });

    return apiSuccess({
      message: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        sender: {
          ...updated.sender,
          lastSeen: updated.sender.lastSeen?.toISOString() ?? null,
          createdAt: updated.sender.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const message = await prisma.message.findUnique({ where: { id } });

    if (!message) {
      return apiError("Message not found", 404);
    }

    if (message.senderId !== user.id) {
      return apiError("You can only delete your own messages", 403);
    }

    await prisma.message.delete({ where: { id } });

    return apiSuccess({ messageId: id, conversationId: message.conversationId });
  } catch (error) {
    return handleApiError(error);
  }
}
