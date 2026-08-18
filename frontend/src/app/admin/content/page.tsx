"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface Material {
  id: string;
  title: string;
  description: string;
  type: "video" | "pdf" | "document";
  file_url: string;
  created_at: string;
}

type ViewMode = "grid" | "list";

function TypeIcon({ type, size = "md" }: { type: Material["type"]; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "w-8 h-8" : size === "sm" ? "w-4 h-4" : "w-6 h-6";
  if (type === "video") {
    return (
      <svg className={sz} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }
  if (type === "pdf") {
    return (
      <svg className={sz} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  }
  return (
    <svg className={sz} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

const TYPE_STYLES: Record<Material["type"], string> = {
  video: "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60",
  pdf: "bg-amber-950/60 text-amber-400 border border-amber-900/60",
  document: "bg-slate-800/60 text-slate-300 border border-slate-700/60",
};

const TYPE_ICON_BG: Record<Material["type"], string> = {
  video: "bg-emerald-950/40 text-emerald-400",
  pdf: "bg-amber-950/40 text-amber-400",
  document: "bg-slate-800 text-slate-400",
};

export default function AdminContentPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"video" | "pdf" | "document">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      console.error("Failed to load materials catalog:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleUploadAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setUploadStatus("Error: Title and file are required.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setUploadStatus("Acquiring upload link...");

    try {
      // 1. Fetch Presigned/Mock upload URL
      const presignRes = await apiFetch("/api/v1/materials/presign", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          size: file.size,
        }),
      });

      if (!presignRes.ok) {
        const errData = await presignRes.json().catch(() => ({}));
        throw new Error((errData as { detail?: string }).detail || "Failed to obtain upload authorization");
      }

      const { upload_url, s3_key } = await presignRes.json();

      // 2. Perform direct upload (XHR for progress event tracking)
      setUploadStatus("Uploading file data...");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url, true);

        // For local mock uploads, Content-Type is important to preserve raw binary stream
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201 || xhr.status === 204) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status code: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network upload error"));
        xhr.send(file);
      });

      // 3. Register Material meta-data on FastAPI backend
      setUploadStatus("Finalizing material registry...");
      const registerRes = await apiFetch("/api/v1/materials", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || null,
          type,
          file_url: s3_key,
        }),
      });

      if (!registerRes.ok) {
        const errData = await registerRes.json().catch(() => ({}));
        throw new Error((errData as { detail?: string }).detail || "Failed to finalize database metadata");
      }

      setUploadStatus("Success: Content catalog updated successfully.");
      setTitle("");
      setDescription("");
      setFile(null);
      setUploadProgress(null);

      // Refresh list
      fetchMaterials();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to upload content";
      setUploadStatus(`Error: ${message}`);
      setUploadProgress(null);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const totalVideos = materials.filter((m) => m.type === "video").length;
  const totalPDFs = materials.filter((m) => m.type === "pdf" || m.type === "document").length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="border-b hairline-w pb-6">
        <h1 className="text-3xl font-cinzel font-bold text-parchment tracking-[0.1em] uppercase">Content Library</h1>
        <p className="text-slate-400 text-sm mt-1.5 font-playfair italic">
          Upload and manage curriculum textbooks, pedagogical videos, and guidelines for teaching staff.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Materials", value: materials.length, color: "text-brass" },
          { label: "Videos", value: totalVideos, color: "text-emerald-400" },
          { label: "PDFs / Docs", value: totalPDFs, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-obsidian border hairline rounded-xl p-6 shadow-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brass/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold mb-4">{s.label}</p>
              <p className={`text-4xl font-cinzel font-bold tracking-wider ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="bg-obsidian border hairline rounded-xl p-6 shadow-xl space-y-5 lg:col-span-1 h-fit relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brass/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 border-b hairline-w pb-4">
            <h2 className="text-lg font-cinzel font-bold text-parchment uppercase tracking-[0.1em]">Publish Material</h2>
            <p className="text-[10px] text-slate-500 mt-1 font-playfair italic">Distribute new educational units to teachers.</p>
          </div>

          <form onSubmit={handleUploadAndCreate} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lesson Plan Methodology Guide"
                required
                disabled={loading}
                className="field w-full bg-void border hairline rounded-md px-3 py-2 text-parchment placeholder:text-slate-700 text-xs focus:outline-none focus:border-brass/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Standard guidelines on formatting and pedagogical progression..."
                rows={3}
                disabled={loading}
                className="field w-full bg-void border hairline rounded-md p-3 text-parchment placeholder:text-slate-700 text-xs focus:outline-none focus:border-brass/50 transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">Material Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "video" | "pdf" | "document")}
                disabled={loading}
                className="field w-full bg-void border hairline rounded-md px-3 py-2 text-parchment text-xs focus:outline-none focus:border-brass/50 transition-colors cursor-pointer"
              >
                <option value="pdf">PDF Document</option>
                <option value="video">Instructional Video</option>
                <option value="document">Generic Document</option>
              </select>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">Upload File <span className="text-slate-600 font-normal normal-case tracking-normal font-playfair italic">(Max 50MB)</span></label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`relative border border-dashed rounded-md p-5 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  loading
                    ? "opacity-50 cursor-not-allowed hairline"
                    : isDragging
                    ? "border-brass bg-brass/10 cursor-copy"
                    : file
                    ? "border-emerald-700 bg-emerald-950/20 cursor-pointer"
                    : "hairline hover:border-brass/50 bg-void hover:bg-void/80 cursor-pointer"
                }`}
              >
                {file ? (
                  <>
                    <div className="w-9 h-9 rounded-full bg-emerald-950/60 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs text-emerald-400 font-semibold text-center truncate max-w-full px-2">{file.name}</p>
                    <p className="text-[10px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB — click to change</p>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">Drop file here or click to browse</p>
                    <p className="text-[10px] text-slate-600">
                      {type === "video" ? "MP4, MOV, WebM" : "PDF, DOCX, PPTX"}
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={type === "video" ? "video/*" : "application/pdf"}
                  onChange={handleFileChange}
                  required
                  disabled={loading}
                  className="hidden"
                />
              </div>
            </div>

            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>{uploadStatus || "Uploading..."}</span>
                  <span className="text-indigo-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-300 relative overflow-hidden"
                    style={{
                      width: `${uploadProgress}%`,
                      background: "linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)",
                      backgroundSize: "200% 100%",
                      animation: uploadProgress < 100 ? "shimmer 1.5s linear infinite" : "none",
                    }}
                  />
                </div>
              </div>
            )}

            {uploadStatus && uploadProgress === null && (
              <div
                className={`p-3 rounded-lg text-[10px] font-medium ${
                  uploadStatus.startsWith("Success")
                    ? "bg-emerald-950/50 border border-emerald-900 text-emerald-400"
                    : uploadStatus.startsWith("Error")
                    ? "bg-red-950/50 border border-red-900 text-red-400"
                    : "bg-slate-950 border border-slate-800 text-slate-400"
                }`}
              >
                {uploadStatus}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className={`w-full bg-gradient-to-r from-burgundy to-crimson border border-brass/30 text-parchment font-bold py-3 rounded-md text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 ${
                loading || !file ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin text-brass" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Publishing...
                </span>
              ) : (
                "Upload & Publish"
              )}
            </button>
          </form>
        </div>

        {/* Materials Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-obsidian border hairline rounded-xl overflow-hidden shadow-xl">
            {/* Catalog Header with View Toggle */}
            <div className="px-6 py-4 border-b hairline-w bg-void/50 flex justify-between items-center">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">Published Catalog</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-playfair italic">{materials.length} item{materials.length !== 1 ? "s" : ""} published</div>
              </div>
              <div className="flex items-center gap-2">
                {/* Grid/List Toggle */}
                <div className="flex items-center bg-void border hairline rounded-md p-0.5 gap-0.5">
                  {(["grid", "list"] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-2.5 py-1.5 rounded transition-all cursor-pointer ${
                        viewMode === mode
                          ? "bg-obsidian border hairline text-brass"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {mode === "grid" ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {materials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  </div>
                  <p className="text-slate-300 font-semibold text-sm">No materials published yet</p>
                  <p className="text-slate-600 text-xs mt-1">Use the publisher panel to upload your first resource.</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {materials.map((m) => (
                    <div
                      key={m.id}
                      className="bg-void border hairline rounded-xl p-4 hover:-translate-y-1 hover:shadow-xl hover:border-brass/50 transition-all duration-200 flex flex-col gap-3 group relative overflow-hidden"
                    >
                      {/* Card Top */}
                      <div className="flex items-start gap-3 relative z-10">
                        <div className={`w-10 h-10 rounded border hairline flex items-center justify-center shrink-0 ${TYPE_ICON_BG[m.type]}`}>
                          <TypeIcon type={m.type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-parchment line-clamp-1 leading-snug font-cinzel tracking-wider">{m.title}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${TYPE_STYLES[m.type]}`}>
                              {m.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-playfair italic">
                            {m.description || "No description provided."}
                          </p>
                        </div>
                      </div>
                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-3 border-t hairline-w relative z-10">
                        <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">
                          {new Date(m.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest bg-obsidian border hairline hover:border-brass/50 text-brass hover:text-parchment px-2.5 py-1.5 rounded-md font-bold transition-all cursor-pointer"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b hairline-w text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                        <th className="px-6 py-4">Title / Course</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Date Published</th>
                        <th className="px-6 py-4 text-right">Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y hairline-w text-xs text-slate-300">
                      {materials.map((m) => (
                        <tr key={m.id} className="hover:bg-void transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded border hairline flex items-center justify-center shrink-0 ${TYPE_ICON_BG[m.type]}`}>
                                <TypeIcon type={m.type} size="sm" />
                              </div>
                              <div>
                                <div className="font-bold text-parchment font-cinzel tracking-wider group-hover:text-brass transition-colors">{m.title}</div>
                                <div className="text-slate-500 text-[10px] mt-0.5 line-clamp-1 font-playfair italic">{m.description || "No description."}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${TYPE_STYLES[m.type]}`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">
                            {new Date(m.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <a
                              href={m.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest bg-obsidian border hairline hover:border-brass/50 text-brass px-3 py-1.5 rounded-md font-bold transition-all"
                            >
                              Download
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
