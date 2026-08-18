"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { tokenStore } from "@/lib/api";

interface NotificationEvent {
  id: string;
  type: "evaluation_complete" | "similarity_flag" | "announcement" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = events.filter((e) => !e.read).length;

  const connectSSE = useCallback(() => {
    const token = tokenStore.get();
    if (!token) return;

    try {
      const es = new EventSource(`/api/v1/notifications/stream?token=${token}`);
      eventSourceRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "heartbeat") return;

          const newEvent: NotificationEvent = {
            id: data.id || crypto.randomUUID(),
            type: data.type || "system",
            title: data.title || "Notification",
            message: data.message || "",
            timestamp: data.timestamp || new Date().toISOString(),
            read: false,
          };

          setEvents((prev) => [newEvent, ...prev].slice(0, 50));
        } catch {
          // Ignore unparseable messages (heartbeats)
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        eventSourceRef.current = null;
        // Reconnect with 5s backoff
        reconnectTimeoutRef.current = setTimeout(connectSSE, 5000);
      };
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connectSSE();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connectSSE]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  function markAllRead() {
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
  }

  function getEventIcon(type: string) {
    switch (type) {
      case "evaluation_complete":
        return (
          <div className="w-9 h-9 shrink-0 rounded-md bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
        );
      case "similarity_flag":
        return (
          <div className="w-9 h-9 shrink-0 rounded-md bg-burgundy/25 border border-red-500/25 flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        );
      case "announcement":
        return (
          <div className="w-9 h-9 shrink-0 rounded-md bg-gold/10 border border-gold/25 flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 shrink-0 rounded-md bg-slate-500/10 border border-slate-400/20 flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
        );
    }
  }

  function getEventDotColor(type: string) {
    switch (type) {
      case "evaluation_complete": return "bg-emerald-400";
      case "similarity_flag": return "bg-burgundy";
      case "announcement": return "bg-gold";
      default: return "bg-slate-400";
    }
  }

  function formatTimeAgo(timestamp: string) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? "s" : ""} ago`;
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
          if (!isOpen) markAllRead();
        }}
        className="relative w-10 h-10 rounded-md border hairline-w bg-obsidian/80 flex items-center justify-center hover:border-brass/40 transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-burgundy text-[10px] font-bold text-white flex items-center justify-center border-2 border-void">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {connected && (
          <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-emerald-400 pulse-dot" title="Live connection" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[380px] rounded-lg border hairline bg-obsidian shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)] overflow-hidden z-50">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 pulse-dot" : "bg-red-400"}`} />
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Real-Time Feed · {connected ? "Live" : "Reconnecting…"}
              </p>
            </div>
            <button
              onClick={markAllRead}
              className="text-[11px] text-brass hover:text-gold cursor-pointer"
            >
              Mark all read
            </button>
          </div>

          <div className="divide-y divide-white/5 max-h-[340px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-slate-500">No notifications yet</p>
                <p className="text-[10px] text-slate-600 mt-1">Events will appear here in real time</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  {getEventIcon(event.type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-parchment font-medium">{event.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{event.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">
                      {formatTimeAgo(event.timestamp)}
                    </p>
                  </div>
                  {!event.read && (
                    <span className={`ml-auto w-2 h-2 mt-1.5 rounded-full ${getEventDotColor(event.type)} shrink-0`} />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t hairline text-center">
            <button className="text-xs text-brass hover:text-gold font-medium tracking-wide cursor-pointer">
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
