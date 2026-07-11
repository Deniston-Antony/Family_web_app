const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = parseInt(process.env.LOGIN_RATE_LIMIT_MAX ?? "5", 10);
const WINDOW_MS = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? "900000", 10);

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now > record.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count += 1;
  return { allowed: true };
}

export function resetRateLimit(identifier: string) {
  loginAttempts.delete(identifier);
}

export function recordFailedAttempt(identifier: string) {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now > record.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    record.count += 1;
  }
}
