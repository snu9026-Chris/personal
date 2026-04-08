"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Brain, BookOpen, Activity,
  FolderOpen, Clock, ChevronRight, RefreshCw,
  Terminal, ListChecks, Pencil, X, ExternalLink,
} from "lucide-react";
import { progressColor } from "@/lib/constants";
import MarkdownContent from "@/components/MarkdownContent";

const PROJECT_COLOR_PALETTE = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#0ea5e9",
];

// ────── 타입 ──────
interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  status?: string;
  progress?: number;
  created_at?: string;
}

interface Report {
  id: string;
  title: string;
  subject?: string;
  created_at?: string;
}

interface RecentLog {
  id: string;
  title: string;
  content?: string;
  status: string;
  logged_at: string;
  project_id: string;
  project_name: string;
  project_color: string;
}

interface SkillItem {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface ProgressCard {
  id: string;
  name: string;
  color: string;
  progress: number;
  lastTitle: string;
  lastWhen: string; // iso
  lastContent: string | null;
  nextStep: string | null;
}

// 로그 본문에서 "📌 추가 과제" 첫 bullet 추출 (홈 카드 미리보기용)
function firstNextStep(content: string): string | null {
  if (!content) return null;
  const re = /###?\s*📌[^\n]*\n([\s\S]*?)(?=^#{1,6}\s|\n---|\Z)/m;
  const m = content.match(re);
  if (!m) return null;
  for (const line of m[1].split("\n")) {
    const bm = line.match(/^\s*[-*]\s*(?:\[[ x]\]\s*)?(.+?)\s*$/);
    if (bm && bm[1].trim()) return bm[1].trim();
  }
  return null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

// ────── 메인 ──────
export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [progressCards, setProgressCards] = useState<ProgressCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingCard, setViewingCard] = useState<ProgressCard | null>(null);

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);

    try {
      const [projRes, reportRes, logsRes, skillsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/reports"),
        fetch("/api/project-logs"),
        fetch("/api/skills"),
      ]);
      const [{ projects: pData }, { reports: rData }, { logs: lData }, { skills: sData }] =
        await Promise.all([projRes.json(), reportRes.json(), logsRes.json(), skillsRes.json()]);

      const allProjects: Project[] = pData ?? [];
      const allLogs: RecentLog[] = lData ?? [];

      // 프로젝트 정렬: 각 프로젝트의 최신 log 시각 기준 desc (없으면 created_at)
      const projectActivity = (p: Project) => {
        const latest = allLogs.find((l) => l.project_id === p.id);
        return new Date(latest?.logged_at ?? p.created_at ?? 0).getTime();
      };
      const sortedProjects = [...allProjects].sort((a, b) => projectActivity(b) - projectActivity(a));
      setProjects(sortedProjects.slice(0, 5));
      setReports((rData ?? []).slice(0, 5));

      // 최근 기록에 프로젝트 정보 매핑
      const enrichedLogs = allLogs.slice(0, 5).map((l) => {
        const proj = allProjects.find((p) => p.id === l.project_id);
        return { ...l, project_name: proj?.name ?? "알 수 없음", project_color: proj?.color ?? "#6366f1" };
      });
      setRecentLogs(enrichedLogs);
      setSkills((sData ?? []).slice(0, 4));

      // ── 진행율 대시보드 카드: 진행 중 프로젝트 + 최신 로그 매핑, 최근 활동순 ──
      // 색 자동 배정: DB color가 기본값(#6366f1)이면 인덱스 기반 팔레트로 override
      const cards: ProgressCard[] = allProjects
        .filter((p) => p.status !== "completed")
        .map((p, idx) => {
          const latest = allLogs.find((l) => l.project_id === p.id);
          const effective = p.color && p.color !== "#6366f1" ? p.color : PROJECT_COLOR_PALETTE[idx % PROJECT_COLOR_PALETTE.length];
          return {
            id: p.id,
            name: p.name,
            color: effective,
            progress: p.progress ?? 0,
            lastTitle: latest?.title ?? "기록 없음",
            lastWhen: latest?.logged_at ?? p.created_at ?? new Date().toISOString(),
            lastContent: latest?.content ?? null,
            nextStep: latest?.content ? firstNextStep(latest.content) : null,
          };
        })
        .sort((a, b) => new Date(b.lastWhen).getTime() - new Date(a.lastWhen).getTime())
        .slice(0, 6);
      setProgressCards(cards);

      setLastUpdated(new Date());
    } catch {
      // 에러 시 기존 데이터 유지
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 탭 전환 시 자동 갱신
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchAll(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchAll]);

  const fmtTime = (d: Date) => d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-100/80 via-purple-100/60 to-pink-100/50">

      {/* 큐레이션 */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

        {/* 갱신 상태 */}
        <div className="flex items-center justify-end gap-2 -mb-6">
          {lastUpdated && (
            <span className="text-xs text-gray-400">{fmtTime(lastUpdated)} 기준</span>
          )}
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-500 transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            새로고침
          </button>
        </div>

        {/* ── 진행 프로젝트 ── */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-200/50 shadow-[0_2px_15px_-3px_rgba(139,92,246,0.1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen size={20} className="text-brand-500" />최근 진행 프로젝트
            </h2>
            <Link href="/projects" className="text-sm text-brand-500 hover:underline flex items-center gap-1">
              전체 보기<ChevronRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="grid md:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => <div key={i} className="card p-4 h-24 animate-pulse bg-gray-50" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <FolderOpen size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">아직 진행 중인 프로젝트가 없습니다</p>
              <Link href="/projects" className="text-xs text-brand-500 underline mt-1 inline-block">프로젝트 시작하기 →</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-5 gap-3">
              {projects.map((p) => (
                <div key={p.id} className="relative group">
                  <Link href="/projects"
                    className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer block">
                    <div className="w-8 h-8 rounded-lg mb-3" style={{ backgroundColor: p.color ?? "#6366f1" }} />
                    <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {p.name}
                    </p>
                    {p.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>}
                    <div className="mt-2">
                      <span className={`badge text-xs ${p.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-600"}`}>
                        {p.status === "completed" ? "완료" : "진행 중"}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingProject(p); }}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 backdrop-blur-sm border border-gray-200 opacity-0 group-hover:opacity-100 hover:bg-brand-50 hover:border-brand-200 transition-all"
                    aria-label="프로젝트 편집"
                  >
                    <Pencil size={11} className="text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 최근 학습 내용 ── */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-200/50 shadow-[0_2px_15px_-3px_rgba(139,92,246,0.1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-500" />최근 학습 내용
            </h2>
            <Link href="/library" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
              라이브러리<ChevronRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="card p-4 h-16 animate-pulse bg-gray-50" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <BookOpen size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">아직 저장된 학습 내용이 없습니다</p>
              <Link href="/study" className="text-xs text-emerald-600 underline mt-1 inline-block">학습 내용 업로드하기 →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <Link key={r.id} href="/library"
                  className="card px-5 py-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <Brain size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-emerald-600 transition-colors">{r.title}</p>
                    {r.subject && <p className="text-xs text-gray-400 mt-0.5">{r.subject}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                    <Clock size={12} />
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : ""}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── 진행상황 점검 (가로 박스 스크롤) ── */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-200/50 shadow-[0_2px_15px_-3px_rgba(139,92,246,0.1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity size={20} className="text-amber-500" />
              진행율 대시보드
              {progressCards.length > 0 && (
                <span className="text-sm font-normal text-gray-400">— 최근 활동순 {progressCards.length}개</span>
              )}
            </h2>
            <Link href="/goals" className="text-sm text-amber-600 hover:underline flex items-center gap-1">
              전체 보기<ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[...Array(4)].map((_, i) => <div key={i} className="card p-4 h-40 w-72 flex-shrink-0 animate-pulse bg-gray-50" />)}
            </div>
          ) : progressCards.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <Activity size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">진행 중인 프로젝트가 없습니다</p>
              <Link href="/projects" className="text-xs text-amber-600 underline mt-1 inline-block">프로젝트 시작하기 →</Link>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
              {progressCards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setViewingCard(c)}
                  className="card p-4 w-72 flex-shrink-0 snap-start flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group border-t-4 text-left"
                  style={{ borderTopColor: c.color }}
                >
                  {/* 이름 + 마지막 활동 시점 */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {c.name}
                    </h3>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                      <Clock size={10} />{relativeTime(c.lastWhen)}
                    </span>
                  </div>

                  {/* 진행률 바 */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-semibold text-gray-500 uppercase tracking-wide">진행률</span>
                      <span className="font-bold" style={{ color: c.color }}>{c.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${c.progress}%`, backgroundColor: progressColor(c.progress) }} />
                    </div>
                  </div>

                  {/* 마지막 작업 */}
                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                    {c.lastTitle}
                  </p>

                  {/* 다음 할 일 (있을 때만) */}
                  {c.nextStep && (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50/70 rounded-lg p-2 border border-amber-100">
                      <ListChecks size={11} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2 leading-snug">{c.nextStep}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── 최근 기록 ── */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-200/50 shadow-[0_2px_15px_-3px_rgba(139,92,246,0.1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Terminal size={20} className="text-purple-500" />
              최근 기록
            </h2>
            <Link href="/projects" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              전체 보기<ChevronRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="card p-4 h-16 animate-pulse bg-gray-50" />)}
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <Terminal size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">아직 기록이 없습니다</p>
              <Link href="/projects" className="text-xs text-purple-600 underline mt-1 inline-block">기록 시작하기 →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <Link key={log.id} href="/projects"
                  className="card px-5 py-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: log.project_color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-purple-600 transition-colors">{log.title}</p>
                    <span className="text-xs text-gray-400">{log.project_name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge text-xs ${
                      log.status === "completed" ? "bg-emerald-50 text-emerald-600"
                      : log.status === "blocked" ? "bg-red-50 text-red-600"
                      : "bg-blue-50 text-blue-600"
                    }`}>
                      {log.status === "completed" ? "완료" : log.status === "blocked" ? "차단" : "진행 중"}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(log.logged_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── 스킬 큐레이션 ── */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-200/50 shadow-[0_2px_15px_-3px_rgba(139,92,246,0.1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Terminal size={20} className="text-purple-500" />
              Claude Code 스킬
            </h2>
            <Link href="/skills" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              전체 보기<ChevronRight size={14} />
            </Link>
          </div>
          {skills.length === 0 && !loading ? (
            <div className="card p-6 text-center text-gray-400">
              <Terminal size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">등록된 스킬이 없습니다</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {skills.map((skill) => {
                const colorBg = { blue: "bg-blue-50", emerald: "bg-emerald-50", purple: "bg-purple-50", amber: "bg-amber-50", red: "bg-red-50" }[skill.color] ?? "bg-purple-50";
                const colorText = { blue: "text-blue-500", emerald: "text-emerald-500", purple: "text-purple-500", amber: "text-amber-500", red: "text-red-500" }[skill.color] ?? "text-purple-500";
                return (
                  <Link key={skill.id} href="/skills" className="card p-4 flex gap-3 items-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className={`w-9 h-9 rounded-xl ${colorBg} flex items-center justify-center flex-shrink-0`}>
                      <Terminal size={18} className={colorText} />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm text-gray-900 group-hover:${colorText} transition-colors`}>{skill.name}</p>
                      <p className="text-xs text-gray-400 truncate">{skill.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* ── 프로젝트 편집 모달 ── */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={() => { setEditingProject(null); fetchAll(true); }}
        />
      )}

      {/* ── 진행상황 카드 → 최신 log 미리보기 모달 ── */}
      {viewingCard && (
        <LogViewerModal
          card={viewingCard}
          onClose={() => setViewingCard(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 프로젝트 편집 모달 (이름 + 색상)
// ─────────────────────────────────────────────────────────────
function EditProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: Project;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color ?? PROJECT_COLOR_PALETTE[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, name: name.trim(), color }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (err) {
      alert("저장 실패: " + (err instanceof Error ? err.message : String(err)));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Pencil size={16} className="text-brand-500" />
            프로젝트 편집
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="닫기">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              이름
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300"
              placeholder="프로젝트 이름"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              아이콘 색상
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-lg transition-all ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-brand-400 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`색상 ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: color }} />
            <p className="text-sm text-gray-600 flex-1 truncate font-semibold">{name || "(이름 없음)"}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 진행상황 카드 → 최신 log 마크다운 미리보기 모달
// ─────────────────────────────────────────────────────────────
function LogViewerModal({
  card,
  onClose,
}: {
  card: ProgressCard;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="px-6 py-4 border-b border-gray-100 border-t-4 rounded-t-2xl"
          style={{ borderTopColor: card.color }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
                {card.name}
              </p>
              <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                {card.lastTitle}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(card.lastWhen).toLocaleString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>·</span>
                <span>진행률 {card.progress}%</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 flex-shrink-0"
              aria-label="닫기"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 본문 — 마크다운 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {card.lastContent ? (
            <MarkdownContent content={card.lastContent} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">
              아직 기록된 내용이 없습니다.
            </p>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <Link
            href="/goals"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-brand-600 hover:bg-brand-50 rounded-lg transition-colors font-semibold"
          >
            <ExternalLink size={12} />
            전체 진행상황 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
