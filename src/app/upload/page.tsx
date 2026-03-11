'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

interface DocumentSummary {
  documentType: string;
  date: string;
  patientInfo: string;
  keyFindings: string[];
  diagnoses: string[];
  recommendations: string[];
  overallAssessment: string;
}

interface UploadResult {
  filename: string;
  chunks: number;
  summary: DocumentSummary;
}

function SummaryCard({ result }: { result: UploadResult }) {
  const { filename, chunks, summary } = result;
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white border border-green-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-green-50 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-600 text-lg">✅</span>
            <span className="font-semibold text-green-900 truncate">{filename}</span>
          </div>
          <div className="flex gap-3 text-xs text-green-700">
            <span className="bg-green-100 px-2 py-0.5 rounded-full">{summary.documentType}</span>
            <span>{chunks} chunks indexed</span>
            {summary.date !== 'Not specified' && <span>{summary.date}</span>}
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-indigo-600 hover:underline shrink-0 mt-1"
        >
          {expanded ? 'Collapse' : 'Expand'} summary
        </button>
      </div>

      {expanded && (
        <div className="px-5 py-4 space-y-4 text-sm">
          {/* Patient info */}
          {summary.patientInfo !== 'Not specified' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Patient</p>
              <p className="text-gray-700">{summary.patientInfo}</p>
            </div>
          )}

          {/* Overall assessment */}
          {summary.overallAssessment && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-1">Assessment</p>
              <p className="text-indigo-900">{summary.overallAssessment}</p>
            </div>
          )}

          {/* Key findings */}
          {summary.keyFindings.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Key Findings</p>
              <ul className="space-y-1">
                {summary.keyFindings.map((f, i) => (
                  <li key={i} className="flex gap-2 text-gray-700">
                    <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Diagnoses */}
          {summary.diagnoses.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Diagnoses / Conditions</p>
              <ul className="space-y-1">
                {summary.diagnoses.map((d, i) => (
                  <li key={i} className="flex gap-2 text-gray-700">
                    <span className="text-red-400 mt-0.5 shrink-0">◆</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {summary.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Recommendations</p>
              <ul className="space-y-1">
                {summary.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2 text-gray-700">
                    <span className="text-teal-500 mt-0.5 shrink-0">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
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
              {uploading ? '⏳ Processing & generating summary…' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {/* Results with summaries */}
        {results && (
          <div className="space-y-4">
            {results.map((r) => (
              <SummaryCard key={r.filename} result={r} />
            ))}
            <Link
              href="/chat"
              className="block w-full text-center bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              Ask questions about these documents →
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
