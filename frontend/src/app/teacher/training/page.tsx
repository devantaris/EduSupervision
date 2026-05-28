"use client";

import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

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

type FilterTab = "all" | "video" | "document" | "completed";

const TYPE_ICON: Record<Material["type"], React.ReactNode> = {
  video: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  pdf: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
};

const TYPE_BG: Record<Material["type"], string> = {
  video: "bg-emerald-950/50 text-emerald-400",
  pdf: "bg-amber-950/50 text-amber-400",
  document: "bg-slate-800 text-slate-400",
};

const TYPE_BADGE: Record<Material["type"], string> = {
  video: "bg-emerald-900/40 text-emerald-400 border border-emerald-800/60",
  pdf: "bg-amber-900/40 text-amber-400 border border-amber-800/60",
  document: "bg-slate-800 text-slate-300 border border-slate-700",
};

function getProgressPercent(m: Material): number {
  if (!m.progress || m.progress.completed) return m.progress?.completed ? 100 : 0;
  // position is seconds watched; estimate from position (rough approximation without duration)
  return Math.min(Math.round(m.progress.position % 100), 99);
}

function SkeletonCard() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-xl bg-slate-800" />
        <div className="w-16 h-5 rounded-full bg-slate-800" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800 rounded w-full" />
        <div className="h-3 bg-slate-800 rounded w-2/3" />
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full" />
      <div className="flex justify-between items-center pt-1">
        <div className="h-3 w-16 bg-slate-800 rounded" />
        <div className="h-7 w-24 bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "video", label: "Videos" },
  { id: "document", label: "Documents" },
  { id: "completed", label: "Completed" },
];

export default function TeacherTrainingPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await apiFetch("/api/v1/materials");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error("Failed to load assigned materials:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case "video":
        return materials.filter((m) => m.type === "video");
      case "document":
        return materials.filter((m) => m.type === "pdf" || m.type === "document");
      case "completed":
        return materials.filter((m) => m.progress?.completed);
      default:
        return materials;
    }
  }, [materials, activeFilter]);

  const completedCount = materials.filter((m) => m.progress?.completed).length;
  const inProgressCount = materials.filter((m) => m.progress && !m.progress.completed).length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">Training Library</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review curriculum documents, stream pedagogical instructional videos, and track your completion status.
          </p>
        </div>

        {/* Mini progress stat */}
        {!loading && materials.length > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-slate-400">
                <span className="text-emerald-400 font-bold">{completedCount}</span> completed,{" "}
                <span className="text-indigo-400 font-bold">{inProgressCount}</span> in progress
              </div>
              <div className="w-40 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: materials.length > 0 ? `${Math.round((completedCount / materials.length) * 100)}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-800 rounded-xl p-1 w-fit">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.id === "all"
              ? materials.length
              : tab.id === "video"
              ? materials.filter((m) => m.type === "video").length
              : tab.id === "document"
              ? materials.filter((m) => m.type === "pdf" || m.type === "document").length
              : completedCount;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
              {!loading && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeFilter === tab.id ? "bg-indigo-500/50 text-indigo-100" : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="text-slate-300 font-bold text-sm">
            {activeFilter === "all"
              ? "No training courses have been published yet."
              : `No ${activeFilter === "completed" ? "completed" : activeFilter} courses yet.`}
          </p>
          <p className="text-slate-600 text-xs mt-1">
            {activeFilter === "all"
              ? "Your administrator will publish materials soon. Check back later!"
              : `Try switching to a different filter to see available content.`}
          </p>
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="mt-4 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              View All Materials
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((m) => {
            const isCompleted = m.progress?.completed === true;
            const isInProgress = m.progress && !m.progress.completed;
            const progressPercent = getProgressPercent(m);

            return (
              <div
                key={m.id}
                className="group relative bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-200"
              >
                {/* Completed Overlay Badge */}
                {isCompleted && (
                  <div className="absolute top-3 right-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-800 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Top Row: Icon + Type badge */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${TYPE_BG[m.type]}`}>
                      {TYPE_ICON[m.type]}
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className={`inline-flex items-center self-start px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${TYPE_BADGE[m.type]}`}>
                        {m.type}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 line-clamp-2 leading-snug pr-6">{m.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {m.description || "No course description provided."}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {(isInProgress || isCompleted) && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          {isCompleted ? "Completed" : "In Progress"}
                        </span>
                        <span className={`text-[9px] font-bold ${isCompleted ? "text-emerald-400" : "text-indigo-400"}`}>
                          {isCompleted ? "100%" : `${progressPercent}%`}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-indigo-500"}`}
                          style={{ width: isCompleted ? "100%" : `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-800/60 pt-4 mt-4 flex justify-between items-center">
                  <span className="text-[10px] text-slate-600 font-mono">
                    {new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <Link
                    href={`/teacher/training/${m.id}`}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all duration-200 ${
                      isCompleted
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60 hover:bg-emerald-950/70"
                        : isInProgress
                        ? "bg-indigo-950/50 text-indigo-300 border-indigo-800/60 hover:bg-indigo-950/80"
                        : "bg-indigo-600 text-white border-transparent hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                    }`}
                  >
                    {isCompleted ? "Review" : isInProgress ? "Continue" : "Open Module"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
