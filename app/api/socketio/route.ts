import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Socket.IO server is running. Connect via WebSocket at /api/socketio",
    status: "ok",
  });
}
