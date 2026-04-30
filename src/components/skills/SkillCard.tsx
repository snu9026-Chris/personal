"use client";

import React, { useState } from "react";
import { Trash2, ChevronDown, Code, FileText, Upload, Rocket, Terminal, Edit3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Skill } from "@/lib/types";

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string; border: string; icon: LucideIcon }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-500",    badge: "bg-blue-50 text-blue-600",       border: "border-blue-100",    icon: Upload },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-500", badge: "bg-emerald-50 text-emerald-600", border: "border-emerald-100", icon: Rocket },
  purple:  { bg: "bg-purple-50",  text: "text-purple-500",  badge: "bg-purple-50 text-purple-600",   border: "border-purple-100",  icon: Terminal },
  amber:   { bg: "bg-amber-50",   text: "text-amber-500",   badge: "bg-amber-50 text-amber-600",     border: "border-amber-100",   icon: Edit3 },
  red:     { bg: "bg-red-50",     text: "text-red-500",     badge: "bg-red-50 text-red-600",         border: "border-red-100",     icon: Terminal },
};
const DEFAULT_COLOR = COLOR_MAP.purple;

// 인라인 마크다운: **bold** + `code` 만 처리
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(<strong key={key++} className="font-semibold text-gray-900">{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(<code key={key++} className="bg-white border border-gray-200 text-purple-600 px-1.5 py-0.5 rounded text-[11px] font-mono">{tok.slice(1, -1)}</code>);
    }
    lastIdx = m.index + tok.length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}

interface Props {
  skill: Skill;
  onDelete: (id: string) => void;
}

export default function SkillCard({ skill, onDelete }: Props) {
  const c = COLOR_MAP[skill.color] ?? DEFAULT_COLOR;
  const Icon = c.icon;
  const [isOpen, setIsOpen] = useState(false);
  const hasDetails = skill.details && skill.details.length > 0;

  return (
    <div className={`card p-6 border ${c.border}`}>
      <div className="flex gap-4 items-start">
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={24} className={c.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <h2 className="font-bold text-gray-900 text-lg">{skill.name}</h2>
              <div className="flex flex-wrap gap-1.5">
                {skill.badges.map((b) => (
                  <span key={b} className={`badge text-[11px] ${c.badge}`}>{b}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onDelete(skill.id)}
              className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              aria-label="삭제"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{skill.description}</p>

          {hasDetails && (
            <button
              onClick={() => setIsOpen((v) => !v)}
              className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge} hover:opacity-80 transition-opacity`}
            >
              <ChevronDown size={13} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
              {isOpen ? "접기" : "자세히 보기"}
            </button>
          )}

          {hasDetails && isOpen && (
            <div className={`mt-4 rounded-xl ${c.bg} border ${c.border} p-4`}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">핵심 요약</h4>
              <ol className="space-y-2.5">
                {skill.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full ${c.badge} flex items-center justify-center text-[10px] font-bold`}>
                      {i + 1}
                    </span>
                    <span className="flex-1">{renderInlineMarkdown(d)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 flex-wrap">
            {skill.trigger && (
              <div className="flex items-start gap-1.5 text-xs text-gray-400">
                <Code size={12} className="mt-0.5 flex-shrink-0" />
                <span>트리거: <span className="font-mono text-gray-500">{skill.trigger}</span></span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <FileText size={12} />
              <span className="font-mono">{skill.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
