"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useTheme } from "next-themes";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="relative">
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="relative z-50">
        <Picker
          data={data}
          onEmojiSelect={(emoji: { native: string }) => onSelect(emoji.native)}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          previewPosition="none"
          skinTonePosition="search"
        />
      </div>
    </div>
  );
}
