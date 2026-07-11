import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { loginSchema } from "@/lib/validations";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const rateLimit = checkRateLimit(email.toLowerCase());
    if (!rateLimit.allowed) {
      return apiError(`Too many login attempts. Try again in ${rateLimit.retryAfter} seconds.`, 429);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        password: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      recordFailedAttempt(email.toLowerCase());
      return apiError("Invalid email or password", 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      recordFailedAttempt(email.toLowerCase());
      return apiError("Invalid email or password", 401);
    }

    return apiSuccess({ requires2FA: user.twoFactorEnabled });
  } catch (error) {
    return handleApiError(error);
  }
}
