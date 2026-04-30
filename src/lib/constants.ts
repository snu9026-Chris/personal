// ────── 공통 상수 ──────
import { CheckCircle2, AlertCircle, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DocType, LogStatus, ProjectStatus } from "./types";

export type DifficultyType = "easy" | "medium" | "hard";

export const DIFFICULTY_CONFIG: Record<DifficultyType, { label: string; color: string }> = {
  easy:   { label: "쉬움",   color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "보통",   color: "bg-amber-100 text-amber-700"     },
  hard:   { label: "어려움", color: "bg-red-100 text-red-700"         },
};

export const DAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"] as const;
export const DAYS_SHORT = ["일", "월", "화", "수", "목", "금", "토"] as const;

// ────── 프로젝트/로그 상태 매핑 ──────

interface StatusUI {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const LOG_STATUS_CONFIG: Record<LogStatus, StatusUI> = {
  in_progress: { label: "진행중", icon: Circle,       color: "text-blue-500",    bg: "bg-blue-50 text-blue-600" },
  completed:   { label: "완료",   icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 text-emerald-600" },
  blocked:     { label: "차단",   icon: AlertCircle,  color: "text-red-500",     bg: "bg-red-50 text-red-600" },
};

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, StatusUI> = {
  in_progress: { label: "진행 중",  icon: Circle,       color: "text-blue-500",    bg: "bg-blue-50 text-blue-600" },
  completed:   { label: "완료",     icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 text-emerald-600" },
  paused:      { label: "일시중지", icon: Circle,       color: "text-gray-400",    bg: "bg-gray-100 text-gray-500" },
};

// ────── 기획 문서 타입 ──────

export const DOC_TYPES: DocType[] = ["context_priming", "feature_spec", "screen_structure", "design_spec"];

export const DOC_TYPE_CONFIG: Record<DocType, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}> = {
  context_priming:  { label: "리서치",   icon: "🎯", color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200" },
  feature_spec:     { label: "기능기획", icon: "⚙️", color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200" },
  screen_structure: { label: "화면기획", icon: "🖥️", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  design_spec:      { label: "디자인",   icon: "🎨", color: "text-pink-600",    bg: "bg-pink-50",    border: "border-pink-200" },
};

export const DOC_TYPE_PHASE_MAP: Record<DocType, string> = {
  context_priming: "research",
  feature_spec: "feature",
  screen_structure: "screen",
  design_spec: "design",
};

// ────── 주간 목표 관련 ──────

export interface GoalItem {
  goal: string;
  memo: string;
  progress: number; // 0 ~ 100
}

export type DayGoals = GoalItem[];
export type WeekGoals = Record<string, DayGoals>; // key: "0"~"6"

export const MAX_GOALS = 3;

// ────── 날짜 헬퍼 ──────

export function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekKey(monday: Date): string {
  return monday.toISOString().slice(0, 10);
}

// progressColor는 lib/color.ts로 이전 — 호환을 위해 re-export
export { progressColor } from "./color";

/**
 * 구버전(단일 객체) → 배열 형식으로 마이그레이션
 */
export function migrateGoalDays(raw: Record<string, unknown>): WeekGoals {
  const result: WeekGoals = {};
  for (const key of Object.keys(raw)) {
    const val = raw[key];
    if (Array.isArray(val)) {
      result[key] = val as DayGoals;
    } else if (val && typeof val === "object") {
      result[key] = [val as GoalItem];
    }
  }
  return result;
}

// ────── 파일 업로드 ──────

export const MAX_UPLOAD_SIZE_MB = 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
