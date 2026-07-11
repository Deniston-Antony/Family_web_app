import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth-helpers";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return apiError("Unauthorized", 401);
  }
  if (error instanceof ZodError) {
    return apiError(error.errors[0]?.message ?? "Validation error", 400);
  }
  if (error instanceof Error) {
    console.error("API Error:", error.message);
    return apiError(error.message, 500);
  }
  console.error("Unknown API Error:", error);
  return apiError("Internal server error", 500);
}
