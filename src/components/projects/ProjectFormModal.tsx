"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Modal } from "@/components/Modal";
import { PROJECT_COLOR_OPTIONS } from "@/lib/color";
import type { Project } from "@/lib/types";

interface Props {
  initial: Project | null;
  onSave: (name: string, desc: string, color: string) => Promise<void>;
  onClose: () => void;
}

export default function ProjectFormModal({ initial, onSave, onClose }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? PROJECT_COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(name.trim(), desc.trim(), color);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "프로젝트 편집" : "새 프로젝트"}
      maxWidth="max-w-md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">취소</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="btn-primary flex-1 justify-center"
          >
            <Save size={15} /> {saving ? "저장 중..." : isEdit ? "저장" : "만들기"}
          </button>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">프로젝트 이름 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: Personal Management 웹앱"
            className="input-field"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">설명</label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="프로젝트 간단 설명"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">컬러</label>
          <div className="flex gap-2">
            {PROJECT_COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
