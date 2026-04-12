"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FolderOpen, Plus, ChevronRight, Clock, Tag, CheckCircle2,
  AlertCircle, Circle, Loader2, Trash2, X, Save, ArrowLeft, Pencil, FileText, Activity
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

// ──────────────────────────────────────────
// 상수
// ──────────────────────────────────────────
const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#64748b",
];

const STATUS_CONFIG = {
  in_progress: { label: "진행중",  icon: Circle,       color: "text-blue-500",   bg: "bg-blue-50 text-blue-600"   },
  completed:   { label: "완료",    icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 text-emerald-600" },
  blocked:     { label: "블로킹",  icon: AlertCircle,  color: "text-red-500",    bg: "bg-red-50 text-red-600"     },
  paused:      { label: "일시중지", icon: Circle,       color: "text-gray-400",   bg: "bg-gray-100 text-gray-500"  },
};

// ──────────────────────────────────────────
// 날짜 그룹핑 헬퍼
// ──────────────────────────────────────────
function groupLogsByDate(logs: ProjectLog[]) {
  const groups: Record<string, ProjectLog[]> = {};
  logs.forEach((log) => {
    const date = new Date(log.logged_at).toLocaleDateString("ko-KR", {
      year: "numeric", month: "long", day: "numeric", weekday: "long",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
  });
  return groups;
}

// ──────────────────────────────────────────
// 메인
// ──────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedId);

  // ── 프로젝트 목록 불러오기 (최신 활동순 정렬) ──
  const fetchProjects = useCallback(async () => {
    const [projRes, logsRes] = await Promise.all([
      fetch("/api/projects"),
      fetch("/api/project-logs"),
    ]);
    const { projects: pData } = await projRes.json();
    const { logs: lData } = await logsRes.json();
    const allProjects: Project[] = pData ?? [];
    const allLogs: { project_id: string; logged_at: string }[] = lData ?? [];

    // 각 프로젝트의 최신 활동 시각 (log가 없으면 created_at)
    const activityMs = (p: Project) => {
      const latest = allLogs.find((l) => l.project_id === p.id);
      return new Date(latest?.logged_at ?? p.created_at ?? 0).getTime();
    };
    const sorted = [...allProjects].sort((a, b) => activityMs(b) - activityMs(a));
    setProjects(sorted);
    setLoadingProjects(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── 데스크톱에서 진입 시 가장 최근 프로젝트 자동 선택 ──
  // 모바일은 사이드바가 풀스크린이라 자동 선택하면 timeline으로 강제 이동되므로 제외
  useEffect(() => {
    if (
      projects.length > 0 &&
      !selectedId &&
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches
    ) {
      setSelectedId(projects[0].id);
    }
  }, [projects, selectedId]);

  // ── 로그 불러오기 ──
  const fetchLogs = useCallback(async (projectId: string) => {
    setLoadingLogs(true);
    const res = await fetch(`/api/project-logs?project_id=${projectId}`);
    const { logs: data } = await res.json();
    setLogs(data ?? []);
    setLoadingLogs(false);
  }, []);

  useEffect(() => {
    if (selectedId) fetchLogs(selectedId);
  }, [selectedId, fetchLogs]);

  // ── 탭 복귀 시 자동 갱신 ──
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      fetchProjects();
      if (selectedId) fetchLogs(selectedId);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchProjects, fetchLogs, selectedId]);

  // ── 프로젝트 저장 (생성 또는 수정) ──
  const handleSaveProject = async (name: string, description: string, color: string) => {
    if (editingProject) {
      // 수정: PUT
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingProject.id, name, description, color }),
      });
      const { project } = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
      setEditingProject(null);
    } else {
      // 생성: POST
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      });
      const { project } = await res.json();
      setProjects((prev) => [project, ...prev]);
      setSelectedId(project.id);
      setShowNewProject(false);
    }
  };

  // ── 프로젝트 삭제 ──
  const handleDeleteProject = async (id: string) => {
    if (!confirm("이 프로젝트와 모든 로그를 삭제하시겠습니까?")) return;
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(projects.find((p) => p.id !== id)?.id ?? null);
  };

  // ── 로그 삭제 ──
  const handleDeleteLog = async (id: string) => {
    await fetch(`/api/project-logs?id=${id}`, { method: "DELETE" });
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const groupedLogs = groupLogsByDate(logs);

  // ──────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col md:flex-row">

      {/* ────── 왼쪽: 프로젝트 목록 (모바일에선 선택 시 숨김) ────── */}
      <aside className={`${selectedProject ? "hidden md:flex" : "flex"} w-full md:w-72 md:flex-shrink-0 bg-white border-r border-gray-100 flex-col`}>
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen size={18} className="text-brand-500" />
              진행 프로젝트
            </h2>
            <button
              onClick={() => setShowNewProject(true)}
              className="w-7 h-7 rounded-lg bg-brand-50 text-brand-500 hover:bg-brand-100
                         flex items-center justify-center transition-colors"
              title="새 프로젝트"
            >
              <Plus size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-400">{projects.length}개 프로젝트</p>
        </div>

        {/* 프로젝트 리스트 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400">프로젝트가 없습니다</p>
              <button
                onClick={() => setShowNewProject(true)}
                className="mt-2 text-sm text-brand-500 hover:underline"
              >
                첫 프로젝트 만들기
              </button>
            </div>
          ) : (
            projects.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3
                            group transition-all duration-150 cursor-pointer
                            ${selectedId === p.id
                              ? "bg-brand-50 border border-brand-100"
                              : "hover:bg-gray-50 border border-transparent"}`}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${selectedId === p.id ? "text-brand-700" : "text-gray-800"}`}>
                    {p.name}
                  </p>
                  {p.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{p.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingProject(p); }}
                    className="w-6 h-6 rounded-md hover:bg-brand-50 text-gray-400 hover:text-brand-500
                               flex items-center justify-center transition-colors"
                    title="이름/색상 편집"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                    className="w-6 h-6 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500
                               flex items-center justify-center transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {selectedId === p.id && <ChevronRight size={14} className="text-brand-400 flex-shrink-0" />}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ────── 오른쪽: 타임라인 (모바일에선 선택 안 했을 때 숨김) ────── */}
      <main className={`${selectedProject ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {selectedProject ? (
          <>
            {/* 프로젝트 헤더 */}
            <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="md:hidden flex-shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
                    title="목록으로"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: selectedProject.color }} />
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">{selectedProject.name}</h1>
                    {selectedProject.description && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{selectedProject.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 콘텐츠 2컬럼 */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col lg:flex-row h-full">

                {/* 왼쪽: 기획 초안 */}
                <div className="lg:w-1/2 lg:border-r border-gray-100 px-4 md:px-6 py-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={16} className="text-brand-500" />
                    <h2 className="font-bold text-gray-900 text-sm">기획 초안</h2>
                  </div>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                      <FileText size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">아직 기획 초안이 없습니다</p>
                  </div>
                </div>

                {/* 오른쪽: 업데이트 현황 */}
                <div className="lg:w-1/2 px-4 md:px-6 py-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={16} className="text-brand-500" />
                    <h2 className="font-bold text-gray-900 text-sm">업데이트 현황</h2>
                  </div>
                  {loadingLogs ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={24} className="animate-spin text-gray-300" />
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                        <Clock size={24} className="text-gray-300" />
                      </div>
                      <p className="text-gray-400 text-sm font-medium">아직 로그가 없습니다</p>
                      <p className="text-gray-300 text-xs mt-1">
                        Claude Code에서 <code className="px-1.5 py-0.5 bg-gray-100 rounded text-brand-600 font-mono text-xs">update.recent</code> 트리거 시 자동 기록됩니다
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                        <div key={date}>
                          {/* 날짜 헤더 */}
                          <div className="flex items-center gap-3 mb-4 sticky top-0 bg-gray-50 py-2 z-10">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100
                                             px-3 py-1 rounded-full flex-shrink-0">
                              {date}
                            </span>
                            <div className="h-px flex-1 bg-gray-200" />
                          </div>

                          {/* 로그 카드들 */}
                          <div className="space-y-3 relative">
                            {/* 타임라인 선 */}
                            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />

                            {dateLogs.map((log) => {
                              const sc = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.in_progress;
                              const StatusIcon = sc.icon;
                              return (
                                <div key={log.id} className="flex gap-4 group">
                                  {/* 타임라인 도트 */}
                                  <div className="flex-shrink-0 w-10 flex items-start justify-center pt-3 z-10">
                                    <StatusIcon size={16} className={sc.color} fill={log.status === "completed" ? "currentColor" : "none"} />
                                  </div>

                                  {/* 카드 */}
                                  <div className="flex-1 card p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-gray-900 text-sm">{log.title}</h3>
                                        <span className={`badge text-xs ${sc.bg}`}>{sc.label}</span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs text-gray-400">
                                          {new Date(log.logged_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        <button
                                          onClick={() => handleDeleteLog(log.id)}
                                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md
                                                     hover:bg-red-50 text-gray-400 hover:text-red-500
                                                     flex items-center justify-center transition-all"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>

                                    {log.content && (
                                      <MarkdownContent content={log.content} className="mb-3" />
                                    )}

                                    {log.tags?.length > 0 && (
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {log.tags.map((tag) => (
                                          <span key={tag} className="badge bg-gray-100 text-gray-500 text-xs">
                                            <Tag size={9} className="mr-1" />{tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <FolderOpen size={36} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">왼쪽에서 프로젝트를 선택하거나 새로 만드세요</p>
          </div>
        )}
      </main>

      {/* ────── 프로젝트 생성/편집 모달 (공용) ────── */}
      {(showNewProject || editingProject) && (
        <ProjectFormModal
          initial={editingProject}
          onSave={handleSaveProject}
          onClose={() => {
            setShowNewProject(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// 프로젝트 생성/편집 모달 (공용)
// ──────────────────────────────────────────
function ProjectFormModal({
  initial, onSave, onClose,
}: {
  initial: Project | null;
  onSave: (name: string, desc: string, color: string) => void;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? PROJECT_COLORS[0]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{isEdit ? "프로젝트 편집" : "새 프로젝트"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">프로젝트 이름 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: Personal Management 웹앱"
              className="input-field"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">설명</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="프로젝트 간단 설명"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">컬러</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">취소</button>
          <button
            onClick={() => { if (name.trim()) onSave(name.trim(), desc.trim(), color); }}
            disabled={!name.trim()}
            className="btn-primary flex-1 justify-center"
          >
            <Save size={15} /> {isEdit ? "저장" : "만들기"}
          </button>
        </div>
      </div>
    </div>
  );
}
