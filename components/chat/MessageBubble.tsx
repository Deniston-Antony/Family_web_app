"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { Check, CheckCheck, Copy, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
}

export function MessageBubble({ message, isOwn, onEdit, onDelete }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const statusIcon = () => {
    if (!isOwn) return null;
    switch (message.status) {
      case "READ":
        return <CheckCheck className="h-3 w-3 text-primary" />;
      case "DELIVERED":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      default:
        return <Check className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("group flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("relative max-w-[75%]", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 shadow-sm",
            isOwn
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-muted",
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
          <div
            className={cn(
              "mt-1 flex items-center gap-1",
              isOwn ? "justify-end text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            <span className="text-[10px]">
              {format(new Date(message.createdAt), "HH:mm")}
              {message.isEdited && " · edited"}
            </span>
            {statusIcon()}
          </div>
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            "absolute top-1 opacity-0 transition-opacity group-hover:opacity-100",
            isOwn ? "-left-8" : "-right-8",
          )}
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>

        {showMenu && (
          <div
            ref={menuRef}
            className={cn(
              "absolute z-10 min-w-[120px] rounded-xl border border-border bg-card py-1 shadow-lg",
              isOwn ? "right-0 top-8" : "left-0 top-8",
            )}
          >
            <button
              onClick={handleCopy}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            {isOwn && (
              <>
                <button
                  onClick={() => {
                    onEdit(message);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(message.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
