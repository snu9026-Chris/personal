"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Brain, BookOpen, Activity,
  FolderOpen, Clock, ChevronRight, RefreshCw,
  Terminal, ListChecks, Pencil,
} from "lucide-react";
import { progressColor } from "@/lib/color";
import { useProjects } from "@/hooks/useProjects";
import { useProjectLogs } from "@/hooks/useProjectLogs";
import { useReports } from "@/hooks/useReports";
import { useSkills } from "@/hooks/useSkills";
import { useToast } from "@/components/Toast";
import { buildProgressCards, sortProjectsByActivity } from "@/lib/dashboard-data";
import { relativeTime, formatTime, formatShortDate } from "@/lib/format";
import EditProjectModal from "@/components/home/EditProjectModal";
import LogViewerModal from "@/components/home/LogViewerModal";
import type { Project, ProgressCard } from "@/lib/types";

export default function Home() {
  const { projects: allProjects, isLoading: loadingProjects, update: updateProject } = useProjects();
  const { logs: allLogs, isLoading: loadingLogs } = useProjectLogs();
  const { reports, isLoading: loadingReports } = useReports();
  const { skills, isLoading: loadingSkills } = useSkills();
  const toast = useToast();

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingCard, setViewingCard] = useState<ProgressCard | null>(null);

  const isLoading = loadingProjects || loadingLogs || loadingReports || loadingSkills;

  const projects = useMemo(
    () => sortProjectsByActivity(allProjects, allLogs).slice(0, 5),
    [allProjects, allLogs],
  );

  const recentLogs = useMemo(
    () => allLogs.slice(0, 5).map((l) => {
      const proj = allProjects.find((p) => p.id === l.project_id);
      return {
        ...l,
        project_name: proj?.name ?? "알 수 없음",
        project_color: proj?.color ?? "#6366f1",
      };
    }),
    [allLogs, allProjects],
  );

  const progressCards = useMemo(
    () => buildProgressCards(allProjects, allLogs, 6),
    [allProjects, allLogs],
  );

  const recentReports = useMemo(() => reports.slice(0, 5), [reports]);
  const recentSkills = useMemo(() => skills.slice(0, 4), [skills]);

  const lastUpdated = isLoading ? null : new Date();

  const handleSaveProject = async (id: string, name: string, color: string) => {
    try {
      await updateProject({ id, name, color });
      setEditingProject(null);
      toast.success("프로젝트를 저장했습니다.");
    } catch (e) {
      toast.error(`저장 실패: ${(e as Error).message}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-100/80 via-purple-100/60 to-pink-100/50">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

        <div className="flex items-center justify-end gap-2 -mb-6">
          {lastUpdated && (
            <span className="text-xs text-gray-400">{formatTime(lastUpdated)} 기준</span>
          )}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "불러오는 중" : "자동 갱신"}
          </span>
        </div>

        {/* 진행 프로젝트 */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-200/50 shadow-[0_2px_15px_-3px_rgba(139,92,246,0.1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen size={20} className="text-brand-500" />최근 진행 프로젝트
            </h2>
            <Link href="/projects" className="text-sm text-brand-500 hover:underline flex items-center gap-1">
              전체 보기<ChevronRight size={14} />
            </Link>
          </div>
          {loadingProjects ? (
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

        {/* 최근 학습 내용 */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-sm border border-purple-200/50 shadow-[0_2px_15px_-3px_rgba(139,92,246,0.1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-500" />최근 학습 내용
            </h2>
            <Link href="/library" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
              라이브러리<ChevronRight size={14} />
            </Link>
          </div>
          {loadingReports ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="card p-4 h-16 animate-pulse bg-gray-50" />)}
            </div>
          ) : recentReports.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <BookOpen size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">아직 저장된 학습 내용이 없습니다</p>
              <Link href="/study" className="text-xs text-emerald-600 underline mt-1 inline-block">학습 내용 업로드하기 →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentReports.map((r) => (
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
                    {r.created_at ? formatShortDate(r.created_at) : ""}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 진행율 대시보드 */}
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

          {loadingProjects ? (
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
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {c.name}
                    </h3>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                      <Clock size={10} />{relativeTime(c.lastWhen)}
                    </span>
                  </div>

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

                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">{c.lastTitle}</p>

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

        {/* 최근 기록 */}
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
          {loadingLogs ? (
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
                      {formatShortDate(log.logged_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 스킬 큐레이션 */}
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
          {recentSkills.length === 0 && !loadingSkills ? (
            <div className="card p-6 text-center text-gray-400">
              <Terminal size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">등록된 스킬이 없습니다</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {recentSkills.map((skill) => {
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

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={handleSaveProject}
        />
      )}

      {viewingCard && (
        <LogViewerModal card={viewingCard} onClose={() => setViewingCard(null)} />
      )}
    </div>
  );
}
