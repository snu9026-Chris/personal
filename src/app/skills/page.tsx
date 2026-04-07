"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Upload, Rocket, Terminal, Code, FileText,
  Plus, X, Save, Loader2, Edit3, Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ──────────────────────────────────────────
// 타입
// ──────────────────────────────────────────
interface Skill {
  id: string;
  name: string;
  description: string;
  trigger: string;
  details: string[];
  badges: string[];
  color: string;
  location: string;
  created_at: string;
}

// 색상 → 아이콘/스타일 매핑
const COLOR_MAP: Record<string, { bg: string; text: string; badge: string; border: string; icon: LucideIcon }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-500",    badge: "bg-blue-50 text-blue-600",       border: "border-blue-100",    icon: Upload },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-500", badge: "bg-emerald-50 text-emerald-600", border: "border-emerald-100", icon: Rocket },
  purple:  { bg: "bg-purple-50",  text: "text-purple-500",  badge: "bg-purple-50 text-purple-600",   border: "border-purple-100",  icon: Terminal },
  amber:   { bg: "bg-amber-50",   text: "text-amber-500",   badge: "bg-amber-50 text-amber-600",     border: "border-amber-100",   icon: Edit3 },
  red:     { bg: "bg-red-50",     text: "text-red-500",     badge: "bg-red-50 text-red-600",         border: "border-red-100",     icon: Terminal },
};

const DEFAULT_COLOR = COLOR_MAP.purple;

const COLOR_OPTIONS = [
  { value: "blue", label: "파랑" },
  { value: "emerald", label: "초록" },
  { value: "purple", label: "보라" },
  { value: "amber", label: "주황" },
  { value: "red", label: "빨강" },
];

type TabType = "skills" | "write";

// ──────────────────────────────────────────
// 메인
// ──────────────────────────────────────────
export default function SkillsPage() {
  const [tab, setTab] = useState<TabType>("skills");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // 작성 폼
  const [skillName, setSkillName] = useState("");
  const [skillTrigger, setSkillTrigger] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [skillDetails, setSkillDetails] = useState("");
  const [skillBadges, setSkillBadges] = useState("");
  const [skillColor, setSkillColor] = useState("purple");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skills");
      const { skills: data } = await res.json();
      setSkills(data ?? []);
    } catch {
      // 에러 시 유지
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  const handleSave = async () => {
    if (!skillName.trim() || !skillDesc.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: skillName,
          description: skillDesc,
          trigger: skillTrigger,
          details: skillDetails.split("\n").map((d) => d.trim()).filter(Boolean),
          badges: skillBadges.split(",").map((t) => t.trim()).filter(Boolean),
          color: skillColor,
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setSaved(true);
      setTimeout(() => {
        setSkillName(""); setSkillTrigger(""); setSkillDesc("");
        setSkillDetails(""); setSkillBadges(""); setSkillColor("purple");
        setSaved(false);
        setTab("skills");
      }, 1500);
      fetchSkills();
    } catch {
      // 에러 처리
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 스킬을 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/skills?id=${id}`, { method: "DELETE" });
      fetchSkills();
    } catch {
      // 에러 처리
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Terminal size={24} className="text-purple-500" />
          Claude Code 스킬
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">~/.claude/CLAUDE.md</code> 에 등록된 스킬 목록.
          Claude Code에서 트리거 문구를 입력하면 자동 실행됩니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setTab("skills")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "skills" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-1.5"><Terminal size={15} />스킬 목록</span>
          </button>
          <button
            onClick={() => setTab("write")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "write" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-1.5"><Plus size={15} />스킬 등록</span>
          </button>
        </div>
        <span className="text-xs text-gray-400">{skills.length}개 스킬</span>
      </div>

      {/* ── 스킬 목록 탭 ── */}
      {tab === "skills" && (
        <div className="space-y-5">
          {loading ? (
            [...Array(2)].map((_, i) => <div key={i} className="card p-6 h-40 animate-pulse bg-gray-50" />)
          ) : skills.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">
              <Terminal size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">등록된 스킬이 없습니다</p>
              <button onClick={() => setTab("write")} className="text-xs text-purple-600 underline mt-2">
                첫 스킬 등록하기
              </button>
            </div>
          ) : (
            skills.map((skill) => {
              const c = COLOR_MAP[skill.color] ?? DEFAULT_COLOR;
              const Icon = c.icon;
              return (
                <div key={skill.id} className={`card p-6 border ${c.border}`}>
                  <div className="flex gap-4 items-start">
                    <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={24} className={c.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="font-bold text-gray-900 text-lg">{skill.name}</h2>
                          <div className="flex flex-wrap gap-1.5">
                            {skill.badges.map((b) => (
                              <span key={b} className={`badge text-[11px] ${c.badge}`}>{b}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(skill.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{skill.description}</p>

                      {skill.details.length > 0 && (
                        <div className="mt-4 space-y-1.5">
                          {skill.details.map((d, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-500">
                              <span className="text-gray-300 mt-0.5">-</span>
                              <span>{d}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 flex-wrap">
                        {skill.trigger && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Code size={12} />
                            트리거: <span className="font-mono text-gray-500">{skill.trigger}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <FileText size={12} />
                          {skill.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── 스킬 등록 탭 ── */}
      {tab === "write" && (
        <div className="card p-6 border border-purple-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
            <Plus size={16} className="text-purple-500" />
            새 스킬 등록
          </h3>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">스킬 이름 *</label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="예: auto.deploy"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">색상</label>
                <select value={skillColor} onChange={(e) => setSkillColor(e.target.value)} className="input text-sm">
                  {COLOR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">설명 *</label>
              <textarea
                value={skillDesc}
                onChange={(e) => setSkillDesc(e.target.value)}
                rows={3}
                placeholder="이 스킬이 무엇을 하는지 설명..."
                className="input text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">트리거 문구</label>
              <input
                type="text"
                value={skillTrigger}
                onChange={(e) => setSkillTrigger(e.target.value)}
                placeholder={'예: "배포해줘" 또는 "auto.deploy"'}
                className="input text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">세부 사항 (줄바꿈으로 구분)</label>
              <textarea
                value={skillDetails}
                onChange={(e) => setSkillDetails(e.target.value)}
                rows={4}
                placeholder={"Vercel CLI로 자동 배포\n환경변수 자동 설정\n배포 후 URL 반환"}
                className="input text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">태그 (쉼표 구분)</label>
              <input
                type="text"
                value={skillBadges}
                onChange={(e) => setSkillBadges(e.target.value)}
                placeholder="배포, Vercel, 자동화"
                className="input text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setSkillName(""); setSkillTrigger(""); setSkillDesc(""); setSkillDetails(""); setSkillBadges(""); setSkillColor("purple"); }}
                className="btn-secondary text-sm"
              >
                <X size={15} />초기화
              </button>
              <button
                onClick={handleSave}
                disabled={saving || saved || !skillName.trim() || !skillDesc.trim()}
                className="btn-primary text-sm"
              >
                {saving ? <><Loader2 size={15} className="animate-spin" />저장 중...</>
                  : saved ? <><Save size={15} />등록 완료!</>
                  : <><Save size={15} />스킬 등록</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
