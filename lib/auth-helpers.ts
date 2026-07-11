import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-response";

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) {
    throw new AuthError();
  }
  return user;
}

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export function unauthorizedResponse() {
  return apiError("Unauthorized", 401);
}
