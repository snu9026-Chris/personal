"use client";

import { Loader2, Clock, FileText, ListChecks } from "lucide-react";
import { relativeTime } from "@/lib/format";
import type { EnrichedProject } from "@/lib/types";

type ModalKind = "last" | "next";

interface Props {
  project: EnrichedProject;
  saving: boolean;
  onProgressChange: (value: number) => void;
  onProgressCommit: (value: number) => void;
  onOpenModal: (kind: ModalKind) => void;
}

export default function ProjectProgressCard({
  project, saving, onProgressChange, onProgressCommit, onOpenModal,
}: Props) {
  const progress = project.progress ?? 0;

  return (
    <div className="card p-5 flex flex-col gap-4 border-t-4" style={{ borderTopColor: project.effectiveColor }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-gray-900 leading-snug">{project.name}</h3>
        {project.status === "paused" && (
          <span className="badge bg-gray-100 text-gray-500 text-[10px] flex-shrink-0">일시중지</span>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">진행률</span>
          <span className="text-base font-bold flex items-center gap-1" style={{ color: project.effectiveColor }}>
            {progress}%
            {saving && <Loader2 size={11} className="animate-spin" />}
          </span>
        </div>
        <input
          type="range"
          min={0} max={100} step={5}
          value={progress}
          onChange={(e) => onProgressChange(Number(e.target.value))}
          onMouseUp={(e) => onProgressCommit(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => onProgressCommit(Number((e.target as HTMLInputElement).value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${project.effectiveColor} ${progress}%, #e5e7eb ${progress}%)`,
          }}
        />
      </div>

      <div className="text-[11px] text-gray-400 flex items-center gap-1">
        <Clock size={11} />
        마지막 활동 · {relativeTime(project.lastChange)}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button
          onClick={() => onOpenModal("last")}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
        >
          <FileText size={16} className="text-gray-400 group-hover:text-brand-500 transition-colors" />
          <span className="text-[11px] font-semibold text-gray-600 group-hover:text-brand-600">
            마지막 작업 내용
          </span>
        </button>
        <button
          onClick={() => onOpenModal("next")}
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
}
