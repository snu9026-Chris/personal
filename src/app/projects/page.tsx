"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderOpen, ArrowLeft } from "lucide-react";
import ProjectSidebar from "@/components/projects/ProjectSidebar";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import PlanningDocPanel from "@/components/projects/PlanningDocPanel";
import ProjectFormModal from "@/components/projects/ProjectFormModal";
import PlanningDocEditor from "@/components/projects/PlanningDocEditor";
import { useProjects } from "@/hooks/useProjects";
import { useProjectLogs } from "@/hooks/useProjectLogs";
import { usePlanningDocs } from "@/hooks/usePlanningDocs";
import { useToast } from "@/components/Toast";
import { sortProjectsByActivity } from "@/lib/dashboard-data";
import { DOC_TYPE_CONFIG, DOC_TYPE_PHASE_MAP } from "@/lib/constants";
import type { DocType, PlanningSection, Project } from "@/lib/types";

export default function ProjectsPage() {
  const { projects: rawProjects, isLoading: loadingProjects, create, update, remove } = useProjects();
  const { logs: allLogs } = useProjectLogs();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { logs, isLoading: loadingLogs, remove: removeLog } = useProjectLogs(selectedId);
  const {
    docs: planningDocs,
    isLoading: loadingDocs,
    create: createDoc,
    update: updateDoc,
    remove: removeDoc,
  } = usePlanningDocs(selectedId);
  const toast = useToast();

  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingDocType, setEditingDocType] = useState<DocType | null>(null);

  const projects = useMemo(
    () => sortProjectsByActivity(rawProjects, allLogs),
    [rawProjects, allLogs],
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId],
  );

  // 데스크톱에서 진입 시 가장 최근 프로젝트 자동 선택
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

  // ── 핸들러 ──
  const handleSaveProject = async (name: string, description: string, color: string) => {
    try {
      if (editingProject) {
        await update({ id: editingProject.id, name, description, color });
        setEditingProject(null);
        toast.success("프로젝트를 수정했습니다.");
      } else {
        const project = await create({ name, description, color });
        setSelectedId(project.id);
        setShowNewProject(false);
        toast.success("프로젝트를 생성했습니다.");
      }
    } catch (e) {
      toast.error(`저장 실패: ${(e as Error).message}`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("이 프로젝트를 삭제하시겠습니까? 24시간 내 복원 가능합니다.")) return;
    try {
      await remove(id);
      if (selectedId === id) setSelectedId(null);
      toast.success("프로젝트를 삭제했습니다. 24시간 내 복원 가능합니다.");
    } catch (e) {
      toast.error(`삭제 실패: ${(e as Error).message}`);
    }
  };

  const handleRestoreProject = async (id: string) => {
    try {
      await update({ id, restore: true });
      toast.success("프로젝트를 복원했습니다.");
    } catch (e) {
      toast.error(`복원 실패: ${(e as Error).message}`);
    }
  };

  const handleSaveDoc = async (docType: DocType, title: string, content: string) => {
    if (!selectedId) return;
    const existing = planningDocs.find((d) => d.doc_type === docType);
    const sections: PlanningSection[] = [{
      title: title || DOC_TYPE_CONFIG[docType].label,
      type: "overview",
      layout: "bullets",
      key_message: "",
      content,
    }];

    try {
      if (existing) {
        await updateDoc({ id: existing.id, title, sections });
      } else {
        await createDoc({
          project_id: selectedId,
          doc_type: docType,
          phase: DOC_TYPE_PHASE_MAP[docType],
          title,
          sections,
        });
      }
      setEditingDocType(null);
      toast.success("기획 문서를 저장했습니다.");
    } catch (e) {
      toast.error(`저장 실패: ${(e as Error).message}`);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("이 기획 문서를 삭제하시겠습니까?")) return;
    try {
      await removeDoc(id);
      toast.success("기획 문서를 삭제했습니다.");
    } catch (e) {
      toast.error(`삭제 실패: ${(e as Error).message}`);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await removeLog(id);
      toast.success("기록을 삭제했습니다.");
    } catch (e) {
      toast.error(`삭제 실패: ${(e as Error).message}`);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 flex flex-col md:flex-row overflow-hidden">

      <ProjectSidebar
        projects={projects}
        selectedId={selectedId}
        loading={loadingProjects}
        hidden={!!selectedProject}
        onSelect={setSelectedId}
        onCreate={() => setShowNewProject(true)}
        onEdit={setEditingProject}
        onDelete={handleDeleteProject}
        onRestore={handleRestoreProject}
      />

      <main className={`${selectedProject ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0 min-h-0`}>
        {selectedProject ? (
          <>
            <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex-shrink-0">
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

            <div className="flex-1 min-h-0">
              <div className="flex flex-col lg:flex-row h-full">
                <PlanningDocPanel
                  docs={planningDocs}
                  loading={loadingDocs}
                  onEdit={setEditingDocType}
                  onDelete={handleDeleteDoc}
                />
                <ProjectTimeline
                  logs={logs}
                  loading={loadingLogs}
                  onDeleteLog={handleDeleteLog}
                />
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

      {editingDocType && selectedId && (
        <PlanningDocEditor
          docType={editingDocType}
          existingDoc={planningDocs.find((d) => d.doc_type === editingDocType) ?? null}
          onSave={(title, content) => handleSaveDoc(editingDocType, title, content)}
          onClose={() => setEditingDocType(null)}
        />
      )}
    </div>
  );
}
