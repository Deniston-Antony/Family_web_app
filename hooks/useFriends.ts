"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/components/providers/SocketProvider";
import type { Friendship, FriendRequest } from "@/types";

export function useFriends() {
  const { data: session } = useSession();
  const { on, off, isConnected } = useSocket();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setFriends(
        [...data.data.friends].sort((a: Friendship, b: Friendship) =>
          a.friend.name.localeCompare(b.friend.name),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load friends");
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/requests");
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setRequests(data.data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchRequests()]);
    setLoading(false);
  }, [fetchFriends, fetchRequests]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const markOnline = (userId: string) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.friend.id === userId ? { ...f, friend: { ...f.friend, isOnline: true } } : f,
        ),
      );
    };

    const handleFriendOnline = ({ userId }: { userId: string }) => {
      markOnline(userId);
    };

    const handleFriendOffline = ({ userId, lastSeen }: { userId: string; lastSeen: string }) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.friend.id === userId
            ? { ...f, friend: { ...f.friend, isOnline: false, lastSeen } }
            : f,
        ),
      );
    };

    const handleTypingStart = ({ userId }: { userId: string }) => {
      markOnline(userId);
    };

    const handleMessageSent = ({ senderId }: { senderId: string }) => {
      if (senderId !== session?.user?.id) {
        markOnline(senderId);
      }
    };

    on("friend:online", handleFriendOnline);
    on("friend:offline", handleFriendOffline);
    on("typing:start", handleTypingStart);
    on("message:sent", handleMessageSent);

    return () => {
      off("friend:online", handleFriendOnline);
      off("friend:offline", handleFriendOffline);
      off("typing:start", handleTypingStart);
      off("message:sent", handleMessageSent);
    };
  }, [on, off, session?.user?.id]);

  useEffect(() => {
    if (isConnected) {
      fetchFriends();
    }
  }, [isConnected, fetchFriends]);

  const sendRequest = async (receiverId: string) => {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId }),
    });
    const data = await res.json();
    if (!data.success) {
      // Treat duplicate pending request as a no-op — UI may be stale
      if (res.status === 409 && data.error === "Friend request already exists") {
        await fetchRequests();
        return { alreadyExists: true as const };
      }
      throw new Error(data.error);
    }
    await fetchRequests();
    return data.data;
  };

  const handleRequest = async (requestId: string, action: "accept" | "reject" | "cancel") => {
    const res = await fetch("/api/friends/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    await refresh();
    return data.data;
  };

  return {
    friends,
    requests,
    loading,
    error,
    refresh,
    sendRequest,
    acceptRequest: (id: string) => handleRequest(id, "accept"),
    rejectRequest: (id: string) => handleRequest(id, "reject"),
    cancelRequest: (id: string) => handleRequest(id, "cancel"),
  };
}
