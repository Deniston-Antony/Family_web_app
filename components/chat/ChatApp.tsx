"use client";

import { useState } from "react";
import { Menu, X, Bell, Users } from "lucide-react";
import { Sidebar, type SidebarTab } from "@/components/layout/Sidebar";
import { SearchBar } from "@/components/layout/SearchBar";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { FriendsList } from "@/components/friends/FriendsList";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { ProfilePanel } from "@/components/layout/ProfilePanel";
import { SettingsPanel } from "@/components/layout/SettingsPanel";
import { FriendDetails } from "@/components/layout/FriendDetails";
import { GroupDetails } from "@/components/groups/GroupDetails";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/components/providers/ChatProvider";
import { useSession } from "next-auth/react";
import { useFriends } from "@/hooks/useFriends";
import { useChatSocketEvents } from "@/hooks/useChatSocket";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Conversation, PublicUser } from "@/types";

type MobileView = "sidebar" | "conversations" | "chat" | "details";

export function ChatApp() {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("friends");
  const [mobileView, setMobileView] = useState<MobileView>("conversations");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const {
    setActiveConversation,
    setSelectedFriend,
    selectedFriend,
    conversations,
    setConversations,
    activeConversation,
  } = useChat();
  const { data: session } = useSession();
  const { requests } = useFriends();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useChatSocketEvents();

  const receivedRequests = requests.filter(
    (r) => r.status === "PENDING" && r.receiverId === session?.user?.id,
  );
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    if (conversation.type === "GROUP") {
      setSelectedFriend(null);
    } else {
      setSelectedFriend(conversation.participant ?? null);
    }
    setMobileView("chat");
  };

  const handleGroupCreated = (conversation: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conversation.id);
      if (exists) return prev;
      return [conversation, ...prev];
    });
    handleSelectConversation(conversation);
  };

  const handleSelectFriend = (friend: PublicUser) => {
    setSelectedFriend(friend);
    setMobileView("details");
  };

  const handleMessageFriend = async (friend: PublicUser) => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId: friend.id }),
    });
    const data = await res.json();
    if (data.success) {
      handleSelectConversation(data.data.conversation);
    }
  };

  const renderSidebarContent = () => {
    switch (sidebarTab) {
      case "profile":
        return <ProfilePanel />;
      case "friends":
        return <FriendsList onSelectFriend={handleSelectFriend} />;
      case "requests":
        return <FriendRequests />;
      case "settings":
        return <SettingsPanel />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute left-0 top-0 h-full w-72 animate-slide-up bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setShowMobileSidebar(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar
              activeTab={sidebarTab}
              onTabChange={(tab) => {
                setSidebarTab(tab);
                setShowMobileSidebar(false);
              }}
              requestCount={receivedRequests.length}
              unreadCount={totalUnread}
            />
          </div>
        </div>
      )}

      <div className="hidden w-64 shrink-0 border-r border-border lg:block">
        <Sidebar
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          requestCount={receivedRequests.length}
          unreadCount={totalUnread}
        />
      </div>

      <div
        className={cn(
          "w-full border-r border-border lg:w-80",
          mobileView !== "conversations" && mobileView !== "sidebar" ? "hidden lg:block" : "block",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-3">
          <button className="lg:hidden" onClick={() => setShowMobileSidebar(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <SearchBar />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl p-2 hover:bg-accent"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1">
                  <Badge count={unreadCount} />
                </span>
              )}
            </button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card shadow-xl">
                  <div className="flex items-center justify-between border-b border-border p-3">
                    <span className="font-semibold">Notifications</span>
                    <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={cn(
                            "w-full border-b border-border/50 p-3 text-left last:border-0 hover:bg-accent/50",
                            !n.read && "bg-primary/5",
                          )}
                        >
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="hidden h-[calc(100vh-3.5rem)] lg:block">
          <div className="h-1/2 overflow-y-auto border-b border-border scrollbar-thin">
            {renderSidebarContent()}
          </div>
          <div className="h-1/2 overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Messages</h3>
              <Button size="sm" variant="outline" onClick={() => setShowCreateGroup(true)}>
                <Users className="h-3.5 w-3.5" />
                Group
              </Button>
            </div>
            <ConversationList onSelect={handleSelectConversation} />
          </div>
        </div>

        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin lg:hidden">
          {renderSidebarContent()}
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Messages</h3>
              <Button size="sm" variant="outline" onClick={() => setShowCreateGroup(true)}>
                <Users className="h-3.5 w-3.5" />
                Group
              </Button>
            </div>
          </div>
          <ConversationList onSelect={handleSelectConversation} />
        </div>
      </div>

      <div
        className={cn(
          "flex-1",
          mobileView !== "chat" ? "hidden lg:flex lg:flex-col" : "flex flex-col",
        )}
      >
        <ChatWindow showBack onBack={() => setMobileView("conversations")} />
      </div>

      <div
        className={cn(
          "w-full border-l border-border lg:w-80",
          mobileView !== "details" && activeConversation?.type !== "GROUP"
            ? "hidden lg:block"
            : "block",
        )}
      >
        {activeConversation?.type === "GROUP" ? (
          <GroupDetails conversation={activeConversation} />
        ) : (
          <FriendDetails friend={selectedFriend} onMessage={handleMessageFriend} />
        )}
      </div>

      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={handleGroupCreated}
      />
    </div>
  );
}
