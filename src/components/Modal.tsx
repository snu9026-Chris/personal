"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** max-w-md / max-w-lg / max-w-xl / max-w-2xl 등 */
  maxWidth?: string;
  /** 본문 영역에 자체 스크롤 적용 (긴 컨텐츠) */
  scrollable?: boolean;
  /** 백드롭 클릭 시 닫기 (기본 true) */
  closeOnBackdrop?: boolean;
}

/**
 * 공용 모달 — 백드롭 + 카드 + ESC 닫기 + 헤더/푸터 슬롯.
 * 페이지별 모달은 이 컴포넌트를 감싸 자기 콘텐츠만 children으로 넘긴다.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-md",
  scrollable = false,
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} ${
          scrollable ? "max-h-[85vh] flex flex-col" : ""
        } animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div className="font-bold text-gray-900 flex items-center gap-2">{title}</div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className={scrollable ? "flex-1 overflow-y-auto" : ""}>{children}</div>
        {footer && (
          <div className="flex gap-2 p-5 border-t border-gray-100 flex-shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}
