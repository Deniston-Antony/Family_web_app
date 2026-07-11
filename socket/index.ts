import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import prisma from "@/lib/prisma";
import type { Message } from "@/types";

const onlineUsers = new Map<string, Set<string>>();

export function initializeSocket(server: HttpServer) {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socketio",
  });

  io.on("connection", async (socket) => {
    const userId = socket.handshake.auth.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() },
    });

    socket.join(`user:${userId}`);
    io.emit("user:connected", { userId });
    io.emit("friend:online", { userId });

    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("message:send", async (data: { conversationId: string; content: string }) => {
      try {
        const participation = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId: data.conversationId,
              userId,
            },
          },
        });

        if (!participation) return;

        const message = await prisma.message.create({
          data: {
            conversationId: data.conversationId,
            senderId: userId,
            content: data.content.trim(),
            status: "SENT",
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                profilePicture: true,
                bio: true,
                statusMessage: true,
                isOnline: true,
                lastSeen: true,
                createdAt: true,
              },
            },
          },
        });

        await prisma.conversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() },
        });

        const formatted: Message = {
          ...message,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
          sender: {
            ...message.sender,
            lastSeen: message.sender.lastSeen?.toISOString() ?? null,
            createdAt: message.sender.createdAt.toISOString(),
          },
        };

        io.to(`conversation:${data.conversationId}`).emit("message:sent", formatted);

        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId: data.conversationId, userId: { not: userId } },
        });

        for (const p of participants) {
          io.to(`user:${p.userId}`).emit("notification", {
            id: `msg-${message.id}`,
            type: "message",
            title: message.sender.name,
            message: data.content.slice(0, 100),
            data: { conversationId: data.conversationId, messageId: message.id },
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
      } catch (error) {
        console.error("Socket message:send error:", error);
      }
    });

    socket.on("message:delivered", async (data: { messageId: string; conversationId: string }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: data.messageId } });
        if (!message || message.senderId === userId) return;

        if (message.status === "SENT") {
          await prisma.message.update({
            where: { id: data.messageId },
            data: { status: "DELIVERED" },
          });
        }

        io.to(`conversation:${data.conversationId}`).emit("message:delivered", {
          messageId: data.messageId,
          conversationId: data.conversationId,
        });
      } catch (error) {
        console.error("Socket message:delivered error:", error);
      }
    });

    socket.on("message:read", async (data: { messageId: string; conversationId: string }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: data.messageId } });
        if (!message || message.senderId === userId) return;

        await prisma.message.update({
          where: { id: data.messageId },
          data: { status: "READ" },
        });

        await prisma.conversationParticipant.update({
          where: {
            conversationId_userId: {
              conversationId: data.conversationId,
              userId,
            },
          },
          data: { lastReadAt: new Date() },
        });

        io.to(`conversation:${data.conversationId}`).emit("message:read", {
          messageId: data.messageId,
          conversationId: data.conversationId,
          readBy: userId,
        });
      } catch (error) {
        console.error("Socket message:read error:", error);
      }
    });

    socket.on("typing:start", (data: { conversationId: string; username: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        conversationId: data.conversationId,
        userId,
        username: data.username,
      });
    });

    socket.on("typing:stop", (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        conversationId: data.conversationId,
        userId,
      });
    });

    socket.on("disconnect", async () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          const lastSeen = new Date();
          await prisma.user.update({
            where: { id: userId },
            data: { isOnline: false, lastSeen },
          });
          io.emit("user:disconnected", { userId });
          io.emit("friend:offline", { userId, lastSeen: lastSeen.toISOString() });
        }
      }
    });
  });

  return io;
}

export function getIO() {
  return globalThis.io as SocketServer | undefined;
}

export function setIO(io: SocketServer) {
  globalThis.io = io;
}

declare global {
  // eslint-disable-next-line no-var
  var io: SocketServer | undefined;
}
