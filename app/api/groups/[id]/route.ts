import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  formatConversationForUser,
  isFriend,
} from "@/lib/conversations";
import {
  addGroupMembersSchema,
  removeGroupMemberSchema,
  updateGroupNameSchema,
} from "@/lib/validations";
import { getGroupConversation, isGroupMember } from "@/lib/groups";

async function getUpdatedGroup(conversationId: string, userId: string) {
  const conversation = await getGroupConversation(conversationId);
  if (!conversation) return null;
  return formatConversationForUser(conversation, userId);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const action = body.action as string;

    const member = await isGroupMember(id, user.id);
    if (!member) {
      return apiError("Group not found", 404);
    }

    const group = await getGroupConversation(id);
    if (!group) {
      return apiError("Group not found", 404);
    }

    if (action === "updateName") {
      const { name } = updateGroupNameSchema.parse(body);
      await prisma.conversation.update({
        where: { id },
        data: { name: name.trim() },
      });
    } else if (action === "addMembers") {
      const { memberIds } = addGroupMembersSchema.parse(body);
      const existingIds = new Set(group.participants.map((p) => p.userId));
      const uniqueIds = [...new Set(memberIds)].filter(
        (memberId) => memberId !== user.id && !existingIds.has(memberId),
      );

      if (uniqueIds.length === 0) {
        return apiError("Selected friends are already in the group", 400);
      }

      for (const memberId of uniqueIds) {
        const friends = await isFriend(user.id, memberId);
        if (!friends) {
          return apiError("You can only add friends to a group", 403);
        }
      }

      await prisma.conversationParticipant.createMany({
        data: uniqueIds.map((memberId) => ({
          conversationId: id,
          userId: memberId,
        })),
      });
    } else if (action === "removeMember") {
      const { memberId } = removeGroupMemberSchema.parse(body);

      if (!group.participants.some((p) => p.userId === memberId)) {
        return apiError("Member not found in this group", 404);
      }

      const isSelf = memberId === user.id;
      const isCreator = group.createdById === user.id;

      if (!isSelf && !isCreator) {
        return apiError("Only the group creator can remove other members", 403);
      }

      if (group.participants.length <= 2) {
        return apiError("A group must have at least 2 members", 400);
      }

      await prisma.conversationParticipant.delete({
        where: {
          conversationId_userId: {
            conversationId: id,
            userId: memberId,
          },
        },
      });

      if (isSelf) {
        return apiSuccess({ conversation: null, left: true });
      }
    } else {
      return apiError("Invalid action", 400);
    }

    const conversation = await getUpdatedGroup(id, user.id);
    if (!conversation) {
      return apiError("Failed to update group", 500);
    }

    return apiSuccess({ conversation });
  } catch (error) {
    return handleApiError(error);
  }
}
