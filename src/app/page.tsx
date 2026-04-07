"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Brain, BookOpen, Target,
  FolderOpen, Clock, CheckCircle2, Circle, ChevronRight, RefreshCw,
  Terminal,
} from "lucide-react";
import {
  type WeekGoals, type GoalItem,
  DAYS_SHORT, getMondayOf, getWeekKey, progressColor, migrateGoalDays,
} from "@/lib/constants";

// ────── 타입 ──────
interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  status?: string;
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

// ────── 메인 ──────
export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [weekGoals, setWeekGoals] = useState<WeekGoals>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const weekKey = getWeekKey(getMondayOf(new Date()));

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);

    try {
      const [projRes, reportRes, goalsRes, logsRes, skillsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/reports"),
        fetch(`/api/goals?week=${weekKey}`),
        fetch("/api/project-logs"),
        fetch("/api/skills"),
      ]);
      const [{ projects: pData }, { reports: rData }, { goals: gData }, { logs: lData }, { skills: sData }] =
        await Promise.all([projRes.json(), reportRes.json(), goalsRes.json(), logsRes.json(), skillsRes.json()]);

      const allProjects = pData ?? [];
      setProjects(allProjects.slice(0, 5));
      setReports((rData ?? []).slice(0, 5));

      // 최근 기록에 프로젝트 정보 매핑
      const logs = (lData ?? []).slice(0, 5).map((l: { project_id: string; [key: string]: unknown }) => {
        const proj = allProjects.find((p: Project) => p.id === l.project_id);
        return { ...l, project_name: proj?.name ?? "알 수 없음", project_color: proj?.color ?? "#6366f1" };
      });
      setRecentLogs(logs);
      setSkills((sData ?? []).slice(0, 4));

      setWeekGoals(migrateGoalDays((gData?.days ?? {}) as Record<string, unknown>));
      setLastUpdated(new Date());
    } catch {
      // 에러 시 기존 데이터 유지
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekKey]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 탭 전환 시 자동 갱신
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchAll(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchAll]);

  // 통계
  const allGoalItems = useMemo(() => Object.values(weekGoals).flat().filter((g) => g.goal?.trim()), [weekGoals]);
  const goalsWithContent = allGoalItems.length;
  const overallProgress = useMemo(() =>
    goalsWithContent > 0
      ? Math.round(allGoalItems.reduce((s, g) => s + g.progress, 0) / goalsWithContent)
      : 0,
    [allGoalItems, goalsWithContent]);

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
                <Link key={p.id} href="/projects"
                  className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
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

        {/* ── 주간 목표 ── */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-200/50 shadow-[0_2px_15px_-3px_rgba(139,92,246,0.1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target size={20} className="text-amber-500" />
              이번 주 목표
              {goalsWithContent > 0 && (
                <span className="text-sm font-normal text-gray-400">— 전체 달성률 {overallProgress}%</span>
              )}
            </h2>
            <Link href="/goals" className="text-sm text-amber-600 hover:underline flex items-center gap-1">
              목표 편집<ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => <div key={i} className="card p-3 h-28 animate-pulse bg-gray-50" />)}
            </div>
          ) : goalsWithContent === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <Target size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">이번 주 목표가 아직 없습니다</p>
              <Link href="/goals" className="text-xs text-amber-600 underline mt-1 inline-block">목표 설정하기 →</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-7 gap-2">
              {DAYS_SHORT.map((day, i) => {
                const items = (weekGoals[String(i)] ?? []).filter((g) => g.goal?.trim());
                const allDone = items.length > 0 && items.every((g) => g.progress >= 100);
                return (
                  <Link key={i} href="/goals"
                    className="card p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col gap-2">
                    {/* 요일 헤더 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">{day}요일</span>
                      {items.length > 0 && (
                        allDone
                          ? <CheckCircle2 size={13} className="text-emerald-500" />
                          : <Circle size={13} className="text-gray-300" />
                      )}
                    </div>

                    {/* 목표 목록 */}
                    {items.length === 0 ? (
                      <p className="text-xs text-gray-300 italic">목표 없음</p>
                    ) : (
                      <div className="space-y-2">
                        {items.map((g, gi) => (
                          <div key={gi}>
                            <p className="text-[11px] text-gray-700 font-medium line-clamp-1 leading-snug mb-1">
                              {gi + 1}. {g.goal}
                            </p>
                            <div className="w-full bg-gray-100 rounded-full h-1">
                              <div className="h-1 rounded-full transition-all"
                                style={{ width: `${g.progress}%`, backgroundColor: progressColor(g.progress) }} />
                            </div>
                            <p className="text-right text-[10px] text-gray-400 mt-0.5">{g.progress}%</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
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
    </div>
  );
}
