"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatLastSeen } from "@/lib/utils";
import { Calendar, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import type { PublicUser } from "@/types";

interface FriendDetailsProps {
  friend: PublicUser | null;
  onMessage: (friend: PublicUser) => void;
}

export function FriendDetails({ friend, onMessage }: FriendDetailsProps) {
  if (!friend) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <div className="mx-auto mb-4 rounded-full bg-muted p-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-muted-foreground">Select a friend</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a friend to view their profile details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col items-center text-center">
        <Avatar
          src={friend.profilePicture}
          name={friend.name}
          size="xl"
          showOnline
          isOnline={friend.isOnline}
        />
        <h2 className="mt-4 text-xl font-bold">{friend.name}</h2>
        <p className="text-sm text-muted-foreground">@{friend.username}</p>

        <div className="mt-2">
          {friend.isOnline ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Online
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Last seen {formatLastSeen(friend.lastSeen)}
            </span>
          )}
        </div>

        {friend.statusMessage && (
          <p className="mt-3 text-sm italic text-muted-foreground">
            &ldquo;{friend.statusMessage}&rdquo;
          </p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {friend.bio && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bio
            </h3>
            <p className="mt-1 text-sm">{friend.bio}</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Joined {format(new Date(friend.createdAt), "MMMM yyyy")}</span>
        </div>

        <Button className="w-full" onClick={() => onMessage(friend)}>
          <MessageCircle className="h-4 w-4" />
          Send Message
        </Button>
      </div>
    </div>
  );
}
