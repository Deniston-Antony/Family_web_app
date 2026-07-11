import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { formatConversationForUser } from "@/lib/conversations";
import { getGroupConversation, isGroupMember } from "@/lib/groups";
import { uploadImageFile } from "@/lib/upload-image";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const member = await isGroupMember(id, user.id);
    if (!member) {
      return apiError("Group not found", 404);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("No file provided", 400);
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return apiError("Invalid file type. Allowed: JPEG, PNG, GIF, WebP", 400);
    }

    if (file.size > 2 * 1024 * 1024) {
      return apiError("File too large. Maximum size is 2MB", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${id}-${Date.now()}.${ext}`;

    const image = await uploadImageFile(buffer, file.type, filename, `groups/${id}`);

    await prisma.conversation.update({
      where: { id },
      data: { image },
    });

    const conversation = await getGroupConversation(id);
    if (!conversation) {
      return apiError("Group not found", 404);
    }

    const formatted = await formatConversationForUser(conversation, user.id);
    return apiSuccess({ conversation: formatted, image });
  } catch (error) {
    return handleApiError(error);
  }
}
