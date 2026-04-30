"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Search, Loader2, Tag, Plus, Brain, X } from "lucide-react";
import ReportPreview from "@/components/ReportPreview";
import ReportCard from "@/components/library/ReportCard";
import { exportReportPdf } from "@/lib/pdf";
import { useReports } from "@/hooks/useReports";
import { useToast } from "@/components/Toast";
import { summarize } from "@/lib/api";
import type { Report } from "@/lib/types";

export default function LibraryPage() {
  const { reports, isLoading, update, remove } = useReports();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("이 보고서를 삭제하시겠습니까?")) return;
    try {
      await remove(id);
      if (selectedId === id) setSelectedId(null);
      toast.success("보고서를 삭제했습니다.");
    } catch (e) {
      toast.error(`삭제 실패: ${(e as Error).message}`);
    }
  };

  const handlePdf = async (report: Report) => {
    if (!report.id) return;
    setSelectedId(report.id);
    // 마크다운/이미지 렌더 시간 확보 (next paint cycle 후 캡처)
    await new Promise((r) => setTimeout(r, 600));
    try {
      await exportReportPdf("report-content", report.title);
      toast.success("PDF를 다운로드했습니다.");
    } catch (e) {
      console.error(e);
      toast.error("PDF 다운로드 실패. 다시 시도해주세요.");
    }
  };

  const handleRegenerate = async (report: Report) => {
    if (!report.id || !report.original_content) return;
    if (!confirm(
      "이 보고서를 현재 SKILL 로직으로 재생성합니다.\n원본은 그대로 유지되고, 슬라이드 내용만 새로 생성됩니다.\n진행할까요?",
    )) return;

    setRegeneratingId(report.id);
    try {
      const { report: regenerated } = await summarize(report.original_content, report.title);
      await update({
        id: report.id,
        title: regenerated.title || report.title,
        subject: regenerated.subject ?? report.subject,
        difficulty: regenerated.difficulty ?? report.difficulty,
        summary: regenerated.summary ?? "",
        key_points: regenerated.key_points ?? [],
        sections: regenerated.sections ?? [],
        vocabulary: regenerated.vocabulary ?? [],
        study_tips: regenerated.study_tips ?? [],
        tags: regenerated.tags ?? report.tags,
        original_content: report.original_content,
      });
      toast.success("보고서를 재생성했습니다.");
    } catch (e) {
      toast.error(`재생성 실패: ${(e as Error).message}`);
    } finally {
      setRegeneratingId(null);
    }
  };

  const allTags = useMemo(
    () => Array.from(new Set(reports.flatMap((r) => r.tags ?? []))),
    [reports],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reports.filter((r) => {
      const matchSearch = !q ||
        r.title.toLowerCase().includes(q) ||
        r.subject?.toLowerCase().includes(q) ||
        r.summary?.toLowerCase().includes(q);
      const matchTag = !selectedTag || (r.tags ?? []).includes(selectedTag);
      return matchSearch && matchTag;
    });
  }, [reports, search, selectedTag]);

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedId) ?? null,
    [reports, selectedId],
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
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
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <div
            className={`no-print space-y-5 transition-all w-full ${
              selectedReport
                ? "hidden lg:block lg:w-[420px] lg:flex-shrink-0 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1"
                : "lg:flex-1"
            }`}
          >
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

            {isLoading && (
              <div className="card p-16 flex flex-col items-center gap-4">
                <Loader2 size={32} className="animate-spin text-brand-400" />
                <p className="text-gray-500">보고서를 불러오는 중...</p>
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
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

            {!isLoading && filtered.length > 0 && (
              <div className={`grid gap-4 ${selectedReport ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"}`}>
                {filtered.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    isSelected={selectedId === report.id}
                    isRegenerating={regeneratingId === report.id}
                    onSelect={() => setSelectedId(report.id ?? null)}
                    onDelete={() => handleDelete(report.id!)}
                    onPdf={() => handlePdf(report)}
                    onRegenerate={() => handleRegenerate(report)}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedReport && (
            <div className="w-full lg:flex-1 min-w-0 print:w-full">
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
                  title="목록으로"
                >
                  <X size={14} />
                  <span className="lg:hidden ml-1">목록</span>
                </button>
              </div>

              <ReportPreview report={selectedReport} showActions={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
