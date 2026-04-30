import type { Project } from "./types";

// 프로젝트 색상 팔레트 — DB color가 default(#6366f1)거나 비어있으면 인덱스 기반으로 fallback
export const PROJECT_COLOR_PALETTE = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#0ea5e9",
];

// 편집 모달용 — 8가지 컬러 (slate 추가 버전이 따로 있어 호환)
export const PROJECT_COLOR_OPTIONS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#64748b",
];

const DEFAULT_DB_COLOR = "#6366f1";

/**
 * DB color가 기본값이거나 비어있으면 인덱스 기반 팔레트로 override.
 * 같은 인덱스에서는 항상 같은 색을 보장한다.
 */
export function pickColor(p: Pick<Project, "color">, idx: number): string {
  return p.color && p.color !== DEFAULT_DB_COLOR
    ? p.color
    : PROJECT_COLOR_PALETTE[idx % PROJECT_COLOR_PALETTE.length];
}

export function progressColor(p: number): string {
  return p >= 100 ? "#10b981" : "#6366f1";
}
