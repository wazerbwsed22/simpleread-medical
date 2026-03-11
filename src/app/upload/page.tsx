'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Upload, File, FileText, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ArrowRight, Loader2, X, MessageSquare, HelpCircle, RotateCcw, User, Stethoscope } from 'lucide-react';

interface PatientInfo {
  name: string;
  dateOfBirth: string;
  age: string;
  sex: string;
  id: string;
}

interface Recommendation {
  title: string;
  explanation: string;
}

interface FollowUpQuestions {
  pcp: string[];
  specialists: { specialty: string; questions: string[] }[];
}

interface DocumentSummary {
  documentType: string;
  date: string;
  patientInfo: PatientInfo;
  keyFindings: string[];
  diagnoses: string[];
  recommendations: Recommendation[];
  overallAssessment: string;
  followUpQuestions: FollowUpQuestions;
}

type IngestEvent =
  | { type: 'progress'; message: string }
  | { type: 'result'; filename: string; chunks: number; summary: DocumentSummary }
  | { type: 'error'; filename: string; message: string }
  | { type: 'done' };

interface UploadResult {
  filename: string;
  chunks: number;
  summary: DocumentSummary;
}

function hasPatientInfo(info: PatientInfo): boolean {
  return Object.values(info).some((v) => v && v !== 'Not specified');
}

function PatientInfoField({ label, value }: { label: string; value: string }) {
  if (!value || value === 'Not specified') return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="text-slate-800 font-medium text-sm">{value}</p>
    </div>
  );
}

function SummaryCard({ result }: { result: UploadResult }) {
  const { filename, chunks, summary } = result;
  const [expanded, setExpanded] = useState(true);
  const hasFollowUps =
    summary.followUpQuestions &&
    (summary.followUpQuestions.pcp?.length > 0 || summary.followUpQuestions.specialists?.length > 0);

  return (
    <div className="bg-white border border-slate-200 border-l-4 border-l-teal-500 rounded-lg overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4 bg-white border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            <span className="font-medium text-slate-900 truncate font-mono text-sm">{filename}</span>
          </div>
          <div className="flex gap-3 text-xs text-slate-500">
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{summary.documentType}</span>
            <span className="flex items-center">{chunks} chunks indexed</span>
            {summary.date !== 'Not specified' && <span className="flex items-center">{summary.date}</span>}
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-5 py-5 space-y-6 text-sm">
          {/* Patient info — structured grid */}
          {hasPatientInfo(summary.patientInfo) && (
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Patient Information</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                <PatientInfoField label="Name" value={summary.patientInfo.name} />
                <PatientInfoField label="Date of Birth" value={summary.patientInfo.dateOfBirth} />
                <PatientInfoField label="Age" value={summary.patientInfo.age} />
                <PatientInfoField label="Sex" value={summary.patientInfo.sex} />
                <PatientInfoField label="Patient ID" value={summary.patientInfo.id} />
              </div>
            </div>
          )}

          {/* Clinical assessment */}
          {summary.overallAssessment && (
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Clinical Assessment</p>
              <p className="text-slate-800 leading-relaxed">{summary.overallAssessment}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summary.keyFindings.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Key Findings</p>
                <ul className="space-y-2">
                  {summary.keyFindings.map((f, i) => (
                    <li key={i} className="flex gap-3 text-slate-700 items-start">
                      <span className="text-slate-300 mt-1 shrink-0 text-[10px]">■</span>
                      <span className="leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.diagnoses.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Diagnoses / Conditions</p>
                <ul className="space-y-2">
                  {summary.diagnoses.map((d, i) => (
                    <li key={i} className="flex gap-3 text-slate-700 items-start">
                      <span className="text-slate-300 mt-1 shrink-0 text-[10px]">■</span>
                      <span className="leading-relaxed">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations with explanations */}
          {summary.recommendations.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Recommendations & Plan</p>
              <div className="space-y-3">
                {summary.recommendations.map((r, i) => (
                  <div key={i} className="bg-teal-50/50 border border-teal-100 rounded-lg px-4 py-3">
                    <div className="flex gap-3 items-start">
                      <ArrowRight className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-900 font-medium leading-snug">{r.title}</p>
                        {r.explanation && (
                          <p className="text-slate-600 leading-relaxed mt-1">{r.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up questions — PCP vs specialists */}
          {hasFollowUps && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Questions for Your Doctors</p>
              </div>

              <div className="space-y-4">
                {summary.followUpQuestions.pcp?.length > 0 && (
                  <div className="bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-2.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Primary Care Provider</p>
                    </div>
                    <ul className="space-y-2">
                      {summary.followUpQuestions.pcp.map((q, i) => (
                        <li key={i} className="flex gap-2.5 text-slate-700 items-start">
                          <span className="text-blue-400 font-medium shrink-0 mt-px">?</span>
                          <span className="leading-relaxed">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.followUpQuestions.specialists?.map((spec, si) => (
                  spec.questions?.length > 0 && (
                    <div key={si} className="bg-purple-50/60 border border-purple-100 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 mb-2.5">
                        <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">{spec.specialty}</p>
                      </div>
                      <ul className="space-y-2">
                        {spec.questions.map((q, qi) => (
                          <li key={qi} className="flex gap-2.5 text-slate-700 items-start">
                            <span className="text-purple-400 font-medium shrink-0 mt-px">?</span>
                            <span className="leading-relaxed">{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </div>
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
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [errors, setErrors] = useState<{ filename: string; message: string }[]>([]);
  const [done, setDone] = useState(false);
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
    setProgressMsg(null);
    setResults([]);
    setErrors([]);
    setDone(false);

    const form = new FormData();
    files.forEach((f) => form.append('files', f));

    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: form });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Upload failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as IngestEvent;
            if (event.type === 'progress') {
              setProgressMsg(event.message);
            } else if (event.type === 'result') {
              setResults((prev) => [...prev, { filename: event.filename, chunks: event.chunks, summary: event.summary }]);
              setProgressMsg(null);
            } else if (event.type === 'error') {
              setErrors((prev) => [...prev, { filename: event.filename, message: event.message }]);
            } else if (event.type === 'done') {
              setDone(true);
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }

      setFiles([]);
    } catch (e) {
      setErrors((prev) => [...prev, { filename: 'Upload', message: e instanceof Error ? e.message : 'Something went wrong' }]);
    } finally {
      setUploading(false);
      setProgressMsg(null);
    }
  };

  const showUploadArea = results.length === 0 && !uploading;

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setErrors([]);
    setDone(false);
    setProgressMsg(null);
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#fafafa] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Upload Medical Documents</h1>
          <p className="text-slate-500 text-sm">Add clinical notes, lab results, or imaging reports for analysis.</p>
        </div>

        {showUploadArea && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragging ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-slate-700 font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-sm text-slate-500 mb-6">PDF, Word, TXT, or Markdown files</p>
              <label className="cursor-pointer bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm font-medium shadow-sm">
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

            {files.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Selected Files ({files.length})
                </h3>
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-md px-4 py-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <File className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-700 font-mono truncate">{f.name}</span>
                      </div>
                      <button
                        onClick={() => removeFile(i)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-teal-600 text-white py-2.5 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Upload and Analyze
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Live progress indicator */}
        {progressMsg && (
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-5 py-4 text-slate-700 text-sm shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
            <span className="font-mono text-xs">{progressMsg}</span>
          </div>
        )}

        {/* Per-file results with summaries */}
        {results.length > 0 && (
          <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-lg font-medium text-slate-900">Analysis Results</h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Upload another
              </button>
            </div>
            <div className="space-y-4">
              {results.map((r) => (
                <SummaryCard key={r.filename} result={r} />
              ))}
            </div>
            {done && (
              <div className="pt-6">
                <Link
                  href="/chat"
                  className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ask questions about these documents
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Per-file errors */}
        {errors.length > 0 && (
          <div className="space-y-3 mt-6">
            {errors.map((e, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-4 text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-medium block mb-1">{e.filename}</span>
                  <span className="opacity-90">{e.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
