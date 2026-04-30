"use client";

import { FolderOpen, Plus, Loader2, Pencil, Trash2, ChevronRight, RotateCcw } from "lucide-react";
import type { Project } from "@/lib/types";

interface Props {
  projects: Project[];
  selectedId: string | null;
  loading: boolean;
  hidden: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export default function ProjectSidebar({
  projects, selectedId, loading, hidden,
  onSelect, onCreate, onEdit, onDelete, onRestore,
}: Props) {
  return (
    <aside className={`${hidden ? "hidden md:flex" : "flex"} w-full md:w-72 md:flex-shrink-0 bg-white border-r border-gray-100 flex-col`}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen size={18} className="text-brand-500" />
            진행 프로젝트
          </h2>
          <button
            onClick={onCreate}
            className="w-7 h-7 rounded-lg bg-brand-50 text-brand-500 hover:bg-brand-100
                       flex items-center justify-center transition-colors"
            title="새 프로젝트"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400">{projects.length}개 프로젝트</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400">프로젝트가 없습니다</p>
            <button onClick={onCreate} className="mt-2 text-sm text-brand-500 hover:underline">
              첫 프로젝트 만들기
            </button>
          </div>
        ) : (
          projects.map((p) => {
            const isDeleted = !!p.deleted_at;
            const isSelected = selectedId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => !isDeleted && onSelect(p.id)}
                className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3
                            group transition-all duration-150
                            ${isDeleted
                              ? "opacity-40 border border-dashed border-gray-300 cursor-default"
                              : `cursor-pointer ${isSelected
                                ? "bg-brand-50 border border-brand-100"
                                : "hover:bg-gray-50 border border-transparent"}`}`}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDeleted ? "text-gray-400 line-through" : isSelected ? "text-brand-700" : "text-gray-800"}`}>
                    {p.name}
                  </p>
                  {isDeleted ? (
                    <p className="text-xs text-red-400 mt-0.5">24시간 내 자동 삭제</p>
                  ) : p.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{p.description}</p>
                  )}
                </div>
                {isDeleted ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRestore(p.id); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-50 text-brand-600
                               text-xs font-medium hover:bg-brand-100 transition-colors"
                    title="복원"
                  >
                    <RotateCcw size={12} />
                    복원
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                        className="w-6 h-6 rounded-md hover:bg-brand-50 text-gray-400 hover:text-brand-500
                                   flex items-center justify-center transition-colors"
                        title="이름/색상 편집"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                        className="w-6 h-6 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500
                                   flex items-center justify-center transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {isSelected && <ChevronRight size={14} className="text-brand-400 flex-shrink-0" />}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
