"use client";

import { useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import type { EnrichedProject } from "@/lib/types";

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = first.getDay();
  const start = new Date(year, month, 1 - startWeekday);
  const totalDays = startWeekday + last.getDate();
  const cells = Math.ceil(totalDays / 7) * 7;
  return Array.from({ length: cells }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function dayInRange(day: Date, startIso: string, endIso: string): boolean {
  const t = day.getTime();
  const s = new Date(startIso); s.setHours(0, 0, 0, 0);
  const e = new Date(endIso);   e.setHours(23, 59, 59, 999);
  return t >= s.getTime() && t <= e.getTime();
}

interface ProjectBar {
  p: EnrichedProject;
  start: string;
  end: string;
}

interface Props {
  projects: EnrichedProject[];
  calendarDate: Date;
  onChangeDate: (d: Date) => void;
  today: Date;
}

export default function Calendar({ projects, calendarDate, onChangeDate, today }: Props) {
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const monthGrid = useMemo(() => getMonthGrid(calYear, calMonth), [calYear, calMonth]);
  const monthLabel = `${calYear}년 ${calMonth + 1}월`;

  // 캘린더 막대 — 모든 상태 포함
  const projectBars = useMemo<ProjectBar[]>(() => {
    return projects.map((p) => {
      const start = p.created_at;
      let end: string;
      if (p.status === "completed" || p.status === "paused") {
        end = p.latestLog?.logged_at ?? p.created_at;
      } else {
        end = new Date().toISOString();
      }
      return { p, start, end };
    });
  }, [projects]);

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <CalendarIcon size={18} className="text-amber-500" />
          타임라인 — {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeDate(new Date(calYear, calMonth - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="이전 달"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onChangeDate(new Date())}
            className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            오늘
          </button>
          <button
            onClick={() => onChangeDate(new Date(calYear, calMonth + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="다음 달"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={d} className={`text-center text-[11px] font-semibold py-1
            ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthGrid.map((d, i) => {
          const isCurrentMonth = d.getMonth() === calMonth;
          const isTodayCell = isSameDay(d, today);
          const activeBars = projectBars.filter(({ start, end }) => dayInRange(d, start, end));
          const started = projectBars.filter(({ start }) => isSameDay(new Date(start), d));
          const ended = projectBars.filter(({ end, p }) =>
            p.status === "completed" && isSameDay(new Date(end), d)
          );
          return (
            <div
              key={i}
              className={`min-h-[68px] rounded-lg border p-1 flex flex-col gap-1
                ${isCurrentMonth ? "bg-white border-gray-100" : "bg-gray-50/50 border-gray-50"}
                ${isTodayCell ? "ring-2 ring-amber-300 border-amber-200" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold
                  ${!isCurrentMonth ? "text-gray-300"
                    : isTodayCell ? "text-amber-600"
                    : d.getDay() === 0 ? "text-red-400"
                    : d.getDay() === 6 ? "text-blue-400"
                    : "text-gray-700"}`}>
                  {d.getDate()}
                </span>
                <div className="flex items-center gap-0.5">
                  {started.length > 0 && (
                    <span className="text-[8px] text-amber-600 font-bold leading-none" title="시작">▶</span>
                  )}
                  {ended.length > 0 && (
                    <CheckCircle2 size={9} className="text-emerald-500" />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-0.5 mt-auto">
                {activeBars.slice(0, 4).map(({ p }) => {
                  const isCompleted = p.status === "completed";
                  const isPaused = p.status === "paused";
                  return (
                    <div
                      key={p.id}
                      className="h-1.5 rounded-full"
                      style={{
                        backgroundColor: isCompleted ? `${p.effectiveColor}80` : p.effectiveColor,
                        backgroundImage: isPaused
                          ? `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)`
                          : undefined,
                        opacity: isCompleted ? 0.7 : 1,
                      }}
                      title={`${p.name} (${p.status === "completed" ? "완료" : p.status === "paused" ? "일시중지" : "진행 중"})`}
                    />
                  );
                })}
                {activeBars.length > 4 && (
                  <span className="text-[9px] text-gray-400 leading-none">+{activeBars.length - 4}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {projects.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1.5 rounded-full bg-brand-500" /> 진행 중
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1.5 rounded-full bg-brand-500/70" />
              <CheckCircle2 size={10} className="text-emerald-500" /> 완료
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-4 h-1.5 rounded-full bg-brand-500"
                style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)` }}
              /> 일시중지
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-600 font-bold">▶</span> 시작일
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.effectiveColor }} />
                <span className="font-medium text-gray-700">{p.name}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400">{formatShortDate(p.created_at)} 시작</span>
                {p.status === "completed" && (
                  <span className="text-emerald-600 text-[10px]">✓ 완료</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
