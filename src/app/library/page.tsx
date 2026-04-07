"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Search, Loader2, Tag, Trash2,
  Download, Clock, Plus, Brain, X,
} from "lucide-react";
import { Report } from "@/lib/supabase";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import ReportPreview from "@/components/ReportPreview";

// ──────────────────────────────────────────
export default function LibraryPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const { reports: data } = await res.json();
      setReports(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // 탭 복귀 시 자동 갱신
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchReports();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchReports]);

  const handleDelete = async (id: string) => {
    if (!confirm("이 보고서를 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePdf = (id: string) => {
    setSelectedId(id);
    // 우측 패널이 마운트된 후 인쇄 (이미지/마크다운 렌더링 시간 확보)
    setTimeout(() => window.print(), 400);
  };

  // ── 필터링 ──
  const allTags = Array.from(new Set(reports.flatMap((r) => r.tags ?? [])));
  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.title.toLowerCase().includes(q) ||
      r.subject?.toLowerCase().includes(q) ||
      r.summary?.toLowerCase().includes(q);
    const matchTag = !selectedTag || (r.tags ?? []).includes(selectedTag);
    return matchSearch && matchTag;
  });

  const selectedReport = reports.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* 헤더 */}
      <div className="no-print bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="text-emerald-500" size={24} />
              내 보고서 라이브러리
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              총 {reports.length}개의 학습 보고서가 저장되어 있습니다
            </p>
          </div>
          <Link href="/study" className="btn-primary">
            <Plus size={16} />
            새 보고서 만들기
          </Link>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex gap-5 items-start">
          {/* ────── 좌측: 카드 리스트 (sticky) ────── */}
          <div
            className={`no-print space-y-5 transition-all ${
              selectedReport
                ? "w-[420px] flex-shrink-0 sticky top-4 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-1"
                : "flex-1"
            }`}
          >
            {/* 검색 & 필터 */}
            <div className="card p-4 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="제목, 과목, 내용으로 검색..."
                  className="input-field pl-10"
                />
              </div>

              {allTags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">태그:</span>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`badge cursor-pointer transition-colors ${
                      !selectedTag ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    전체
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                      className={`badge cursor-pointer transition-colors ${
                        selectedTag === tag ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Tag size={10} className="mr-1" />{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 로딩 */}
            {loading && (
              <div className="card p-16 flex flex-col items-center gap-4">
                <Loader2 size={32} className="animate-spin text-brand-400" />
                <p className="text-gray-500">보고서를 불러오는 중...</p>
              </div>
            )}

            {/* 빈 상태 */}
            {!loading && filtered.length === 0 && (
              <div className="card p-16 flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <Brain size={36} className="text-gray-300" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-400">
                    {search || selectedTag ? "검색 결과가 없습니다" : "아직 저장된 보고서가 없습니다"}
                  </p>
                  {!search && !selectedTag && (
                    <Link href="/study" className="text-brand-500 text-sm underline mt-1 inline-block">
                      첫 번째 보고서 만들기 →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* 보고서 카드들 */}
            {!loading && filtered.length > 0 && (
              <div className={`grid gap-4 ${selectedReport ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"}`}>
                {filtered.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    isSelected={selectedId === report.id}
                    onSelect={() => setSelectedId(report.id ?? null)}
                    onDelete={() => handleDelete(report.id!)}
                    onPdf={() => handlePdf(report.id!)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ────── 우측: 풀 미리보기 패널 ────── */}
          {selectedReport && (
            <div className="flex-1 min-w-0 print:w-full">
              <div className="no-print sticky top-4 z-10 mb-3 flex items-center justify-between gap-3 bg-white card px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen size={16} className="text-brand-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700 truncate">
                    {selectedReport.title}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="btn-secondary text-xs py-1.5 px-2.5"
                  title="닫기"
                >
                  <X size={14} />
                </button>
              </div>

              <ReportPreview
                report={selectedReport}
                onPdfDownload={() => handlePdf(selectedReport.id!)}
                showActions={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// 보고서 카드 (요약 - 클릭으로 우측 패널 열기)
// ──────────────────────────────────────────
interface ReportCardProps {
  report: Report;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPdf: () => void;
}

function ReportCard({ report, isSelected, onSelect, onDelete, onPdf }: ReportCardProps) {
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
      {/* 색상 상단 바 */}
      <div className={`h-1.5 ${isSelected ? "bg-gradient-to-r from-brand-500 to-purple-600" : "bg-gradient-to-r from-brand-400 to-purple-500"}`} />

      <div className="p-5 flex-1 flex flex-col">
        {/* 메타 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
              {report.title}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{report.subject}</p>
          </div>
          <span className={`badge text-xs flex-shrink-0 ${diff.color}`}>{diff.label}</span>
        </div>

        {/* 요약 */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1 mb-4">
          {report.summary}
        </p>

        {/* 태그 */}
        {report.tags?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {report.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge bg-gray-100 text-gray-500 text-xs">
                {tag}
              </span>
            ))}
            {report.tags.length > 3 && (
              <span className="badge bg-gray-100 text-gray-400 text-xs">
                +{report.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 날짜 */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Clock size={12} />
          {date}
        </div>

        {/* 액션 */}
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
