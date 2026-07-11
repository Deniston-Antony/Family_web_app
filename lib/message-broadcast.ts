import prisma from "@/lib/prisma";
import { getIO } from "@/socket/index";
import type { Message } from "@/types";

export async function broadcastMessage(
  message: Message,
  senderId: string,
  content: string,
): Promise<void> {
  const io = getIO();
  if (!io) return;

  io.to(`conversation:${message.conversationId}`).emit("message:sent", message);

  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId: message.conversationId, userId: { not: senderId } },
  });

  for (const participant of participants) {
    io.to(`user:${participant.userId}`).emit("notification", {
      id: `msg-${message.id}`,
      type: "message",
      title: message.sender?.name ?? "New message",
      message: content.slice(0, 100),
      data: { conversationId: message.conversationId, messageId: message.id },
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}
