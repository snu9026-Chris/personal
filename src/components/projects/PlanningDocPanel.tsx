"use client";

import { useState } from "react";
import { FileText, Pencil, Loader2, Tag, Trash2 } from "lucide-react";
import { SectionRenderer } from "@/components/ReportPreview";
import { DOC_TYPE_CONFIG, DOC_TYPES } from "@/lib/constants";
import type { DocType, PlanningDoc } from "@/lib/types";

interface Props {
  docs: PlanningDoc[];
  loading: boolean;
  onEdit: (docType: DocType) => void;
  onDelete: (id: string) => void;
}

export default function PlanningDocPanel({ docs, loading, onEdit, onDelete }: Props) {
  const [activeDocType, setActiveDocType] = useState<DocType>("context_priming");

  const doc = docs.find((d) => d.doc_type === activeDocType);
  const cfg = DOC_TYPE_CONFIG[activeDocType];

  return (
    <div className="lg:w-1/2 lg:border-r border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-6 pt-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-brand-500" />
            <h2 className="font-bold text-gray-900 text-sm">기획 초안</h2>
          </div>
          <button
            onClick={() => onEdit(activeDocType)}
            className="w-7 h-7 rounded-lg bg-brand-50 text-brand-500 hover:bg-brand-100
                       flex items-center justify-center transition-colors"
            title="수기 입력"
          >
            <Pencil size={14} />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2">
          {DOC_TYPES.map((dt) => {
            const c = DOC_TYPE_CONFIG[dt];
            const hasDoc = docs.some((d) => d.doc_type === dt);
            return (
              <button
                key={dt}
                onClick={() => setActiveDocType(dt)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                            whitespace-nowrap transition-all flex-shrink-0
                            ${activeDocType === dt
                              ? `${c.bg} ${c.color} ${c.border} border`
                              : "text-gray-500 hover:bg-gray-100 border border-transparent"
                            }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
                {hasDoc && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : !doc ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl mb-3">{cfg.icon}</div>
            <p className="text-gray-400 text-sm font-medium mb-2">{cfg.label} 문서가 없습니다</p>
            <button
              onClick={() => onEdit(activeDocType)}
              className="text-xs text-brand-500 hover:underline"
            >
              직접 작성하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{doc.title}</h3>
                {doc.summary && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{doc.summary}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit(activeDocType)}
                  className="w-6 h-6 rounded-md hover:bg-brand-50 text-gray-400 hover:text-brand-500
                             flex items-center justify-center transition-colors"
                  title="편집"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="w-6 h-6 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500
                             flex items-center justify-center transition-colors"
                  title="삭제"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {doc.key_decisions?.length > 0 && (
              <div className={`rounded-xl p-3 ${cfg.bg} border ${cfg.border}`}>
                <p className="text-xs font-semibold text-gray-600 mb-1.5">핵심 결정사항</p>
                <ul className="space-y-1">
                  {doc.key_decisions.map((d, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                      <span className="flex-shrink-0">📌</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {doc.sections?.map((section, idx) => (
              <div key={idx} className="card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">{idx + 1}/{doc.sections.length}</span>
                  <h4 className="font-semibold text-gray-900 text-sm">{section.title}</h4>
                </div>
                <SectionRenderer section={section as never} />
              </div>
            ))}

            {doc.tags?.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                {doc.tags.map((tag) => (
                  <span key={tag} className="badge bg-gray-100 text-gray-500 text-xs">
                    <Tag size={9} className="mr-1" />{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 활성 doc type을 외부에서 알 필요가 있을 때를 위해 함께 export 가능하게 한다.
// 현재는 자체 state로 관리하고 외부 노출은 안 함.
