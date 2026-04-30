"use client";

import { useState } from "react";
import { Plus, X, Save, Loader2 } from "lucide-react";
import type { SkillInput } from "@/lib/api";

const COLOR_OPTIONS = [
  { value: "blue", label: "파랑" },
  { value: "emerald", label: "초록" },
  { value: "purple", label: "보라" },
  { value: "amber", label: "주황" },
  { value: "red", label: "빨강" },
];

interface Props {
  onSubmit: (input: SkillInput) => Promise<void>;
  onSubmitted?: () => void;
}

export default function SkillForm({ onSubmit, onSubmitted }: Props) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [desc, setDesc] = useState("");
  const [details, setDetails] = useState("");
  const [badges, setBadges] = useState("");
  const [color, setColor] = useState("purple");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const reset = () => {
    setName(""); setTrigger(""); setDesc(""); setDetails(""); setBadges(""); setColor("purple");
  };

  const handleSave = async () => {
    if (!name.trim() || !desc.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: desc.trim(),
        trigger: trigger.trim(),
        details: details.split("\n").map((d) => d.trim()).filter(Boolean),
        badges: badges.split(",").map((t) => t.trim()).filter(Boolean),
        color,
      });
      setSaved(true);
      setTimeout(() => {
        reset();
        setSaved(false);
        onSubmitted?.();
      }, 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 border border-purple-100">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
        <Plus size={16} className="text-purple-500" />
        새 스킬 등록
      </h3>

      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">스킬 이름 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: auto.deploy" className="input text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">색상</label>
            <select value={color} onChange={(e) => setColor(e.target.value)} className="input text-sm">
              {COLOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">설명 *</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="이 스킬이 무엇을 하는지 설명..." className="input text-sm" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">트리거 문구</label>
          <input value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder='예: "배포해줘" 또는 "auto.deploy"' className="input text-sm" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">세부 사항 (줄바꿈으로 구분)</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} placeholder={"Vercel CLI로 자동 배포\n환경변수 자동 설정\n배포 후 URL 반환"} className="input text-sm font-mono" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">태그 (쉼표 구분)</label>
          <input value={badges} onChange={(e) => setBadges(e.target.value)} placeholder="배포, Vercel, 자동화" className="input text-sm" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={reset} className="btn-secondary text-sm">
            <X size={15} />초기화
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved || !name.trim() || !desc.trim()}
            className="btn-primary text-sm"
          >
            {saving ? <><Loader2 size={15} className="animate-spin" />저장 중...</>
              : saved ? <><Save size={15} />등록 완료!</>
              : <><Save size={15} />스킬 등록</>}
          </button>
        </div>
      </div>
    </div>
  );
}
