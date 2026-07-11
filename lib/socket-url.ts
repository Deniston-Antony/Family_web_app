/** Resolve the Socket.IO server URL on the client (same origin on Render). */
export function getClientSocketUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3000";
}
