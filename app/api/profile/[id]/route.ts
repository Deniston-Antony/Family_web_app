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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: id },
          { user1Id: id, user2Id: user.id },
        ],
      },
    });

    if (!friendship && id !== user.id) {
      return apiError("User not found", 404);
    }

    const profile = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!profile) {
      return apiError("User not found", 404);
    }

    return apiSuccess({
      profile: {
        ...profile,
        lastSeen: profile.lastSeen?.toISOString() ?? null,
        createdAt: profile.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
