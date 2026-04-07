// ────── 공통 상수 ──────

export type DifficultyType = "easy" | "medium" | "hard";

export const DIFFICULTY_CONFIG: Record<DifficultyType, { label: string; color: string }> = {
  easy:   { label: "쉬움",   color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "보통",   color: "bg-amber-100 text-amber-700"     },
  hard:   { label: "어려움", color: "bg-red-100 text-red-700"         },
};

export const DAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"] as const;
export const DAYS_SHORT = ["일", "월", "화", "수", "목", "금", "토"] as const;

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

export function progressColor(p: number): string {
  return p >= 100 ? "#10b981" : "#6366f1";
}

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
