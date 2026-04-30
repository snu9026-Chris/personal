"use client";

import { BookOpen, Clock, Download, RefreshCw, Trash2, Loader2 } from "lucide-react";
import type { Report } from "@/lib/types";
import { DIFFICULTY_CONFIG } from "@/lib/constants";

interface Props {
  report: Report;
  isSelected: boolean;
  isRegenerating: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPdf: () => void;
  onRegenerate: () => void;
}

export default function ReportCard({
  report, isSelected, isRegenerating, onSelect, onDelete, onPdf, onRegenerate,
}: Props) {
  const canRegenerate = !!report.original_content;
  const diff = DIFFICULTY_CONFIG[report.difficulty as keyof typeof DIFFICULTY_CONFIG] ?? DIFFICULTY_CONFIG.medium;
  const date = report.created_at
    ? new Date(report.created_at).toLocaleDateString("ko-KR", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "";

  return (
    <div
      onClick={onSelect}
      className={`card overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col cursor-pointer ${
        isSelected ? "ring-2 ring-brand-400 shadow-md" : ""
      }`}
    >
      <div className={`h-1.5 ${isSelected ? "bg-gradient-to-r from-brand-500 to-purple-600" : "bg-gradient-to-r from-brand-400 to-purple-500"}`} />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{report.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{report.subject}</p>
          </div>
          <span className={`badge text-xs flex-shrink-0 ${diff.color}`}>{diff.label}</span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1 mb-4">{report.summary}</p>

        {report.tags?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {report.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge bg-gray-100 text-gray-500 text-xs">{tag}</span>
            ))}
            {report.tags.length > 3 && (
              <span className="badge bg-gray-100 text-gray-400 text-xs">+{report.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Clock size={12} />
          {date}
        </div>

        <div className="flex items-center gap-2 border-t border-gray-50 pt-4">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="btn-secondary text-xs py-1.5 flex-1 justify-center"
          >
            {isSelected ? "보는 중" : "전체 보기"}
            <BookOpen size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPdf(); }}
            className="btn-secondary text-xs py-1.5 px-3"
            title="PDF 다운로드"
          >
            <Download size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            disabled={!canRegenerate || isRegenerating}
            className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            title={canRegenerate ? "AI 보고서 재생성 (원본 보존)" : "원본이 저장돼 있지 않아 재생성 불가"}
          >
            {isRegenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="btn-danger text-xs py-1.5 px-3"
            title="삭제"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
