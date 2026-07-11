import { cn } from "@/lib/utils";
import { MessageCircle, Users, Search } from "lucide-react";

interface EmptyStateProps {
  icon?: "chat" | "friends" | "search";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon = "chat", title, description, action, className }: EmptyStateProps) {
  const icons = {
    chat: MessageCircle,
    friends: Users,
    search: Search,
  };

  const Icon = icons[icon];

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
