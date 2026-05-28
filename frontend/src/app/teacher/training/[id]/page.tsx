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

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSeeked = useRef(false);

  // Activate telemetry hook
  const { onTimeUpdate } = useVideoProgress(id);

  useEffect(() => {
    fetchMaterial();
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

  // Restore previous playback position
  useEffect(() => {
    if (material && material.type === "video" && videoRef.current && !hasSeeked.current) {
      const initialPos = material.progress?.position || 0;
      if (initialPos > 0) {
        videoRef.current.currentTime = initialPos;
        setStatusMessage(`Resumed from last saved position: ${formatTime(initialPos)}`);
        setTimeout(() => setStatusMessage(null), 5000);
      }
      hasSeeked.current = true;
    }
  }, [material]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    onTimeUpdate(e.currentTarget.currentTime);
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
        setStatusMessage("Module Completed!");
        setTimeout(() => setStatusMessage(null), 5000);
        // Refresh local details state
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
          position: 1.0, // dummy reading coordinate represent pages or percentage
          completed: true,
        }),
      });
      if (res.ok) {
        setStatusMessage("Module marked as read/completed.");
        setTimeout(() => setStatusMessage(null), 4000);
        fetchMaterial();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingComplete(false);
    }
  };

  if (loading) {
    return <div className="text-center py-24 text-slate-500">Loading module files...</div>;
  }

  if (error || !material) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-4">
        <div className="text-red-400 text-sm font-semibold">{error || "Course resource missing."}</div>
        <a href="/teacher/training" className="text-indigo-400 text-xs font-bold hover:underline block">
          &larr; Return to Library
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex justify-between items-center">
        <a href="/teacher/training" className="text-xs text-slate-500 hover:text-slate-300 font-semibold flex items-center gap-1.5 transition-colors">
          &larr; Back to Catalog
        </a>
        <div className="flex items-center gap-2">
          {material.progress?.completed ? (
            <span className="text-[10px] font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded-full">
              Completed
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase bg-indigo-950/60 text-indigo-400 border border-indigo-900/60 px-2 py-0.5 rounded-full">
              In Progress
            </span>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-indigo-950/60 border border-indigo-900 text-indigo-400 text-xs font-semibold rounded-xl text-center shadow-lg transition-all animate-pulse">
          {statusMessage}
        </div>
      )}

      {/* Main Course Player Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="aspect-video bg-black flex items-center justify-center relative">
          {material.type === "video" ? (
            <video
              ref={videoRef}
              src={material.file_url}
              controls
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-8 space-y-4">
              <svg className="w-16 h-16 text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-200">PDF Reader Document</div>
                <div className="text-xs text-slate-500">This module is a reading document assignment.</div>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <a
                  href={material.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  Download/View PDF File
                </a>
                {!material.progress?.completed && (
                  <button
                    onClick={handleMarkAsRead}
                    disabled={markingComplete}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                  >
                    {markingComplete ? "Marking..." : "Mark as Completed"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-3">
          <h1 className="text-xl font-bold text-slate-100">{material.title}</h1>
          <p className="text-xs text-slate-400 leading-relaxed">{material.description || "No curriculum course description provided."}</p>
        </div>
      </div>
    </div>
  );
}
