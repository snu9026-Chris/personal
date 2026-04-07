"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Target, CheckCircle2, Circle, ChevronLeft, ChevronRight,
  Save, Loader2, Plus, Trash2,
} from "lucide-react";
import {
  type GoalItem, type WeekGoals,
  MAX_GOALS, DAYS, DAYS_SHORT,
  getMondayOf, getWeekKey, progressColor, migrateGoalDays,
} from "@/lib/constants";

// ────── 헬퍼 ──────
function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  return `${fmt(monday)} ~ ${fmt(sunday)}`;
}

function getWeekDates(monday: Date): Date[] {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() - 1);
  return [sunday, ...Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  })];
}

function emptyGoal(): GoalItem {
  return { goal: "", memo: "", progress: 0 };
}

// ────── API ──────
async function fetchGoals(weekKey: string): Promise<WeekGoals> {
  const res = await fetch(`/api/goals?week=${weekKey}`);
  const { goals } = await res.json();
  if (!goals?.days) return {};
  return migrateGoalDays(goals.days as Record<string, unknown>);
}

async function saveGoals(weekKey: string, days: WeekGoals): Promise<void> {
  await fetch("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ week_key: weekKey, days }),
  });
}

// ────── 메인 ──────
export default function GoalsPage() {
  const today = new Date();
  const [currentMonday, setCurrentMonday] = useState<Date>(getMondayOf(today));
  const [goals, setGoals] = useState<WeekGoals>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number>(() => new Date().getDay());

  const weekKey = getWeekKey(currentMonday);
  const weekDates = getWeekDates(currentMonday);

  const load = useCallback(async (key: string) => {
    setLoading(true);
    try { setGoals(await fetchGoals(key)); }
    catch { setGoals({}); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(weekKey); setSaveState("idle"); }, [weekKey, load]);

  const handleSave = async () => {
    setSaveState("saving");
    try {
      await saveGoals(weekKey, goals);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  };

  // ── 하루 목표 접근 ──
  const dayGoals = goals[String(activeDay)] ?? [];

  const updateGoalField = (
    dayIdx: number,
    goalIdx: number,
    field: keyof GoalItem,
    value: string | number,
  ) => {
    setGoals((prev) => {
      const arr = [...(prev[String(dayIdx)] ?? [])];
      arr[goalIdx] = { ...arr[goalIdx], [field]: value };
      return { ...prev, [String(dayIdx)]: arr };
    });
  };

  const addGoal = (dayIdx: number) => {
    setGoals((prev) => {
      const arr = [...(prev[String(dayIdx)] ?? [])];
      if (arr.length >= MAX_GOALS) return prev;
      return { ...prev, [String(dayIdx)]: [...arr, emptyGoal()] };
    });
  };

  const removeGoal = (dayIdx: number, goalIdx: number) => {
    setGoals((prev) => {
      const arr = (prev[String(dayIdx)] ?? []).filter((_, i) => i !== goalIdx);
      return { ...prev, [String(dayIdx)]: arr };
    });
  };

  // ── 통계 ──
  const stats = useMemo(() => {
    const allItems = Object.values(goals).flat();
    const withGoal = allItems.filter((g) => g.goal.trim());
    return {
      totalWithGoal: withGoal.length,
      completedCount: withGoal.filter((g) => g.progress >= 100).length,
      avgProgress: withGoal.length > 0
        ? Math.round(withGoal.reduce((s, g) => s + g.progress, 0) / withGoal.length)
        : 0,
    };
  }, [goals]);
  const { totalWithGoal, completedCount, avgProgress } = stats;

  const isCurrentWeek = getWeekKey(getMondayOf(today)) === weekKey;

  const saveBtnLabel = { idle: "저장하기", saving: "저장 중...", saved: "저장됨 ✓", error: "오류 발생" }[saveState];
  const saveBtnExtra = saveState === "saved" ? "bg-emerald-500 hover:bg-emerald-600"
    : saveState === "error" ? "bg-red-500 hover:bg-red-600" : "";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Target size={22} className="text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">주간 목표 관리</h1>
                <p className="text-sm text-gray-400 mt-0.5">하루 최대 3개까지 목표를 설정할 수 있어요</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saveState === "saving"}
              className={`btn-primary ${saveBtnExtra}`}
            >
              {saveState === "saving" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saveBtnLabel}
            </button>
          </div>

          {/* 주 이동 */}
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => { const d = new Date(currentMonday); d.setDate(d.getDate() - 7); setCurrentMonday(d); setActiveDay(0); }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-700 flex-1 text-center">
              {formatWeekRange(currentMonday)}
              {isCurrentWeek && <span className="ml-2 badge bg-brand-50 text-brand-600 text-xs">이번 주</span>}
            </span>
            <button onClick={() => { const d = new Date(currentMonday); d.setDate(d.getDate() + 7); setCurrentMonday(d); setActiveDay(0); }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-brand-600">{totalWithGoal}</p>
            <p className="text-xs text-gray-500 mt-0.5">설정한 목표</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">달성 완료</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{avgProgress}%</p>
            <p className="text-xs text-gray-500 mt-0.5">평균 진행률</p>
          </div>
        </div>

        {/* 7일 탭 */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_SHORT.map((day, i) => {
              const items = goals[String(i)] ?? [];
              const hasAny = items.some((g) => g.goal.trim());
              const allDone = hasAny && items.filter((g) => g.goal.trim()).every((g) => g.progress >= 100);
              const isToday = weekDates[i].toDateString() === today.toDateString();
              const isActive = activeDay === i;
              return (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`flex flex-col items-center gap-1 py-3 px-1 transition-all border-b-2
                    ${isActive ? "border-brand-500 bg-brand-50" : "border-transparent hover:bg-gray-50"}`}>
                  <span className={`text-xs font-bold ${isActive ? "text-brand-600" : isToday ? "text-amber-600" : "text-gray-500"}`}>
                    {day}
                  </span>
                  <span className={`text-[11px] ${isActive ? "text-brand-500" : isToday ? "text-amber-500" : "text-gray-400"}`}>
                    {weekDates[i].getDate()}
                  </span>
                  {hasAny
                    ? allDone
                      ? <CheckCircle2 size={12} className="text-emerald-500" />
                      : <Circle size={12} className="text-gray-300" />
                    : <span className="w-3 h-3" />}
                  {/* 목표 개수 뱃지 */}
                  {items.filter((g) => g.goal.trim()).length > 0 && (
                    <span className="text-[10px] bg-brand-100 text-brand-600 rounded-full px-1 leading-tight">
                      {items.filter((g) => g.goal.trim()).length}개
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 선택된 날 */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">불러오는 중...</span>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* 날짜 헤더 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-800">{DAYS[activeDay]}</span>
                  <span className="text-sm text-gray-400">
                    {weekDates[activeDay].toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                  </span>
                  {weekDates[activeDay].toDateString() === today.toDateString() && (
                    <span className="badge bg-amber-50 text-amber-600 text-xs">오늘</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{dayGoals.filter(g => g.goal.trim()).length} / {MAX_GOALS}개</span>
              </div>

              {/* 목표 카드 목록 */}
              {dayGoals.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">아직 목표가 없어요. 아래 버튼으로 추가해보세요!</p>
              )}

              {dayGoals.map((item, gi) => (
                <div key={gi} className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50/50">
                  {/* 목표 헤더 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                      목표 {gi + 1}
                    </span>
                    <button onClick={() => removeGoal(activeDay, gi)}
                      className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* 목표 텍스트 */}
                  <input
                    type="text"
                    value={item.goal}
                    onChange={(e) => updateGoalField(activeDay, gi, "goal", e.target.value)}
                    placeholder="달성할 목표를 입력하세요..."
                    className="input-field text-sm"
                  />

                  {/* 메모 */}
                  <textarea
                    value={item.memo}
                    onChange={(e) => updateGoalField(activeDay, gi, "memo", e.target.value)}
                    placeholder="세부 계획, 참고 사항, 회고..."
                    rows={2}
                    className="input-field text-sm resize-none leading-relaxed"
                  />

                  {/* 진행률 */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-600">진행률</span>
                      <span className={`text-xs font-bold ${item.progress >= 100 ? "text-emerald-600" : "text-brand-600"}`}>
                        {item.progress}%{item.progress >= 100 && " 🎉"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0} max={100} step={5}
                      value={item.progress}
                      onChange={(e) => updateGoalField(activeDay, gi, "progress", Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${progressColor(item.progress)} ${item.progress}%, #e5e7eb ${item.progress}%)`,
                      }}
                    />
                    <div className="flex justify-between mt-1.5">
                      {[0, 25, 50, 75, 100].map((v) => (
                        <button key={v}
                          onClick={() => updateGoalField(activeDay, gi, "progress", v)}
                          className={`text-[11px] px-1.5 py-0.5 rounded-md transition-colors ${
                            item.progress === v ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}>
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* 목표 추가 버튼 */}
              {dayGoals.length < MAX_GOALS && (
                <button
                  onClick={() => addGoal(activeDay)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                             border-2 border-dashed border-gray-200 text-sm text-gray-400
                             hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50/50
                             transition-all duration-200"
                >
                  <Plus size={16} />
                  목표 추가 ({dayGoals.length}/{MAX_GOALS})
                </button>
              )}
            </div>
          )}
        </div>

        {/* 주간 요약 */}
        {!loading && (
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">주간 한눈에 보기</h3>
            <div className="space-y-3">
              {DAYS_SHORT.map((day, i) => {
                const items = (goals[String(i)] ?? []).filter((g) => g.goal.trim());
                return (
                  <button key={i} onClick={() => setActiveDay(i)}
                    className="w-full text-left hover:opacity-80 transition-opacity">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold w-6 text-center ${activeDay === i ? "text-brand-600" : "text-gray-500"}`}>
                        {day}
                      </span>
                      {items.length === 0
                        ? <span className="text-xs text-gray-300 italic">목표 없음</span>
                        : <span className="text-xs text-gray-400">{items.length}개 목표</span>}
                    </div>
                    {items.map((g, gi) => (
                      <div key={gi} className="flex items-center gap-2 ml-8 mb-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1.5 rounded-full transition-all"
                            style={{ width: `${g.progress}%`, backgroundColor: progressColor(g.progress) }} />
                        </div>
                        <span className="text-[11px] text-gray-400 w-7 text-right">{g.progress}%</span>
                        <span className="text-[11px] text-gray-500 flex-[3] truncate">{g.goal}</span>
                      </div>
                    ))}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 저장 하단 */}
        <div className="flex justify-end pb-4">
          <button onClick={handleSave} disabled={saveState === "saving"} className={`btn-primary ${saveBtnExtra}`}>
            {saveState === "saving" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saveState === "saving" ? "저장 중..." : "이번 주 목표 저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
