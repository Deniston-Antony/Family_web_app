"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/Avatar";
import { formatLastSeen } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

export function ProfilePanel() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(session?.user);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setProfile(d.data.user);
        });
    }
  }, [session?.user]);

  if (!profile) return null;

  return (
    <div className="p-6">
      <div className="flex flex-col items-center text-center">
        <Avatar
          src={profile.profilePicture}
          name={profile.name ?? "User"}
          size="xl"
          showOnline
          isOnline
        />
        <h2 className="mt-4 text-xl font-bold">{profile.name}</h2>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.statusMessage && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            &ldquo;{profile.statusMessage}&rdquo;
          </p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {profile.bio && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bio
            </h3>
            <p className="mt-1 text-sm">{profile.bio}</p>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </h3>
          <p className="mt-1 text-sm">{profile.email}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Joined{" "}
            {profile.createdAt
              ? format(new Date(profile.createdAt), "MMMM yyyy")
              : "recently"}
          </span>
        </div>

        <div className="rounded-xl bg-accent/50 px-4 py-3 text-center">
          <span className="inline-flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Online
          </span>
        </div>
      </div>
    </div>
  );
}
