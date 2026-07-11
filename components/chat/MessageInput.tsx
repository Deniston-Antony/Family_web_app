"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const EmojiPicker = dynamic(() => import("@/components/chat/EmojiPicker"), { ssr: false });

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
}

export function MessageInput({
  onSend,
  onTyping,
  onStopTyping,
  disabled,
  editingMessage,
  onCancelEdit,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setContent("");
    setShowEmoji(false);
    onStopTyping();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && editingMessage) {
      onCancelEdit?.();
      setContent("");
    }
  };

  const handleChange = (value: string) => {
    setContent(value);
    onTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(onStopTyping, 2000);
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative border-t border-border p-3">
      {editingMessage && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-accent/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Editing message</span>
          <button onClick={onCancelEdit} className="text-primary hover:underline">
            Cancel
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className={cn(
              "max-h-32 min-h-[44px] w-full resize-none rounded-2xl border border-input bg-background/50 px-4 py-3 pr-12 text-sm",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:opacity-50",
            )}
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="absolute bottom-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        <Button
          size="icon"
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="shrink-0 rounded-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {showEmoji && (
        <div className="absolute bottom-16 left-3 z-50">
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
        </div>
      )}
    </div>
  );
}
