"use client";

import { useState } from "react";
import {
  Brain, Lightbulb, GraduationCap, Edit3, BookOpen, Tag, Sparkles,
  Download, Save, CheckCircle, Loader2,
} from "lucide-react";
import { Report, ReportSection } from "@/lib/supabase";
import { DIFFICULTY_CONFIG, type DifficultyType } from "@/lib/constants";
import MarkdownContent from "@/components/MarkdownContent";
import { exportReportPdf } from "@/lib/pdf";

// ──────────────────────────────────────────
// 섹션 타입별 아이콘
// ──────────────────────────────────────────
const SECTION_ICONS: Record<string, React.ReactNode> = {
  concept:    <Brain size={18} className="text-brand-500" />,
  example:    <Lightbulb size={18} className="text-amber-500" />,
  exercise:   <GraduationCap size={18} className="text-emerald-500" />,
  note:       <Edit3 size={18} className="text-purple-500" />,
  summary:    <BookOpen size={18} className="text-blue-500" />,
  comparison: <Tag size={18} className="text-cyan-500" />,
  process:    <Sparkles size={18} className="text-fuchsia-500" />,
};

// ──────────────────────────────────────────
// 섹션 레이아웃 렌더러 (logic.summary skill layout 기반)
// ──────────────────────────────────────────
export function SectionRenderer({ section }: { section: ReportSection }) {
  const layout = section.layout ?? "bullets";

  return (
    <div className="space-y-4">
      {section.key_message && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gradient-to-r from-brand-50 to-brand-100/40 border border-brand-200/60 print:bg-brand-50 print:border-brand-200">
          <span className="text-brand-500 text-lg leading-none mt-0.5">🎯</span>
          <p className="text-sm text-brand-900 font-medium leading-relaxed">
            {section.key_message}
          </p>
        </div>
      )}

      {layout === "cards" && section.points && section.points.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-3 print:grid-cols-2">
          {section.points.map((pt, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm print:shadow-none print:break-inside-avoid">
              <div className="flex items-start gap-2 mb-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="font-semibold text-gray-900 text-sm leading-snug">{pt.term}</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{pt.explanation}</p>
              {pt.example && (
                <p className="text-xs text-gray-500 mt-2 pl-2 border-l-2 border-brand-200">
                  💡 {pt.example}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : layout === "definition" && section.points && section.points.length > 0 ? (
        <dl className="space-y-3">
          {section.points.map((pt, idx) => (
            <div key={idx} className="border-l-4 border-brand-300 bg-brand-50/40 rounded-r-xl px-4 py-3 print:break-inside-avoid">
              <dt className="font-bold text-brand-700 text-sm mb-1">{pt.term}</dt>
              <dd className="text-sm text-gray-700 leading-relaxed">{pt.explanation}</dd>
              {pt.example && (
                <dd className="text-xs text-gray-500 mt-1.5 italic">예: {pt.example}</dd>
              )}
            </div>
          ))}
        </dl>
      ) : (
        <MarkdownContent content={section.content} />
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// 슬라이드 데이터 빌더
// ──────────────────────────────────────────
interface SlideData {
  type: "title" | "section" | "vocabulary" | "tips";
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

function buildSlides(report: Report): SlideData[] {
  const diff = DIFFICULTY_CONFIG[report.difficulty as DifficultyType] ?? DIFFICULTY_CONFIG.medium;
  const slides: SlideData[] = [];

  // 0. 타이틀 + 요약 + 핵심 포인트
  slides.push({
    type: "title",
    title: report.title,
    icon: <Brain size={22} className="text-brand-500" />,
    content: (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className={`badge text-sm font-medium ${diff.color}`}>{diff.label}</span>
            <span className="badge bg-brand-50 text-brand-600">📚 {report.subject || "일반"}</span>
            {(report.tags ?? []).map((tag) => (
              <span key={tag} className="badge bg-gray-100 text-gray-600 text-xs">
                <Tag size={10} className="mr-1" />{tag}
              </span>
            ))}
          </div>
          <p className="text-gray-700 leading-relaxed text-base bg-brand-50/50 rounded-xl p-4 border border-brand-100/50 print:bg-brand-50">
            {report.summary}
          </p>
        </div>
        {report.key_points && report.key_points.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">핵심 포인트</h3>
            <ul className="space-y-2">
              {report.key_points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 print:break-inside-avoid">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700 text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ),
  });

  // 섹션
  report.sections?.forEach((section) => {
    slides.push({
      type: "section",
      title: section.title,
      icon: SECTION_ICONS[section.type] ?? SECTION_ICONS.summary,
      content: <SectionRenderer section={section} />,
    });
  });

  // 어휘
  if (report.vocabulary && report.vocabulary.length > 0) {
    slides.push({
      type: "vocabulary",
      title: "주요 용어",
      icon: <Tag size={20} className="text-cyan-500" />,
      content: (
        <div className="grid sm:grid-cols-2 gap-3 print:grid-cols-2">
          {report.vocabulary.map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 print:break-inside-avoid">
              <p className="font-semibold text-brand-600 text-sm">{item.term}</p>
              <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">{item.definition}</p>
            </div>
          ))}
        </div>
      ),
    });
  }

  // 학습 팁
  if (report.study_tips && report.study_tips.length > 0) {
    slides.push({
      type: "tips",
      title: "복습 팁",
      icon: <Lightbulb size={20} className="text-amber-500" />,
      content: (
        <ul className="space-y-3">
          {report.study_tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-3 bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 print:break-inside-avoid">
              <span className="text-amber-500 text-lg mt-0.5">💡</span>
              <span className="text-gray-700 leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  return slides;
}

// ──────────────────────────────────────────
// 공용 ReportPreview 컴포넌트
// /study 와 /library 양쪽에서 사용
// ──────────────────────────────────────────
export interface ReportPreviewProps {
  report: Report;
  /** 액션 바 표시 여부 (기본 true) */
  showActions?: boolean;
  onSave?: () => void;
  onPdfDownload?: () => void;
  isSaving?: boolean;
  savedId?: string | null;
}

export default function ReportPreview({
  report,
  showActions = true,
  onSave,
  onPdfDownload,
  isSaving = false,
  savedId = null,
}: ReportPreviewProps) {
  const slides = buildSlides(report);
  const totalSlides = slides.length;
  const [pdfBusy, setPdfBusy] = useState(false);

  // PDF 다운로드 — onPdfDownload prop이 있으면 그걸 호출 (호환), 없으면 내장 함수 사용
  async function handlePdf() {
    if (onPdfDownload) {
      onPdfDownload();
      return;
    }
    setPdfBusy(true);
    try {
      await exportReportPdf("report-content", report.title || "report");
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("PDF 다운로드 실패. 다시 시도해주세요.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 액션 바 */}
      {showActions && (
        <div className="no-print card p-3 flex items-center justify-between gap-3 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">
              전체 {totalSlides}장
            </span>
            <div className="hidden sm:flex gap-1">
              {slides.map((s, i) => (
                <a
                  key={i}
                  href={`#slide-${i}`}
                  title={s.title}
                  className="w-2 h-2 rounded-full bg-gray-200 hover:bg-brand-400 transition-all hover:w-4"
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePdf} disabled={pdfBusy} className="btn-secondary text-sm py-2 disabled:opacity-50">
              {pdfBusy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              PDF
            </button>
            {onSave && (
              <button onClick={onSave} disabled={isSaving || !!savedId} className="btn-primary text-sm py-2">
                {isSaving ? <><Loader2 size={15} className="animate-spin" />저장 중...</>
                  : savedId ? <><CheckCircle size={15} />저장됨</>
                  : <><Save size={15} />라이브러리에 추가</>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 슬라이드 스크롤 컨테이너 */}
      <div className="space-y-5 print:space-y-0" id="report-content">
        {slides.map((s, i) => (
          <div
            key={i}
            id={`slide-${i}`}
            className="card overflow-hidden scroll-mt-20 print:shadow-none print:rounded-none print:border-0 print:break-after-page print:break-inside-avoid"
          >
            <div className="px-8 pt-7 pb-4 border-b border-gray-50 flex items-start justify-between gap-3 print:px-0 print:pt-2 print:border-b-2 print:border-gray-200">
              <div className="flex items-center gap-3 min-w-0">
                {s.icon}
                <h2 className={`font-bold text-gray-900 truncate print:whitespace-normal ${s.type === "title" ? "text-2xl" : "text-xl"}`}>
                  {s.title}
                </h2>
              </div>
              <span className="text-xs text-gray-400 font-medium flex-shrink-0 mt-1.5">
                {i + 1} / {totalSlides}
              </span>
            </div>
            <div className="px-8 py-6 print:px-0 print:py-4">
              {s.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
