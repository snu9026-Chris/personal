"use client";

import Link from "next/link";
import { X, FileText, ListChecks } from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";
import { relativeTime } from "@/lib/format";
import { buildLastWorkMarkdown, buildNextWorkMarkdown } from "@/lib/log-parser";
import type { EnrichedProject } from "@/lib/types";

type ModalKind = "last" | "next";

interface Props {
  project: EnrichedProject;
  kind: ModalKind;
  onClose: () => void;
}

export default function GoalDetailModal({ project, kind, onClose }: Props) {
  const markdown = kind === "last"
    ? buildLastWorkMarkdown(project.latestLog)
    : buildNextWorkMarkdown(project.latestLog);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${project.effectiveColor}20` }}
            >
              {kind === "last"
                ? <FileText size={20} style={{ color: project.effectiveColor }} />
                : <ListChecks size={20} className="text-amber-500" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {kind === "last" ? "마지막 작업 내용" : "추가 작업 필요사항"}
              </p>
              <h3 className="text-lg font-bold text-gray-900 truncate">{project.name}</h3>
              {project.latestLog && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {relativeTime(project.lastChange)} 기록 기준
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <MarkdownContent content={markdown} />
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <Link href="/projects" className="text-xs text-gray-400 hover:text-brand-500 hover:underline">
            프로젝트 전체 기록 보기 →
          </Link>
          <button onClick={onClose} className="btn-secondary text-xs">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
