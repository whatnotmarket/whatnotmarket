"use client";

import { Navbar } from "@/components/app/navigation/Navbar";
import { Button } from "@/components/shared/ui/button";
import { createClient } from "@/lib/infra/supabase/supabase";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
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

export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      const uid = user?.id || null;
      setUserId(uid);

      if (!uid) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,link,read_at,created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Load notifications error:", error);
        if (active) setNotifications([]);
      } else if (active) {
        setNotifications((data || []) as NotificationRow[]);
      }

      if (active) setLoading(false);
    }

    loadNotifications();

    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-page-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as NotificationRow;
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
          const incoming = payload.new as NotificationRow;
          setNotifications((prev) => prev.map((item) => (item.id === incoming.id ? incoming : item)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const nowIso = new Date().toISOString();
    setNotifications((prev) => prev.map((item) => (item.read_at ? item : { ...item, read_at: nowIso })));

    const { error } = await supabase.from("notifications").update({ read_at: nowIso }).in("id", unreadIds);

    if (error) {
      console.error("Mark all read error:", error);
    }
  };

  const markOneAsRead = async (notificationId: string) => {
    const nowIso = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((item) => {
        if (item.id !== notificationId || item.read_at) return item;
        return { ...item, read_at: nowIso };
      })
    );

    const { error } = await supabase.from("notifications").update({ read_at: nowIso }).eq("id", notificationId);

    if (error) {
      console.error("Mark one read error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/market">
              <Button variant="ghost" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>

          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {!userId && !loading && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 text-zinc-400">Sign in to view your notifications.</div>
        )}

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 text-zinc-400">Loading notifications...</div>
        ) : notifications.length === 0 && userId ? (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 text-zinc-400">No notifications yet.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <Link
                key={item.id}
                href={item.link || "/inbox"}
                onClick={() => markOneAsRead(item.id)}
                className={`block rounded-xl border p-4 transition-colors ${
                  item.read_at
                    ? "border-white/10 bg-zinc-900/40 hover:bg-zinc-900/60"
                    : "border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                  <span className="text-xs text-zinc-500">{formatTimeAgo(item.created_at)}</span>
                </div>
                <p className="text-sm text-zinc-300">{item.body}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}



