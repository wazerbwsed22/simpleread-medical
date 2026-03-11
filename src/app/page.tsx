import Link from "next/link";
import { FileText, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#fafafa] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight">
            Understand Medical Records
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Upload your medical documents and use clinical AI to extract
            findings, diagnoses, and recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
          <Link
            href="/upload"
            className="group bg-white rounded-xl p-8 border border-slate-200 hover:border-teal-500 hover:ring-1 hover:ring-teal-500 transition-all text-left flex flex-col h-full"
          >
            <div className="mb-6 p-3 bg-slate-50 rounded-lg w-fit group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-2">
              Upload Documents
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Add PDFs, Word docs, or text files to your medical knowledge base
              for analysis.
            </p>
          </Link>

          <Link
            href="/chat"
            className="group bg-white rounded-xl p-8 border border-slate-200 hover:border-teal-500 hover:ring-1 hover:ring-teal-500 transition-all text-left flex flex-col h-full"
          >
            <div className="mb-6 p-3 bg-slate-50 rounded-lg w-fit group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-2">
              Ask Questions
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Query your uploaded medical documents to find specific information
              quickly.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
