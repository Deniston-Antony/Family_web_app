"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { ChatProvider } from "@/components/providers/ChatProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SocketProvider>
          <NotificationProvider>
            <ChatProvider>{children}</ChatProvider>
          </NotificationProvider>
        </SocketProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
