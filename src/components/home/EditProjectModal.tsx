"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/Modal";
import { PROJECT_COLOR_PALETTE } from "@/lib/color";
import type { Project } from "@/lib/types";

interface Props {
  project: Project;
  onClose: () => void;
  onSave: (id: string, name: string, color: string) => Promise<void>;
}

export default function EditProjectModal({ project, onClose, onSave }: Props) {
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color ?? PROJECT_COLOR_PALETTE[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(project.id, name.trim(), color);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={<><Pencil size={16} className="text-brand-500" />프로젝트 편집</>}
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300"
            placeholder="프로젝트 이름"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">아이콘 색상</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-lg transition-all ${
                  color === c ? "ring-2 ring-offset-2 ring-brand-400 scale-110" : "hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`색상 ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: color }} />
          <p className="text-sm text-gray-600 flex-1 truncate font-semibold">{name || "(이름 없음)"}</p>
        </div>
      </div>
    </Modal>
  );
}
