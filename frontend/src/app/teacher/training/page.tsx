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
  video: "bg-obsidian text-brass",
  pdf: "bg-void text-parchment",
  document: "bg-void text-parchment",
};

const TYPE_BADGE: Record<Material["type"], string> = {
  video: "bg-void text-brass border hairline",
  pdf: "bg-obsidian text-slate-300 border hairline",
  document: "bg-obsidian text-slate-300 border hairline",
};

function getProgressPercent(m: Material): number {
  if (!m.progress || m.progress.completed) return m.progress?.completed ? 100 : 0;
  return Math.min(Math.round(m.progress.position % 100), 99);
}

function SkeletonCard() {
  return (
    <div className="bg-obsidian border hairline rounded-xl p-6 space-y-5 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-xl bg-void border hairline" />
        <div className="w-20 h-5 rounded-full bg-void border hairline" />
      </div>
      <div className="space-y-3">
        <div className="h-5 bg-void rounded w-3/4" />
        <div className="h-3 bg-void rounded w-full" />
        <div className="h-3 bg-void rounded w-2/3" />
      </div>
      <div className="h-1 bg-void rounded-full" />
      <div className="flex justify-between items-center pt-2 border-t hairline">
        <div className="h-3 w-16 bg-void rounded" />
        <div className="h-8 w-24 bg-void rounded-md" />
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b hairline pb-6">
        <div>
          <h1 className="font-cinzel text-3xl uppercase tracking-widest text-parchment">Training Library</h1>
          <p className="font-jakarta text-slate-400 text-sm mt-2">
            Review curriculum documents, stream pedagogical instructional videos, and track your completion status.
          </p>
        </div>

        {!loading && materials.length > 0 && (
          <div className="flex items-center gap-4 shrink-0 bg-obsidian border hairline p-4 rounded-xl">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                <span className="text-emerald-400">{completedCount}</span> COMPLETED ·{" "}
                <span className="text-brass">{inProgressCount}</span> IN PROGRESS
              </div>
              <div className="w-48 h-1.5 bg-void border hairline rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-burgundy to-brass rounded-full transition-all duration-1000"
                  style={{ width: materials.length > 0 ? `${Math.round((completedCount / materials.length) * 100)}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-obsidian border hairline rounded-md p-1 w-fit">
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
              className={`flex items-center gap-2 px-4 py-2 rounded text-[10px] uppercase tracking-widest font-semibold transition-all duration-200 cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-void text-brass border hairline shadow-sm"
                  : "text-slate-500 border border-transparent hover:text-parchment hover:bg-void/50"
              }`}
            >
              {tab.label}
              {!loading && (
                <span
                  className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm ${
                    activeFilter === tab.id ? "bg-obsidian text-brass border hairline" : "bg-void text-slate-600 border hairline"
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
        <div className="flex flex-col items-center justify-center py-24 text-center bg-obsidian border hairline rounded-xl">
          <div className="w-16 h-16 rounded-xl bg-void border hairline flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="font-cinzel text-lg text-parchment tracking-widest uppercase mb-2">
            {activeFilter === "all"
              ? "No training courses published"
              : `No ${activeFilter === "completed" ? "completed" : activeFilter} courses yet`}
          </h3>
          <p className="font-jakarta text-slate-500 text-sm max-w-md leading-relaxed">
            {activeFilter === "all"
              ? "Your administrator will publish pedagogical materials soon. Check back later for updates."
              : `Try switching to a different filter to see available content.`}
          </p>
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="mt-6 px-5 py-2.5 rounded-md bg-void border hairline hover:border-brass/50 text-brass text-[10px] uppercase tracking-widest font-semibold transition-all cursor-pointer"
            >
              VIEW ALL MATERIALS
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
                className="group relative bg-obsidian border hairline hover:border-brass/40 rounded-xl p-6 flex flex-col justify-between hover:shadow-[0_0_20px_rgba(197,163,103,0.05)] transition-all duration-300"
              >
                {/* Completed Overlay Badge */}
                {isCompleted && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="w-8 h-8 rounded-full bg-void border hairline border-emerald-900/50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Top Row: Icon + Type badge */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl border hairline flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${TYPE_BG[m.type]}`}>
                      {TYPE_ICON[m.type]}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0 pt-1">
                      <span className={`inline-flex items-center self-start px-2.5 py-1 rounded-sm text-[8px] font-black uppercase tracking-[0.22em] ${TYPE_BADGE[m.type]}`}>
                        {m.type}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-playfair text-base font-semibold text-parchment line-clamp-2 leading-snug pr-8">{m.title}</h3>
                    <p className="font-jakarta text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {m.description || "No course description provided."}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {(isInProgress || isCompleted) && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">
                          {isCompleted ? "Completed" : "In Progress"}
                        </span>
                        <span className={`text-[9px] font-bold ${isCompleted ? "text-emerald-400" : "text-brass"}`}>
                          {isCompleted ? "100%" : `${progressPercent}%`}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-void border hairline rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-burgundy to-brass"}`}
                          style={{ width: isCompleted ? "100%" : `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t hairline pt-5 mt-6 flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-slate-600 font-jakarta">
                    {new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <Link
                    href={`/teacher/training/${m.id}`}
                    className={`text-[10px] uppercase tracking-[0.22em] font-semibold px-4 py-2 rounded-md transition-all duration-300 border ${
                      isCompleted
                        ? "bg-void text-emerald-400 border-emerald-900/40 hover:bg-obsidian"
                        : isInProgress
                        ? "bg-void text-brass border-brass/40 hover:bg-obsidian"
                        : "bg-gradient-to-r from-burgundy to-crimson text-parchment border-brass/30 hover:brightness-110 shadow-[0_0_10px_rgba(153,27,27,0.2)]"
                    }`}
                  >
                    {isCompleted ? "REVIEW" : isInProgress ? "CONTINUE" : "OPEN MODULE"}
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
