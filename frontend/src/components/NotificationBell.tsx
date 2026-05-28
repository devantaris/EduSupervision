"use client";

/**
 * NotificationBell — Real-time notification indicator
 *
 * Connects to the SSE notification stream at /api/notifications/stream.
 * Shows a count badge for unread events.
 * Clicking opens a dropdown with event history.
 *
 * Events handled:
 *   evaluation_complete  → green toast + count increment
 *   similarity_flag      → amber alert
 *   announcement         → blue info
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { tokenStore } from "@/lib/api";

interface NotificationEvent {
  id: string;
  type: string;
  message: string;
  score?: number;
  timestamp: Date;
  read: boolean;
}

function buildMessage(data: Record<string, unknown>): string {
  switch (data.type) {
    case "evaluation_complete":
      return `Evaluation complete — Score: ${Number(data.overall_score ?? 0).toFixed(0)}/100`;
    case "similarity_flag":
      return `Similarity flag raised on submission ${String(data.submission_id ?? "").slice(0, 8)}…`;
    case "announcement":
      return String(data.message ?? "New announcement");
    case "connected":
      return "Connected to notification stream";
    default:
      return "New notification received";
  }
}

export default function NotificationBell() {
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = events.filter((e) => !e.read).length;

  // Connect SSE stream
  const connectSSE = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    // Get access token from tokenStore for Authorization header
    // SSE via EventSource doesn't support custom headers natively in browsers.
    // We use a cookie-based auth fallback — the Next.js route handler forwards
    // the HttpOnly refresh token and re-authenticates for SSE connections.
    try {
      const es = new EventSource("/api/notifications/stream", {
        withCredentials: true,
      });
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
      };

      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data) as Record<string, unknown>;
          if (data.type === "connected") {
            setConnected(true);
            return;
          }
          const notification: NotificationEvent = {
            id: `${Date.now()}-${Math.random()}`,
            type: String(data.type ?? "info"),
            message: buildMessage(data),
            score: typeof data.overall_score === "number" ? data.overall_score : undefined,
            timestamp: new Date(),
            read: false,
          };
          setEvents((prev) => [notification, ...prev].slice(0, 50));
        } catch {
          // Ignore parse errors (heartbeats are comments, not messages)
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Reconnect after 5s
        setTimeout(connectSSE, 5000);
      };
    } catch {
      // SSE not supported or connection refused — silent fail
    }
  }, []);

  useEffect(() => {
    connectSSE();
    return () => {
      esRef.current?.close();
    };
  }, [connectSSE]);

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function markAllRead() {
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  const typeConfig: Record<string, { dot: string; label: string }> = {
    evaluation_complete: { dot: "bg-emerald-500", label: "Evaluation" },
    similarity_flag: { dot: "bg-amber-400", label: "Flag" },
    announcement: { dot: "bg-blue-400", label: "Notice" },
    default: { dot: "bg-slate-500", label: "Update" },
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-800/60 transition-colors cursor-pointer"
        aria-label="Notifications"
        id="notification-bell-btn"
      >
        <svg
          className={`w-5 h-5 transition-colors ${connected ? "text-slate-400" : "text-slate-600"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#991b1b] text-[#f5f2eb] text-[9px] font-black flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        {connected && (
          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
        )}
      </button>

      {/* Notification panel */}
      {open && (
        <div
          className="absolute right-0 top-11 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800/60 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ animation: "slideIn 0.15s ease-out" }}
        >
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#f5f2eb]">Notifications</span>
              {!connected && (
                <span className="text-[9px] text-red-400 font-bold px-1.5 py-0.5 rounded-full bg-red-950/40 border border-red-900/40">
                  Offline
                </span>
              )}
            </div>
            {events.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-slate-600 hover:text-slate-400 cursor-pointer transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Event list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <span className="text-2xl opacity-20">🔔</span>
                <p className="text-xs text-slate-600">No notifications yet</p>
              </div>
            ) : (
              events.map((ev) => {
                const cfg = typeConfig[ev.type] ?? typeConfig.default;
                return (
                  <div
                    key={ev.id}
                    className={`px-4 py-3 flex gap-3 ${ev.read ? "opacity-50" : ""}`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">
                          {cfg.label}
                        </span>
                        <span className="text-[9px] text-slate-700">{formatTime(ev.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{ev.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
