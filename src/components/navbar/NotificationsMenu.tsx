"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, MessageCircle, AlertCircle, Tag, Loader2 } from "lucide-react";
import { NavPopup } from "./NavPopup";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: string;
  read: boolean;
  link: string;
};

function formatTimeAgo(isoDate: string) {
  const now = Date.now();
  const created = new Date(isoDate).getTime();
  const seconds = Math.max(1, Math.floor((now - created) / 1000));

  if (seconds < 60) return "now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function toUiNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.body,
    time: formatTimeAgo(row.created_at),
    type: row.type,
    read: !!row.read_at,
    link: row.link || "/inbox",
  };
}

export function NotificationsMenu() {
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      const uid = user?.id || null;
      setUserId(uid);

      if (!uid) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,title,body,link,read_at,created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Failed to load notifications:", error);
        if (active) {
          setNotifications([]);
          setIsLoading(false);
        }
        return;
      }

      if (active) {
        setNotifications((data || []).map((row) => toUiNotification(row as NotificationRow)));
        setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = toUiNotification(payload.new as NotificationRow);
          setNotifications((prev) => {
            if (prev.some((item) => item.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const updated = toUiNotification(payload.new as NotificationRow);
          setNotifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;

    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);

    if (error) {
      console.error("Failed to mark notifications as read:", error);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneAsRead = async (notificationId: string) => {
    const target = notifications.find((item) => item.id === notificationId);
    if (!target || target.read) return;

    setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)));

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) {
      console.error("Failed to mark notification as read:", error);
      setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, read: false } : item)));
    }
  };

  const getIcon = (type: string) => {
    if (type === "offer_created") return <Tag className="h-4 w-4 text-emerald-400" />;
    if (type === "offer_accepted") return <Tag className="h-4 w-4 text-blue-400" />;
    if (type === "message_received") return <MessageCircle className="h-4 w-4 text-indigo-400" />;
    if (type === "deal_status_changed") return <AlertCircle className="h-4 w-4 text-amber-400" />;
    return <MessageCircle className="h-4 w-4 text-zinc-400" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-lg px-4 py-2 text-zinc-300 transition-all hover:bg-white/5 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute top-2 right-3 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#1C1C1E]" />}
      </button>

      <NavPopup isOpen={isOpen} onClose={() => setIsOpen(false)} align="center" className="w-[380px]" title="Notifications">
        <div className="rounded-[16px] bg-[#1C1C1E] p-2">
          <div className="flex max-h-[480px] flex-col overflow-hidden rounded-[16px] bg-[#222222]">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <span className="text-xs font-medium text-zinc-400">{unreadCount} unread</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-bold text-indigo-400 transition-colors hover:text-indigo-300">
                  Mark all as read
                </button>
              )}
            </div>

            <div className="custom-scrollbar space-y-2 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center p-8 text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : !userId ? (
                <div className="p-8 text-center text-sm text-zinc-500">
                  Sign in to receive notifications.
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">No notifications yet</div>
              ) : (
                notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    onClick={() => {
                      markOneAsRead(notification.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "group relative flex items-start gap-4 rounded-lg bg-zinc-800/50 p-4 transition-colors hover:bg-white/10",
                      !notification.read && "bg-white/[0.02]"
                    )}
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/5 bg-zinc-800/50")}>
                      {getIcon(notification.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center justify-between">
                        <h4 className={cn("truncate pr-2 text-sm font-semibold", notification.read ? "text-zinc-300" : "text-white")}>
                          {notification.title}
                        </h4>
                        <span className="shrink-0 whitespace-nowrap text-[11px] text-zinc-500">{notification.time}</span>
                      </div>
                      <p className="line-clamp-2 text-[13px] leading-snug text-zinc-400">{notification.message}</p>
                    </div>

                    {!notification.read && <div className="absolute top-5 right-4 h-2 w-2 rounded-full bg-indigo-500" />}
                  </Link>
                ))
              )}
            </div>

            <div className="border-t border-white/5 bg-zinc-900/50 p-2">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center rounded-lg py-2.5 text-xs font-bold text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
              >
                View All Notifications
              </Link>
            </div>
          </div>
        </div>
      </NavPopup>
    </div>
  );
}

