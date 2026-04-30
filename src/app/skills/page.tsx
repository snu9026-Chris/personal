"use client";

import { useState } from "react";
import { Terminal, Plus } from "lucide-react";
import SkillCard from "@/components/skills/SkillCard";
import SkillForm from "@/components/skills/SkillForm";
import { useSkills } from "@/hooks/useSkills";
import { useToast } from "@/components/Toast";

type TabType = "skills" | "write";

export default function SkillsPage() {
  const [tab, setTab] = useState<TabType>("skills");
  const { skills, isLoading, create, remove } = useSkills();
  const toast = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("이 스킬을 삭제하시겠습니까?")) return;
    try {
      await remove(id);
      toast.success("스킬을 삭제했습니다.");
    } catch (e) {
      toast.error(`삭제 실패: ${(e as Error).message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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

      {tab === "skills" && (
        <div className="space-y-5">
          {isLoading ? (
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
            skills.map((skill) => <SkillCard key={skill.id} skill={skill} onDelete={handleDelete} />)
          )}
        </div>
      )}

      {tab === "write" && (
        <SkillForm
          onSubmit={async (input) => {
            try {
              await create(input);
              toast.success("스킬을 등록했습니다.");
            } catch (e) {
              toast.error(`등록 실패: ${(e as Error).message}`);
              throw e;
            }
          }}
          onSubmitted={() => setTab("skills")}
        />
      )}
    </div>
  );
}
