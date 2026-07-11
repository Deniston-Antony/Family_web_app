import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  formatConversationForUser,
  isFriend,
  userSelect,
} from "@/lib/conversations";
import { createGroupSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, memberIds } = createGroupSchema.parse(body);

    const uniqueMemberIds = [...new Set(memberIds)].filter((id) => id !== user.id);
    if (uniqueMemberIds.length === 0) {
      return apiError("Add at least one friend to the group", 400);
    }

    for (const memberId of uniqueMemberIds) {
      const friends = await isFriend(user.id, memberId);
      if (!friends) {
        return apiError("You can only add friends to a group", 403);
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: "GROUP",
        name: name.trim(),
        createdById: user.id,
        participants: {
          create: [{ userId: user.id }, ...uniqueMemberIds.map((id) => ({ userId: id }))],
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
    if (!formatted) {
      return apiError("Failed to create group", 500);
    }

    return apiSuccess({ conversation: formatted }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
