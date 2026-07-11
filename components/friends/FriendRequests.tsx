"use client";

import { useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FriendSkeleton } from "@/components/ui/Skeleton";
import { useFriends } from "@/hooks/useFriends";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";

export function FriendRequests() {
  const { data: session } = useSession();
  const { requests, loading, acceptRequest, rejectRequest, cancelRequest } = useFriends();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const received = pendingRequests.filter((r) => r.receiverId === session?.user?.id);
  const sent = pendingRequests.filter((r) => r.senderId === session?.user?.id);

  const handleAction = async (id: string, action: "accept" | "reject" | "cancel") => {
    setActionLoading(id);
    try {
      if (action === "accept") await acceptRequest(id);
      else if (action === "reject") await rejectRequest(id);
      else await cancelRequest(id);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <FriendSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <EmptyState
        icon="friends"
        title="No pending requests"
        description="Friend requests you send or receive will appear here"
      />
    );
  }

  return (
    <div className="space-y-6 p-4">
      {received.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Received ({received.length})
          </h3>
          <div className="space-y-2">
            {received.map((request) => (
              <div key={request.id} className="glass-card flex items-center gap-3 p-3">
                <Avatar
                  src={request.sender?.profilePicture}
                  name={request.sender?.name ?? "User"}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{request.sender?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    @{request.sender?.username} ·{" "}
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="primary"
                    loading={actionLoading === request.id}
                    onClick={() => handleAction(request.id, "accept")}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleAction(request.id, "reject")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sent ({sent.length})
          </h3>
          <div className="space-y-2">
            {sent.map((request) => (
              <div key={request.id} className="glass-card flex items-center gap-3 p-3">
                <Avatar
                  src={request.receiver?.profilePicture}
                  name={request.receiver?.name ?? "User"}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{request.receiver?.name}</p>
                  <p className="text-xs text-muted-foreground">@{request.receiver?.username}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  loading={actionLoading === request.id}
                  onClick={() => handleAction(request.id, "cancel")}
                >
                  <Clock className="h-3 w-3" /> Cancel
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
