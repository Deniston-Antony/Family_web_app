import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted", className)}
    />
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export function MessageSkeleton({ isOwn }: { isOwn?: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <Skeleton className={cn("h-12 rounded-2xl", isOwn ? "w-48" : "w-56")} />
    </div>
  );
}

export function FriendSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}
