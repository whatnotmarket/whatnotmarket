"use client";

import { Button } from "@/components/shared/ui/button";
import { GLOBAL_CHAT_ROOMS } from "@/lib/domains/chat/global-chat-config";
import { createClient } from "@/lib/infra/supabase/supabase";
import { useCallback,useEffect,useMemo,useMemo as useReactMemo,useState } from "react";

type AdminChatRow = {
  id: string;
  user_id: string;
  room: string;
  message: string;
  created_at: string;
  reply_to_id: string | null;
  is_deleted: boolean;
  flagged?: boolean;
  profiles?: { username?: string | null; full_name?: string | null } | null;
};

export default function AdminPublicChatPage() {
  const [rows, setRows] = useState<AdminChatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const supabase = useReactMemo(() => createClient(), []);
  const [roomState, setRoomState] = useState<{ slow_mode_seconds: number; closed_until: string | null } | null>(null);
  const [activeUsers, setActiveUsers] = useState<Array<{ user_id: string; username: string | null; full_name: string | null; last_message_at: string; messages_count: number; status: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<Array<{ id: string; message: string; created_at: string; is_deleted: boolean }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (room) params.set("room", room);
    if (q) params.set("q", q);
    try {
      const res = await fetch(`/api/admin/dashboard/public-chat?${params.toString()}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Unable to load");
      setRows(payload.messages || []);
      setRoomState(payload.roomState || null);
      setActiveUsers(payload.activeUsers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [q, room]);

  const applyRoomState = async (payload: { action: "slow_mode" | "close" | "open"; seconds?: number; minutes?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/moderation/public-chat/room-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, ...payload }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Unable to apply room state");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (action: string, messageId?: string, userId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dashboard/public-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, messageId, userId }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || "Action failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("admin-public-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "global_chat_messages" }, load)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "global_chat_messages" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, supabase]);
  const filtered = useMemo(() => rows, [rows]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="rounded-2xl border-2 border-white/20 bg-[#0A0A0A] px-3 py-2 text-white"
        >
          <option value="">{`All rooms`}</option>
          {GLOBAL_CHAT_ROOMS.map((r) => (
            <option key={r.slug} value={r.slug}>{r.label}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search messages or users"
          className="rounded-2xl border-2 border-white/20 bg-[#0A0A0A] px-3 py-2 text-white"
        />
        <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/10 bg-[#0A0A0A] px-3 py-2 text-sm text-white">
          <span className="font-semibold">Room</span>
          <span className={(roomState && roomState.closed_until) ? "text-red-400" : "text-green-400"}>{(roomState && roomState.closed_until) ? "CLOSED" : "OPEN"}</span>
          <span className="ml-3 font-semibold">Slow</span>
          <span className="text-zinc-300">{roomState?.slow_mode_seconds ? `${roomState.slow_mode_seconds}s` : "OFF"}</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <Button onClick={() => applyRoomState({ action: "slow_mode", seconds: 0 })} className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 px-3">OFF</Button>
          <Button onClick={() => applyRoomState({ action: "slow_mode", seconds: 10 })} className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 px-3">10s</Button>
          <Button onClick={() => applyRoomState({ action: "slow_mode", seconds: 30 })} className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 px-3">30s</Button>
          <Button onClick={() => applyRoomState({ action: "slow_mode", seconds: 60 })} className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 px-3">60s</Button>
          <Button onClick={() => applyRoomState({ action: "close", minutes: 0 })} className="rounded-2xl bg-red-600 text-white hover:bg-red-500 px-4">Close room</Button>
          <Button onClick={() => applyRoomState({ action: "open" })} className="rounded-2xl bg-green-600 text-white hover:bg-green-500 px-4">Open room</Button>
          <Button onClick={load} className="rounded-2xl bg-white text-black hover:bg-zinc-200 px-4">Reload</Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border-2 border-white/20 bg-[#101010] px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          {loading ? (
            <div className="rounded-2xl border-2 border-white/20 bg-[#101010] px-3 py-2 text-sm text-zinc-300">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-white/20 bg-[#101010] px-3 py-2 text-sm text-zinc-300">No messages</div>
          ) : (
            filtered.map((row) => {
              const deleted = row.is_deleted;
              const warning = Boolean(row.flagged);
              return (
                <div
                  key={row.id}
                  className={`rounded-2xl border-2 px-3 py-3 ${deleted ? "border-white/10 bg-[#0b0b0b] text-zinc-500 line-through" : "border-white/10 bg-[#101010] text-zinc-300"} ${warning ? "ring-1 ring-orange-500/30" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="text-white font-semibold">
                        {row.profiles?.full_name || row.profiles?.username || row.user_id}
                        <span className="ml-2 text-xs text-zinc-400">[{row.room}]</span>
                        {deleted ? <span className="ml-2 text-xs text-zinc-400">Message removed</span> : null}
                      </div>
                      <div className="text-xs text-zinc-500">{new Date(row.created_at).toLocaleString()}</div>
                      <div className="mt-1 break-words">{row.message}</div>
                    </div>
                    <div className="shrink-0">
                      <div className="flex items-center gap-2">
                        <Button onClick={() => act("delete_message", row.id)} className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 px-3">Delete</Button>
                        <Button onClick={() => act("ban_message", row.id)} className="rounded-2xl bg-red-600 textç™½ hover:bg-red-500 px-3">Ban</Button>
                        <div className="relative">
                          <Button
                            onClick={(e) => {
                              const menu = (e.currentTarget.nextElementSibling as HTMLDivElement | null);
                              if (menu) menu.classList.toggle("hidden");
                            }}
                            className="rounded-2xl bg-zinc-800 textç™½ hover:bg-zinc-700 px-3"
                          >
                            User â–¾
                          </Button>
                          <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-white/10 bg-[#101010] text-sm text-white hidden z-10">
                            <button onClick={() => act("mute_user", undefined, row.user_id)} className="block w-full text-left px-3 py-2 hover:bg-white/10">Mute 5m</button>
                            <button onClick={() => act("mute_user", undefined, row.user_id)} className="block w-full text-left px-3 py-2 hover:bg-white/10">Mute 30m</button>
                            <button onClick={() => act("mute_user", undefined, row.user_id)} className="block w-full text-left px-3 py-2 hover:bg-white/10">Mute 1h</button>
                            <button onClick={() => act("ban_user", undefined, row.user_id)} className="block w-full text-left px-3 py-2 hover:bg-white/10 text-red-400">Ban user</button>
                            <button onClick={() => act("unmute_user", undefined, row.user_id)} className="block w-full text-left px-3 py-2 hover:bg-white/10">Unmute user</button>
                            <button onClick={() => act("unban_user", undefined, row.user_id)} className="block w-full text-left px-3 py-2 hover:bg-white/10">Unban user</button>
                            <button
                              onClick={async () => {
                                setSelectedUserId(row.user_id);
                                const params = new URLSearchParams();
                                if (room) params.set("room", room);
                                params.set("userId", row.user_id);
                                const res = await fetch(`/api/admin/dashboard/public-chat?${params.toString()}`, { cache: "no-store" });
                                const payload = await res.json();
                                setUserHistory(payload.userHistory || []);
                              }}
                              className="block w-full text-left px-3 py-2 hover:bg-white/10"
                            >
                              View history
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="space-y-2">
          <div className="rounded-2xl border-2 border-white/10 bg-[#101010] px-3 py-2">
            <div className="text-white font-semibold mb-2">Active Users</div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {(activeUsers || []).map((u) => (
                <div key={u.user_id} className="flex items-center justify-between rounded-xl border border-white/10 px-2 py-2">
                  <div>
                    <div className="text-white font-semibold">{u.full_name || u.username || u.user_id}</div>
                    <div className="text-xs text-zinc-400">
                      {new Date(u.last_message_at).toLocaleString()} â€¢ {u.messages_count} messages
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${u.status === "banned" ? "bg-red-600 text-white" : u.status === "muted" ? "bg-orange-600 text-white" : "bg-zinc-700 text-white"}`}>
                      {u.status}
                    </span>
                    <Button
                      onClick={async () => {
                        setSelectedUserId(u.user_id);
                        const params = new URLSearchParams();
                        if (room) params.set("room", room);
                        params.set("userId", u.user_id);
                        const res = await fetch(`/api/admin/dashboard/public-chat?${params.toString()}`, { cache: "no-store" });
                        const payload = await res.json();
                        setUserHistory(payload.userHistory || []);
                      }}
                      className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 px-3"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {selectedUserId ? (
            <div className="rounded-2xl border-2 border-white/10 bg-[#101010] px-3 py-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">User Moderation</span>
                <Button onClick={() => { setSelectedUserId(null); setUserHistory([]); }} className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 px-3">Close</Button>
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                <div className="mb-2">User: {selectedUserId}</div>
                <div className="flex items-center gap-2 mb-2">
                  <Button onClick={() => act("mute_user", undefined, selectedUserId!)} className="rounded-2xl bg-orange-600 text-white hover:bg-orange-500 px-3">Mute</Button>
                  <Button onClick={() => act("ban_user", undefined, selectedUserId!)} className="rounded-2xl bg-red-600 text-white hover:bg-red-500 px-3">Ban</Button>
                  <Button onClick={() => act("unmute_user", undefined, selectedUserId!)} className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 px-3">Unmute</Button>
                  <Button onClick={() => act("unban_user", undefined, selectedUserId!)} className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700 px-3">Unban</Button>
                </div>
                <div className="text-white font-semibold mb-1">Recent Messages</div>
                <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                  {userHistory.length === 0 ? (
                    <div className="text-zinc-400">No messages</div>
                  ) : (
                    userHistory.map((m) => (
                      <div key={m.id} className={`rounded-xl px-2 py-1 ${m.is_deleted ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                        <span className="text-xs text-zinc-400 mr-2">{new Date(m.created_at).toLocaleString()}</span>
                        {m.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


