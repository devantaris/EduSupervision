import { useEffect, useRef } from "react";
import { apiFetch, tokenStore } from "@/lib/api";

export function useVideoProgress(videoId: string) {
  const pendingPosition = useRef<number | null>(null);
  const lastSynced = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTimeUpdate = (currentTime: number) => {
    pendingPosition.current = currentTime;
    sessionStorage.setItem(`vp-${videoId}`, String(currentTime)); // instant local backup

    if (timer.current) return;
    timer.current = setTimeout(async () => {
      const pos = pendingPosition.current;
      if (pos !== null && Math.abs(pos - lastSynced.current) >= 30) {
        try {
          await apiFetch(`/api/v1/materials/${videoId}/progress`, {
            method: "POST",
            body: JSON.stringify({ position: pos, completed: false }),
          });
          lastSynced.current = pos;
        } catch (err) {
          console.error("Failed to sync video telemetry:", err);
        }
      }
      timer.current = null;
    }, 30000); // 30s throttle
  };

  useEffect(() => {
    const flush = () => {
      const pos = pendingPosition.current;
      if (pos !== null) {
        const token = tokenStore.get();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        // Use fetch with keepalive: true to ensure transmission completes on navigation/unload
        fetch(`/api/v1/materials/${videoId}/progress`, {
          method: "POST",
          headers,
          body: JSON.stringify({ position: pos, completed: false }),
          keepalive: true,
        }).catch((err) => {
          console.error("Failed to flush video progress telemetry on unload:", err);
        });
      }
    };

    window.addEventListener("beforeunload", flush);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flush();
    };
  }, [videoId]);

  return { onTimeUpdate };
}
