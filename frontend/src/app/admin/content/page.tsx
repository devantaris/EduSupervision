"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Material {
  id: string;
  title: string;
  description: string;
  type: "video" | "pdf" | "document";
  file_url: string;
  created_at: string;
}

export default function AdminContentPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"video" | "pdf" | "document">("pdf");
  const [file, setFile] = useState<File | null>(null);
  
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
        throw new Error(errData.detail || "Failed to obtain upload authorization");
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
          file_url: s3_key, // using final key/static URL
        }),
      });

      if (!registerRes.ok) {
        const errData = await registerRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to finalize database metadata");
      }

      setUploadStatus("Success: Content catalog updated successfully.");
      setTitle("");
      setDescription("");
      setFile(null);
      setUploadProgress(null);

      // Refresh list
      fetchMaterials();
    } catch (err: any) {
      console.error(err);
      setUploadStatus(`Error: ${err.message || "Failed to upload content"}`);
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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Content Library</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload and manage curriculum textbooks, pedagogical videos, and guidelines for teaching staff.
        </p>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total Materials</span>
          <div className="text-3xl font-bold mt-2 text-indigo-400">{materials.length}</div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Videos Streamed</span>
          <div className="text-3xl font-bold mt-2 text-emerald-400">{totalVideos}</div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Documents/PDFs</span>
          <div className="text-3xl font-bold mt-2 text-amber-400">{totalPDFs}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 lg:col-span-1 h-fit">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Publish Material</h2>
            <p className="text-xs text-slate-500 mt-0.5">Distribute new educational units.</p>
          </div>

          <form onSubmit={handleUploadAndCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lesson Plan Methodology Guide"
                required
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Standard guidelines on formatting and pedagogical progression..."
                rows={3}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 placeholder:text-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Material Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="pdf">PDF Document</option>
                <option value="video">Instructional Video</option>
                <option value="document">Generic Document</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Upload File (Max 50MB)</label>
              <input
                type="file"
                accept={type === "video" ? "video/*" : "application/pdf"}
                onChange={handleFileChange}
                required
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-900/50 file:text-indigo-400 hover:file:bg-indigo-900 transition-colors text-xs cursor-pointer"
              />
            </div>

            {uploadProgress !== null && (
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>Uploading</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadStatus && (
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
              className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-xs transition-all shadow-md hover:shadow-indigo-500/10 ${
                loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            >
              {loading ? "Publishing..." : "Upload & Publish"}
            </button>
          </form>
        </div>

        {/* Materials Table Listing */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
              <div className="text-sm font-bold text-slate-200 font-semibold">Published Catalog</div>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-medium">
                Total: {materials.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              {materials.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  No materials published in the library. Use the publisher card to upload resources.
                </div>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <th className="px-6 py-3.5">Title / Course</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">Date Published</th>
                      <th className="px-6 py-3.5 text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                    {materials.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 max-w-xs md:max-w-sm">
                          <div className="font-semibold text-slate-200 truncate">{m.title}</div>
                          <div className="text-slate-500 text-[10px] mt-0.5 line-clamp-1">
                            {m.description || "No description provided."}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                              m.type === "video"
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                                : m.type === "pdf"
                                ? "bg-amber-950/60 text-amber-400 border border-amber-900/60"
                                : "bg-slate-800/60 text-slate-300 border border-slate-700/60"
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">
                          {new Date(m.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={m.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-850 hover:border-slate-800 px-2.5 py-1.5 rounded font-bold transition-all inline-block"
                          >
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
