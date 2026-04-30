"use client";

import Link from "next/link";
import { Clock, X, ExternalLink } from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";
import { formatDateTime } from "@/lib/format";
import type { ProgressCard } from "@/lib/types";

interface Props {
  card: ProgressCard;
  onClose: () => void;
}

export default function LogViewerModal({ card, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b border-gray-100 border-t-4 rounded-t-2xl"
          style={{ borderTopColor: card.color }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
                {card.name}
              </p>
              <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                {card.lastTitle}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {formatDateTime(card.lastWhen)}
                </span>
                <span>·</span>
                <span>진행률 {card.progress}%</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 flex-shrink-0"
              aria-label="닫기"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {card.lastContent ? (
            <MarkdownContent content={card.lastContent} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">아직 기록된 내용이 없습니다.</p>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <Link
            href="/goals"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-brand-600 hover:bg-brand-50 rounded-lg transition-colors font-semibold"
          >
            <ExternalLink size={12} />
            전체 진행상황 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
