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

    const requests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { receiverId: user.id, status: "PENDING" },
          { senderId: user.id, status: "PENDING" },
        ],
      },
      include: {
        sender: { select: userSelect },
        receiver: { select: userSelect },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = requests.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      sender: {
        ...r.sender,
        lastSeen: r.sender.lastSeen?.toISOString() ?? null,
        createdAt: r.sender.createdAt.toISOString(),
      },
      receiver: {
        ...r.receiver,
        lastSeen: r.receiver.lastSeen?.toISOString() ?? null,
        createdAt: r.receiver.createdAt.toISOString(),
      },
    }));

    return apiSuccess({ requests: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { requestId, action } = await request.json();

    if (!requestId || !["accept", "reject", "cancel"].includes(action)) {
      return apiError("Invalid request", 400);
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: { select: userSelect },
        receiver: { select: userSelect },
      },
    });

    if (!friendRequest || friendRequest.status !== "PENDING") {
      return apiError("Friend request not found", 404);
    }

    if (action === "accept") {
      if (friendRequest.receiverId !== user.id) {
        return apiError("Unauthorized", 403);
      }

      const [updatedRequest, friendship] = await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: "ACCEPTED" },
        }),
        prisma.friendship.create({
          data: {
            user1Id: friendRequest.senderId,
            user2Id: friendRequest.receiverId,
          },
        }),
      ]);

      const friend =
        friendRequest.senderId === user.id ? friendRequest.receiver : friendRequest.sender;

      return apiSuccess({
        request: updatedRequest,
        friendship: {
          id: friendship.id,
          friend: {
            ...friend,
            lastSeen: friend.lastSeen?.toISOString() ?? null,
            createdAt: friend.createdAt.toISOString(),
          },
          createdAt: friendship.createdAt.toISOString(),
        },
      });
    }

    if (action === "reject") {
      if (friendRequest.receiverId !== user.id) {
        return apiError("Unauthorized", 403);
      }

      const updated = await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });

      return apiSuccess({ request: updated });
    }

    // cancel
    if (friendRequest.senderId !== user.id) {
      return apiError("Unauthorized", 403);
    }

    const updated = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });

    return apiSuccess({ request: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
