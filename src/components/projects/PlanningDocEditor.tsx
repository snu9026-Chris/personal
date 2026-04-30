"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Modal } from "@/components/Modal";
import { DOC_TYPE_CONFIG } from "@/lib/constants";
import type { DocType, PlanningDoc } from "@/lib/types";

interface Props {
  docType: DocType;
  existingDoc: PlanningDoc | null;
  onSave: (title: string, content: string) => Promise<void>;
  onClose: () => void;
}

export default function PlanningDocEditor({ docType, existingDoc, onSave, onClose }: Props) {
  const cfg = DOC_TYPE_CONFIG[docType];
  const firstSection = existingDoc?.sections?.[0];
  const [title, setTitle] = useState(existingDoc?.title ?? `${cfg.label} 기획`);
  const [content, setContent] = useState(firstSection?.content ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(title.trim(), content.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <>
          <span className="text-lg">{cfg.icon}</span>
          {existingDoc ? `${cfg.label} 편집` : `${cfg.label} 작성`}
        </>
      }
      maxWidth="max-w-2xl"
      scrollable
      footer={
        <>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">취소</button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || saving}
            className="btn-primary flex-1 justify-center"
          >
            <Save size={15} /> {saving ? "저장 중..." : "저장"}
          </button>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${cfg.label} 문서 제목`}
            className="input-field"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            내용 <span className="text-gray-400 font-normal">(마크다운 지원)</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`${cfg.label} 내용을 마크다운으로 작성하세요...`}
            className="input-field font-mono text-sm min-h-[300px] resize-y"
            rows={12}
          />
        </div>
      </div>
    </Modal>
  );
}
