"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Loader2, FolderOpen, ArrowRight } from "lucide-react";
import Calendar from "@/components/goals/Calendar";
import ProjectProgressCard from "@/components/goals/ProjectProgressCard";
import GoalDetailModal from "@/components/goals/GoalDetailModal";
import { useProjects } from "@/hooks/useProjects";
import { useProjectLogs } from "@/hooks/useProjectLogs";
import { useToast } from "@/components/Toast";
import { pickColor } from "@/lib/color";
import type { EnrichedProject } from "@/lib/types";

type ModalKind = "last" | "next";
interface ModalState { project: EnrichedProject; kind: ModalKind; }

export default function ProgressDashboardPage() {
  const { projects, isLoading: loadingProjects, update } = useProjects();
  const { logs, isLoading: loadingLogs } = useProjectLogs();
  const toast = useToast();

  const today = useMemo(() => new Date(), []);
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [modal, setModal] = useState<ModalState | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [progressOverride, setProgressOverride] = useState<Record<string, number>>({});

  const loading = loadingProjects || loadingLogs;

  // ESC로 모달 닫기 (Modal 컴포넌트 사용 안 한 경우 대비)
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  const allEnriched = useMemo<EnrichedProject[]>(() => {
    return projects.map((p, idx) => {
      const projectLogs = logs.filter((l) => l.project_id === p.id);
      const latest = projectLogs[0] ?? null;
      const lastChange = latest?.logged_at ?? p.created_at;
      // drag 중 진행률 override 적용
      const overrideProgress = progressOverride[p.id];
      return {
        ...p,
        progress: overrideProgress !== undefined ? overrideProgress : p.progress,
        latestLog: latest,
        lastChange,
        effectiveColor: pickColor(p, idx),
      };
    });
  }, [projects, logs, progressOverride]);

  const activeCards = useMemo<EnrichedProject[]>(() => {
    return allEnriched
      .filter((p) => p.status !== "completed")
      .sort((a, b) => new Date(b.lastChange).getTime() - new Date(a.lastChange).getTime());
  }, [allEnriched]);

  // 진행률 슬라이더 핸들러: drag 중에는 override만, mouseup 시 서버 commit
  const handleProgressChange = (projectId: string, value: number) => {
    setProgressOverride((prev) => ({ ...prev, [projectId]: value }));
  };

  const handleProgressCommit = async (projectId: string, value: number) => {
    setSavingId(projectId);
    try {
      await update({ id: projectId, progress: value });
      // 서버 응답이 SWR을 통해 반영되면 override 제거
      setProgressOverride((prev) => {
        const { [projectId]: _, ...rest } = prev;
        return rest;
      });
    } catch (e) {
      toast.error(`진행률 저장 실패: ${(e as Error).message}`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
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
            <Calendar
              projects={allEnriched}
              calendarDate={calendarDate}
              onChangeDate={setCalendarDate}
              today={today}
            />

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
                  {activeCards.map((p) => (
                    <ProjectProgressCard
                      key={p.id}
                      project={p}
                      saving={savingId === p.id}
                      onProgressChange={(v) => handleProgressChange(p.id, v)}
                      onProgressCommit={(v) => handleProgressCommit(p.id, v)}
                      onOpenModal={(kind) => setModal({ project: p, kind })}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {modal && (
        <GoalDetailModal
          project={modal.project}
          kind={modal.kind}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
