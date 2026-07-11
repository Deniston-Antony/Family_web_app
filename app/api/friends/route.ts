import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { friendRequestSchema } from "@/lib/validations";

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

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
      include: {
        user1: { select: userSelect },
        user2: { select: userSelect },
      },
      orderBy: { createdAt: "desc" },
    });

    const friends = friendships.map((f) => {
      const friend = f.user1Id === user.id ? f.user2 : f.user1;
      return {
        id: f.id,
        friend: {
          ...friend,
          lastSeen: friend.lastSeen?.toISOString() ?? null,
          createdAt: friend.createdAt.toISOString(),
        },
        createdAt: f.createdAt.toISOString(),
      };
    });

    return apiSuccess({ friends });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { receiverId } = friendRequestSchema.parse(body);

    if (receiverId === user.id) {
      return apiError("Cannot send friend request to yourself", 400);
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return apiError("User not found", 404);
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: receiverId },
          { user1Id: receiverId, user2Id: user.id },
        ],
      },
    });

    if (existingFriendship) {
      return apiError("Already friends with this user", 409);
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId, status: "PENDING" },
          { senderId: receiverId, receiverId: user.id, status: "PENDING" },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.senderId === user.id && existingRequest.status === "PENDING") {
        const friendRequest = await prisma.friendRequest.findUnique({
          where: { id: existingRequest.id },
          include: {
            sender: { select: userSelect },
            receiver: { select: userSelect },
          },
        });
        if (friendRequest) {
          return apiSuccess({
            request: {
              ...friendRequest,
              createdAt: friendRequest.createdAt.toISOString(),
              updatedAt: friendRequest.updatedAt.toISOString(),
              sender: {
                ...friendRequest.sender,
                lastSeen: friendRequest.sender.lastSeen?.toISOString() ?? null,
                createdAt: friendRequest.sender.createdAt.toISOString(),
              },
              receiver: {
                ...friendRequest.receiver,
                lastSeen: friendRequest.receiver.lastSeen?.toISOString() ?? null,
                createdAt: friendRequest.receiver.createdAt.toISOString(),
              },
            },
            alreadyExists: true,
          });
        }
      }
      return apiError("Friend request already exists", 409);
    }

    const friendRequest = await prisma.friendRequest.create({
      data: { senderId: user.id, receiverId },
      include: {
        sender: { select: userSelect },
        receiver: { select: userSelect },
      },
    });

    return apiSuccess(
      {
        request: {
          ...friendRequest,
          createdAt: friendRequest.createdAt.toISOString(),
          updatedAt: friendRequest.updatedAt.toISOString(),
          sender: {
            ...friendRequest.sender,
            lastSeen: friendRequest.sender.lastSeen?.toISOString() ?? null,
            createdAt: friendRequest.sender.createdAt.toISOString(),
          },
          receiver: {
            ...friendRequest.receiver,
            lastSeen: friendRequest.receiver.lastSeen?.toISOString() ?? null,
            createdAt: friendRequest.receiver.createdAt.toISOString(),
          },
        },
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
