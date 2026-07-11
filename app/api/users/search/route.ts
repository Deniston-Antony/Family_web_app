import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { searchSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const { query } = searchSchema.parse({ query: searchParams.get("q") ?? "" });

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: user.id } },
          {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        profilePicture: true,
        bio: true,
        statusMessage: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
      take: 20,
      orderBy: { name: "asc" },
    });

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
    });

    const friendIds = new Set(
      friendships.map((f) => (f.user1Id === user.id ? f.user2Id : f.user1Id)),
    );

    const pendingRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: user.id, status: "PENDING" },
          { receiverId: user.id, status: "PENDING" },
        ],
      },
    });

    const pendingUserIds = new Set(
      pendingRequests.map((r) => (r.senderId === user.id ? r.receiverId : r.senderId)),
    );

    const results = users.map((u) => {
      const pending = pendingRequests.find(
        (r) =>
          (r.senderId === user.id && r.receiverId === u.id) ||
          (r.receiverId === user.id && r.senderId === u.id),
      );

      return {
        ...u,
        lastSeen: u.lastSeen?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        isFriend: friendIds.has(u.id),
        hasPendingRequest: pendingUserIds.has(u.id),
        requestDirection: pending
          ? pending.senderId === user.id
            ? ("sent" as const)
            : ("received" as const)
          : null,
      };
    });

    return apiSuccess({ users: results });
  } catch (error) {
    return handleApiError(error);
  }
}
