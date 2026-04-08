"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Activity, Calendar, ChevronLeft, ChevronRight, Loader2,
  Clock, ArrowRight, ListChecks, FolderOpen, FileText, X, CheckCircle2,
} from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";

// ──────────────────────────────────────────
// 타입
// ──────────────────────────────────────────
interface Project {
  id: string;
  name: string;
  description: string;
  status: "in_progress" | "completed" | "paused";
  color: string;
  progress?: number;
  created_at: string;
}

interface ProjectLog {
  id: string;
  project_id: string;
  title: string;
  content: string;
  status: "in_progress" | "completed" | "blocked";
  tags: string[];
  logged_at: string;
}

interface Enriched extends Project {
  latestLog: ProjectLog | null;
  lastChange: string;
  effectiveColor: string;
}

type ModalKind = "last" | "next";
interface ModalState {
  project: Enriched;
  kind: ModalKind;
}

// ──────────────────────────────────────────
// 색 자동 배정 (DB color가 기본값이면 인덱스 기반 팔레트로 override)
// ──────────────────────────────────────────
const PALETTE = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#0ea5e9"];
const DEFAULT_DB_COLOR = "#6366f1";
function pickColor(p: Project, idx: number): string {
  return p.color && p.color !== DEFAULT_DB_COLOR ? p.color : PALETTE[idx % PALETTE.length];
}

// ──────────────────────────────────────────
// 마크다운 섹션 추출 헬퍼
// ──────────────────────────────────────────
// 본문에서 특정 이모지/제목 헤딩의 섹션을 통째로 잘라낸다.
// 다음 헤딩이나 --- 가 나오면 종료.
function extractSection(content: string, emoji: string): string | null {
  if (!content) return null;
  const re = new RegExp(`###?\\s*${emoji}[^\\n]*\\n([\\s\\S]*?)(?=^#{1,6}\\s|^---\\s*$|\\Z)`, "m");
  const m = content.match(re);
  return m ? m[1].trim() : null;
}

// 섹션의 첫 N개 bullet/줄을 추출
function topLines(section: string, max = 5): string[] {
  if (!section) return [];
  const lines: string[] = [];
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) break; // 다음 헤딩
    lines.push(line);
    if (lines.length >= max) break;
  }
  return lines;
}

// "마지막 작업 내용" 마크다운 생성
function buildLastWorkMarkdown(log: ProjectLog | null): string {
  if (!log) return "_아직 이 프로젝트에 기록이 없습니다._";
  const changes = extractSection(log.content, "🔄") ?? "";
  const issues = extractSection(log.content, "🐛") ?? "";

  const parts: string[] = [`### ${log.title}`];
  if (changes) {
    const top = topLines(changes, 5).join("\n");
    if (top) parts.push("**주요 변경**\n\n" + top);
  }
  if (issues) {
    const top = topLines(issues, 3).join("\n");
    if (top) parts.push("**해결한 이슈**\n\n" + top);
  }
  if (parts.length === 1) {
    // fallback: title만 있고 본문이 비어있거나 카테고리가 없을 때
    const fallback = log.content.split("\n").filter((l) => l.trim()).slice(0, 5).join("\n");
    if (fallback) parts.push(fallback);
  }
  return parts.join("\n\n");
}

// "추가 작업 필요사항" 마크다운 생성
function buildNextWorkMarkdown(log: ProjectLog | null): string {
  if (!log) return "_아직 이 프로젝트에 기록이 없습니다._";
  const todos = extractSection(log.content, "📌") ?? "";
  if (!todos) return "_최근 기록에 후속 과제가 명시되지 않았습니다._";
  const top = topLines(todos, 5).join("\n");
  return "**다음에 이어서 할 일**\n\n" + top;
}

// ──────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ──────────────────────────────────────────
// 캘린더 헬퍼
// ──────────────────────────────────────────
function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = first.getDay();
  const start = new Date(year, month, 1 - startWeekday);
  const totalDays = startWeekday + last.getDate();
  const cells = Math.ceil(totalDays / 7) * 7;
  return Array.from({ length: cells }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function dayInRange(day: Date, startIso: string, endIso: string): boolean {
  const t = day.getTime();
  const s = new Date(startIso); s.setHours(0, 0, 0, 0);
  const e = new Date(endIso);   e.setHours(23, 59, 59, 999);
  return t >= s.getTime() && t <= e.getTime();
}

// ──────────────────────────────────────────
// 메인
// ──────────────────────────────────────────
export default function ProgressDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [modal, setModal] = useState<ModalState | null>(null);

  // ── 데이터 로드 ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, lRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/project-logs"),
      ]);
      const [{ projects: pData }, { logs: lData }] = await Promise.all([pRes.json(), lRes.json()]);
      setProjects(pData ?? []);
      setLogs(lData ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 탭 복귀 시 자동 갱신
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchAll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchAll]);

  // ESC로 모달 닫기
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  // ── 모든 프로젝트 enriched (캘린더는 전체, 카드는 in_progress+paused만 사용) ──
  const allEnriched = useMemo<Enriched[]>(() => {
    return projects.map((p, idx) => {
      const projectLogs = logs.filter((l) => l.project_id === p.id);
      const latest = projectLogs[0] ?? null;
      const lastChange = latest?.logged_at ?? p.created_at;
      return {
        ...p,
        latestLog: latest,
        lastChange,
        effectiveColor: pickColor(p, idx),
      };
    });
  }, [projects, logs]);

  // 카드용 — in_progress + paused, 최신 활동순
  const activeCards = useMemo<Enriched[]>(() => {
    return allEnriched
      .filter((p) => p.status !== "completed")
      .sort((a, b) => new Date(b.lastChange).getTime() - new Date(a.lastChange).getTime());
  }, [allEnriched]);

  // ── 진행률 업데이트 ──
  const updateProgress = (projectId: string, value: number) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, progress: value } : p));
  };

  const saveProgress = async (projectId: string, value: number) => {
    setSavingId(projectId);
    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, progress: value }),
      });
    } catch {
      // 무시 (마이그레이션 전이면 500 발생 가능)
    } finally {
      setSavingId(null);
    }
  };

  // ── 캘린더 데이터 ──
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const monthGrid = useMemo(() => getMonthGrid(calYear, calMonth), [calYear, calMonth]);
  const monthLabel = `${calYear}년 ${calMonth + 1}월`;

  // 캘린더 막대: 모든 상태 포함
  const projectBars = useMemo(() => {
    return allEnriched.map((p) => {
      const start = p.created_at;
      let end: string;
      if (p.status === "completed") {
        end = p.latestLog?.logged_at ?? p.created_at;
      } else if (p.status === "paused") {
        end = p.latestLog?.logged_at ?? p.created_at;
      } else {
        end = new Date().toISOString();
      }
      return { p, start, end };
    });
  }, [allEnriched]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Activity size={22} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">진행율 대시보드</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              모든 프로젝트의 진행 상태를 한눈에 — 진행률만 직접 조정, 나머지는 자동
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {loading ? (
          <div className="card p-12 text-center text-gray-400">
            <Loader2 size={28} className="animate-spin mx-auto mb-3" />
            불러오는 중...
          </div>
        ) : (
          <>
            {/* ── 1. 캘린더 ── */}
            <section className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Calendar size={18} className="text-amber-500" />
                  타임라인 — {monthLabel}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    aria-label="이전 달"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date())}
                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    오늘
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    aria-label="다음 달"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                  <div key={d} className={`text-center text-[11px] font-semibold py-1
                    ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {monthGrid.map((d, i) => {
                  const isCurrentMonth = d.getMonth() === calMonth;
                  const isTodayCell = isSameDay(d, today);
                  const activeBars = projectBars.filter(({ start, end }) => dayInRange(d, start, end));
                  const started = projectBars.filter(({ start }) => isSameDay(new Date(start), d));
                  const ended = projectBars.filter(({ end, p }) =>
                    p.status === "completed" && isSameDay(new Date(end), d)
                  );
                  return (
                    <div
                      key={i}
                      className={`min-h-[68px] rounded-lg border p-1 flex flex-col gap-1
                        ${isCurrentMonth ? "bg-white border-gray-100" : "bg-gray-50/50 border-gray-50"}
                        ${isTodayCell ? "ring-2 ring-amber-300 border-amber-200" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold
                          ${!isCurrentMonth ? "text-gray-300"
                            : isTodayCell ? "text-amber-600"
                            : d.getDay() === 0 ? "text-red-400"
                            : d.getDay() === 6 ? "text-blue-400"
                            : "text-gray-700"}`}>
                          {d.getDate()}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {started.length > 0 && (
                            <span className="text-[8px] text-amber-600 font-bold leading-none" title="시작">▶</span>
                          )}
                          {ended.length > 0 && (
                            <CheckCircle2 size={9} className="text-emerald-500" />
                          )}
                        </div>
                      </div>
                      {/* 프로젝트 바: 상태별 시각 구분 */}
                      <div className="flex flex-col gap-0.5 mt-auto">
                        {activeBars.slice(0, 4).map(({ p }) => {
                          const isCompleted = p.status === "completed";
                          const isPaused = p.status === "paused";
                          return (
                            <div
                              key={p.id}
                              className="h-1.5 rounded-full"
                              style={{
                                backgroundColor: isCompleted ? `${p.effectiveColor}80` : p.effectiveColor,
                                backgroundImage: isPaused
                                  ? `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)`
                                  : undefined,
                                opacity: isCompleted ? 0.7 : 1,
                              }}
                              title={`${p.name} (${p.status === "completed" ? "완료" : p.status === "paused" ? "일시중지" : "진행 중"})`}
                            />
                          );
                        })}
                        {activeBars.length > 4 && (
                          <span className="text-[9px] text-gray-400 leading-none">+{activeBars.length - 4}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 범례 */}
              {allEnriched.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                  {/* 상태 설명 */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-1.5 rounded-full bg-brand-500" /> 진행 중
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-1.5 rounded-full bg-brand-500/70" />
                      <CheckCircle2 size={10} className="text-emerald-500" /> 완료
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-1.5 rounded-full bg-brand-500"
                        style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)` }}
                      /> 일시중지
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-600 font-bold">▶</span> 시작일
                    </div>
                  </div>
                  {/* 프로젝트 목록 */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {allEnriched.map((p) => (
                      <div key={p.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.effectiveColor }} />
                        <span className="font-medium text-gray-700">{p.name}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-400">{formatShortDate(p.created_at)} 시작</span>
                        {p.status === "completed" && (
                          <span className="text-emerald-600 text-[10px]">✓ 완료</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ── 2. 진행 중인 프로젝트 카드 그리드 ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <FolderOpen size={18} className="text-brand-500" />
                  진행 중인 프로젝트 ({activeCards.length})
                </h2>
                <Link href="/projects" className="text-xs text-brand-500 hover:underline flex items-center gap-1">
                  프로젝트 관리 <ArrowRight size={12} />
                </Link>
              </div>

              {activeCards.length === 0 ? (
                <div className="card p-10 text-center text-gray-400">
                  <FolderOpen size={32} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">진행 중인 프로젝트가 없습니다</p>
                  <Link href="/projects" className="text-xs text-brand-500 underline mt-2 inline-block">
                    프로젝트 추가하기 →
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeCards.map((p) => {
                    const progress = p.progress ?? 0;
                    return (
                      <div key={p.id} className="card p-5 flex flex-col gap-4 border-t-4" style={{ borderTopColor: p.effectiveColor }}>
                        {/* 헤더 */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 leading-snug">{p.name}</h3>
                          {p.status === "paused" && (
                            <span className="badge bg-gray-100 text-gray-500 text-[10px] flex-shrink-0">일시중지</span>
                          )}
                        </div>

                        {/* 진행률 */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">진행률</span>
                            <span className="text-base font-bold flex items-center gap-1" style={{ color: p.effectiveColor }}>
                              {progress}%
                              {savingId === p.id && <Loader2 size={11} className="animate-spin" />}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0} max={100} step={5}
                            value={progress}
                            onChange={(e) => updateProgress(p.id, Number(e.target.value))}
                            onMouseUp={(e) => saveProgress(p.id, Number((e.target as HTMLInputElement).value))}
                            onTouchEnd={(e) => saveProgress(p.id, Number((e.target as HTMLInputElement).value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, ${p.effectiveColor} ${progress}%, #e5e7eb ${progress}%)`,
                            }}
                          />
                        </div>

                        {/* 마지막 활동 시간 */}
                        <div className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock size={11} />
                          마지막 활동 · {relativeTime(p.lastChange)}
                        </div>

                        {/* 두 개의 버튼 */}
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <button
                            onClick={() => setModal({ project: p, kind: "last" })}
                            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
                          >
                            <FileText size={16} className="text-gray-400 group-hover:text-brand-500 transition-colors" />
                            <span className="text-[11px] font-semibold text-gray-600 group-hover:text-brand-600">
                              마지막 작업 내용
                            </span>
                          </button>
                          <button
                            onClick={() => setModal({ project: p, kind: "next" })}
                            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
                          >
                            <ListChecks size={16} className="text-amber-500 group-hover:text-amber-600 transition-colors" />
                            <span className="text-[11px] font-semibold text-amber-700 group-hover:text-amber-800">
                              추가 작업 필요사항
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ── 모달 ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${modal.project.effectiveColor}20` }}
                >
                  {modal.kind === "last"
                    ? <FileText size={20} style={{ color: modal.project.effectiveColor }} />
                    : <ListChecks size={20} className="text-amber-500" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {modal.kind === "last" ? "마지막 작업 내용" : "추가 작업 필요사항"}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 truncate">{modal.project.name}</h3>
                  {modal.project.latestLog && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {relativeTime(modal.project.lastChange)} 기록 기준
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-5 overflow-y-auto">
              <MarkdownContent
                content={
                  modal.kind === "last"
                    ? buildLastWorkMarkdown(modal.project.latestLog)
                    : buildNextWorkMarkdown(modal.project.latestLog)
                }
              />
            </div>

            {/* 푸터 */}
            <div className="p-4 border-t border-gray-100 flex justify-between items-center">
              <Link
                href="/projects"
                className="text-xs text-gray-400 hover:text-brand-500 hover:underline"
              >
                프로젝트 전체 기록 보기 →
              </Link>
              <button
                onClick={() => setModal(null)}
                className="btn-secondary text-xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
