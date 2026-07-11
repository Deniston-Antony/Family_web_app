import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations";
import { normalizeUsername } from "@/lib/utils";

const userSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  profilePicture: true,
  bio: true,
  statusMessage: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET() {
  try {
    const sessionUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: userSelect,
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    return apiSuccess({
      user: {
        ...user,
        lastSeen: user.lastSeen?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const body = await request.json();

    if (body.action === "changePassword") {
      const data = changePasswordSchema.parse(body);
      const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });

      if (!user) {
        return apiError("User not found", 404);
      }

      const isValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isValid) {
        return apiError("Current password is incorrect", 400);
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 12);
      await prisma.user.update({
        where: { id: sessionUser.id },
        data: { password: hashedPassword },
      });

      return apiSuccess({ message: "Password updated successfully" });
    }

    const data = updateProfileSchema.parse(body);

    if (data.username) {
      const username = normalizeUsername(data.username);
      const existing = await prisma.user.findFirst({
        where: { username, id: { not: sessionUser.id } },
      });
      if (existing) {
        return apiError("Username already taken", 409);
      }
      data.username = username;
    }

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.username && { username: data.username }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.statusMessage !== undefined && { statusMessage: data.statusMessage }),
        ...(body.profilePicture !== undefined && { profilePicture: body.profilePicture }),
      },
      select: userSelect,
    });

    return apiSuccess({
      user: {
        ...user,
        lastSeen: user.lastSeen?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
