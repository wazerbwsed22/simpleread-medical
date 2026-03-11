'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

interface UploadResult {
  filename: string;
  chunks: number;
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      ['.pdf', '.txt', '.md', '.doc', '.docx'].some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    setResults(null);

    const form = new FormData();
    files.forEach((f) => form.append('files', f));

    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setResults(data.results);
      setFiles([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm">← Home</Link>
          <h1 className="text-2xl font-bold text-indigo-900">Upload Medical Documents</h1>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
            dragging ? 'border-indigo-500 bg-indigo-50' : 'border-indigo-300 bg-white'
          }`}
        >
          <p className="text-4xl mb-3">📎</p>
          <p className="text-gray-600 mb-4">Drag & drop files here, or click to browse</p>
          <p className="text-sm text-gray-400 mb-4">Supports PDF, Word (.doc/.docx), TXT, Markdown</p>
          <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm">
            Browse files
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.md,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4 space-y-2">
            <p className="font-medium text-gray-700 mb-2">Files to upload:</p>
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-700 truncate">{f.name}</span>
                <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 text-xs ml-4">
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {uploading ? 'Processing & indexing…' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="font-semibold text-green-800 mb-3">✅ Successfully ingested:</p>
            {results.map((r) => (
              <div key={r.filename} className="flex justify-between text-sm text-green-700">
                <span>{r.filename}</span>
                <span>{r.chunks} chunks indexed</span>
              </div>
            ))}
            <Link href="/chat" className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-medium">
              Start asking questions →
            </Link>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
