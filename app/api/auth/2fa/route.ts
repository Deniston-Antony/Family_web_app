import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  disableTwoFactorSchema,
  enableTwoFactorSchema,
} from "@/lib/validations";
import {
  encryptTwoFactorSecret,
  generateQrCodeDataUrl,
  generateTwoFactorSecret,
  getOtpAuthUrl,
  verifyStoredTotpCode,
  verifyTotpCode,
} from "@/lib/two-factor";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await requireAuth();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    });

    return apiSuccess({ enabled: dbUser?.twoFactorEnabled ?? false });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const body = await request.json();
    const action = body.action as string;

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        password: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!dbUser) {
      return apiError("User not found", 404);
    }

    if (action === "setup") {
      if (dbUser.twoFactorEnabled) {
        return apiError("Two-factor authentication is already enabled", 400);
      }

      const secret = generateTwoFactorSecret();
      const otpAuthUrl = getOtpAuthUrl(dbUser.email, secret);
      const qrCodeDataUrl = await generateQrCodeDataUrl(otpAuthUrl);

      return apiSuccess({
        secret,
        qrCodeDataUrl,
        manualEntryKey: secret,
      });
    }

    if (action === "enable") {
      if (dbUser.twoFactorEnabled) {
        return apiError("Two-factor authentication is already enabled", 400);
      }

      const { secret, code } = enableTwoFactorSchema.parse(body);
      if (!verifyTotpCode(secret, code)) {
        return apiError("Invalid verification code", 400);
      }

      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: encryptTwoFactorSecret(secret),
        },
      });

      return apiSuccess({ message: "Two-factor authentication enabled" });
    }

    if (action === "disable") {
      if (!dbUser.twoFactorEnabled || !dbUser.twoFactorSecret) {
        return apiError("Two-factor authentication is not enabled", 400);
      }

      const { password, code } = disableTwoFactorSchema.parse(body);
      const passwordValid = await bcrypt.compare(password, dbUser.password);
      if (!passwordValid) {
        return apiError("Password is incorrect", 400);
      }

      if (!verifyStoredTotpCode(dbUser.twoFactorSecret, code)) {
        return apiError("Invalid verification code", 400);
      }

      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      return apiSuccess({ message: "Two-factor authentication disabled" });
    }

    return apiError("Invalid action", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
