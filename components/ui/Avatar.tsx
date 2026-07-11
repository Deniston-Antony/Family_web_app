import Image from "next/image";
import { cn, getDefaultAvatarUrl, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string;
}

export function Avatar({
  src,
  name,
  size = "md",
  showOnline = false,
  isOnline = false,
  className,
}: AvatarProps) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  const onlineSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
    xl: "h-4 w-4",
  };

  const imageSrc = src || getDefaultAvatarUrl(name);

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-primary/10",
          sizes[size],
        )}
      >
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      {showOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            onlineSizes[size],
            isOnline ? "bg-green-500" : "bg-muted-foreground",
          )}
        />
      )}
    </div>
  );
}

export function AvatarFallback({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
        sizes[size],
      )}
    >
      {getInitials(name)}
    </div>
  );
}
