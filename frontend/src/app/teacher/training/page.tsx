"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

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

export default function TeacherTrainingPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderProgressBadge = (material: Material) => {
    if (!material.progress) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/60">
          Not Started
        </span>
      );
    }

    if (material.progress.completed) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
          Completed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/60 text-indigo-400 border border-indigo-900/60">
        In Progress
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Training Library</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review curriculum documents, stream pedagogical instructional videos, and check your completion status.
        </p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="text-sm font-bold text-slate-200 mb-6 font-semibold">Assigned Materials</div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading course catalog...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No training courses have been published by your administrator yet. Check back later!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((m) => (
              <div
                key={m.id}
                className="bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        m.type === "video"
                          ? "bg-emerald-900/40 text-emerald-400"
                          : m.type === "pdf"
                          ? "bg-amber-900/40 text-amber-400"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {m.type}
                    </span>
                    {renderProgressBadge(m)}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-200 line-clamp-1">{m.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {m.description || "No course description provided."}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-4 mt-5 flex justify-between items-center text-[10px]">
                  <span className="text-slate-600 font-mono">
                    {new Date(m.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  
                  <a
                    href={`/teacher/training/${m.id}`}
                    className="bg-indigo-650 hover:bg-indigo-650 text-indigo-100 hover:text-white font-bold px-3.5 py-1.5 rounded-lg border border-indigo-700/60 hover:border-indigo-600 transition-colors shadow-sm"
                  >
                    Open Module
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
