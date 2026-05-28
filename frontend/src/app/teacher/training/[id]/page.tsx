"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { useVideoProgress } from "@/hooks/useVideoProgress";

interface Progress {
  material_id: string;
  position: number;
  completed: boolean;
  updated_at: string;
}

interface Material {
  id: string;
  title: string;
  description: string;
  type: "video" | "pdf" | "document";
  file_url: string;
  created_at: string;
  progress: Progress | null;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function typeLabel(type: Material["type"]): string {
  if (type === "video") return "🎬 Video Module";
  if (type === "pdf") return "📄 PDF Document";
  return "📑 Document";
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* back button placeholder */}
      <div className="h-4 w-28 bg-slate-800 rounded" />
      {/* player skeleton */}
      <div className="w-full aspect-video bg-slate-800/80 rounded-2xl" />
      {/* title + desc */}
      <div className="space-y-3">
        <div className="h-6 w-2/3 bg-slate-800 rounded" />
        <div className="h-3 w-full bg-slate-800 rounded" />
        <div className="h-3 w-4/5 bg-slate-800 rounded" />
      </div>
    </div>
  );
}

export default function TeacherCourseViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "info">("info");

  // Video state for display purposes
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSeeked = useRef(false);

  // ── Telemetry hook (preserves all existing logic) ────────────────────────
  const { onTimeUpdate } = useVideoProgress(id);

  useEffect(() => {
    fetchMaterial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchMaterial = async () => {
    try {
      const res = await apiFetch(`/api/v1/materials/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMaterial(data);
      } else {
        setError("Module not found or access denied.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to institutional services.");
    } finally {
      setLoading(false);
    }
  };

  // ── Restore previous playback position ───────────────────────────────────
  useEffect(() => {
    if (material && material.type === "video" && videoRef.current && !hasSeeked.current) {
      const initialPos = material.progress?.position || 0;
      if (initialPos > 0) {
        videoRef.current.currentTime = initialPos;
        showStatus(`Resumed from last saved position: ${formatTime(initialPos)}`, "info");
      }
      hasSeeked.current = true;
    }
  }, [material]);

  const showStatus = (msg: string, type: "success" | "info") => {
    setStatusMessage(msg);
    setStatusType(type);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const t = e.currentTarget.currentTime;
    onTimeUpdate(t); // delegate to telemetry hook (existing logic)
    setVideoCurrentTime(t);
  };

  const handleVideoEnded = async () => {
    if (!material) return;
    try {
      const res = await apiFetch(`/api/v1/materials/${id}/progress`, {
        method: "POST",
        body: JSON.stringify({
          position: videoRef.current?.duration || 0,
          completed: true,
        }),
      });
      if (res.ok) {
        showStatus("🎉 Module Completed! Great work!", "success");
        fetchMaterial();
      }
    } catch (err) {
      console.error("Failed to save end telemetry progress:", err);
    }
  };

  const handleMarkAsRead = async () => {
    if (!material) return;
    setMarkingComplete(true);
    try {
      const res = await apiFetch(`/api/v1/materials/${id}/progress`, {
        method: "POST",
        body: JSON.stringify({
          position: 1.0,
          completed: true,
        }),
      });
      if (res.ok) {
        showStatus("✅ Module marked as completed!", "success");
        fetchMaterial();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingComplete(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !material) {
    return (
      <div className="max-w-2xl mx-auto py-24 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center justify-center text-3xl">
          ⚠️
        </div>
        <div className="text-center space-y-2">
          <p className="text-red-400 font-bold text-sm">
            {error || "Course resource not found."}
          </p>
          <p className="text-slate-500 text-xs">
            Please check your connection or contact your institution administrator.
          </p>
        </div>
        <a
          href="/teacher/training"
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all duration-200"
        >
          <span>←</span>
          <span>Return to Library</span>
        </a>
      </div>
    );
  }

  const isCompleted = !!material.progress?.completed;
  const progressPercent =
    material.type === "video" && videoDuration > 0
      ? Math.min(100, Math.round((videoCurrentTime / videoDuration) * 100))
      : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Back + Status Badge ── */}
      <header className="flex items-center justify-between">
        <a
          href="/teacher/training"
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors duration-200 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
          <span>Back to Catalog</span>
        </a>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 shadow-sm">
              <span>✓</span> Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-950/60 text-indigo-400 border border-indigo-900/60">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              In Progress
            </span>
          )}
        </div>
      </header>

      {/* ── Status Toast ── */}
      {statusMessage && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold shadow-lg transition-all duration-300 ${
            statusType === "success"
              ? "bg-emerald-950/70 border border-emerald-900 text-emerald-400"
              : "bg-indigo-950/70 border border-indigo-900 text-indigo-400"
          }`}
        >
          <span>{statusType === "success" ? "🎉" : "ℹ️"}</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ── Player Card ── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Video / PDF area */}
        <div className="relative bg-black">
          {material.type === "video" ? (
            <>
              {/* Glow effect behind video */}
              <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />

              {/* Loading overlay while video loads */}
              {!videoLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 z-10">
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span className="text-slate-500 text-xs font-semibold">Loading video…</span>
                </div>
              )}

              <video
                ref={videoRef}
                src={material.file_url}
                controls
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                onLoadedMetadata={(e) => {
                  setVideoDuration(e.currentTarget.duration);
                  setVideoLoaded(true);
                }}
                className="w-full aspect-video object-contain rounded-none"
                style={{
                  boxShadow: isCompleted
                    ? "0 0 40px rgba(52, 211, 153, 0.08)"
                    : "0 0 40px rgba(99, 102, 241, 0.10)",
                }}
              />
            </>
          ) : (
            /* ── PDF / Document Placeholder ── */
            <div className="aspect-video flex flex-col items-center justify-center gap-5 p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30">
              {/* PDF icon */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-purple-900/40 border border-indigo-800/50 flex items-center justify-center shadow-xl shadow-indigo-500/10">
                <svg
                  className="w-10 h-10 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-200">
                  {material.type === "pdf" ? "PDF Reading Module" : "Document Module"}
                </p>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  This module contains a reading assignment. Open or download the document to complete this module.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href={material.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-200 shadow-md"
                >
                  <span>⬇</span>
                  <span>Download / View PDF</span>
                </a>
                {!isCompleted && (
                  <button
                    onClick={handleMarkAsRead}
                    disabled={markingComplete}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{markingComplete ? "⏳" : "✓"}</span>
                    <span>{markingComplete ? "Marking…" : "Mark as Completed"}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Video Progress Bar (video only) ── */}
        {material.type === "video" && videoLoaded && (
          <div className="px-6 pt-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>{formatTime(videoCurrentTime)} watched</span>
              <span>{progressPercent}% complete</span>
              {videoDuration > 0 && <span>Total: {formatTime(videoDuration)}</span>}
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500"
                }`}
                style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Course Info ── */}
        <div className="p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-extrabold text-slate-100 leading-snug">
              {material.title}
            </h1>
            {isCompleted && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
                ✓ Done
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {material.description || "No course description provided by your institution."}
          </p>
        </div>
      </div>

      {/* ── Course Details Card ── */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
          Course Details
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Material Type
            </dt>
            <dd className="text-sm font-semibold text-slate-300">
              {typeLabel(material.type)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Published
            </dt>
            <dd className="text-sm font-semibold text-slate-300">
              {formatDate(material.created_at)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Status
            </dt>
            <dd>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400">
                  <span>✓</span> Completed
                </span>
              ) : (
                <span className="text-sm font-semibold text-amber-400">In Progress</span>
              )}
            </dd>
          </div>
          {material.type === "video" && videoDuration > 0 && (
            <div className="space-y-1">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Duration
              </dt>
              <dd className="text-sm font-semibold text-slate-300">
                {formatTime(videoDuration)}
              </dd>
            </div>
          )}
          {material.progress?.updated_at && (
            <div className="space-y-1">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Last Saved
              </dt>
              <dd className="text-sm font-semibold text-slate-300">
                {formatDate(material.progress.updated_at)}
              </dd>
            </div>
          )}
          {material.type === "video" && material.progress?.position && material.progress.position > 0 && !isCompleted && (
            <div className="space-y-1">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Resume At
              </dt>
              <dd className="text-sm font-semibold text-indigo-400">
                {formatTime(material.progress.position)}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
