// ──────────────────────────────────────────
// 도메인 타입 — 클라이언트 전체에서 공용
// 서버 API 응답 shape를 미러링한다
// ──────────────────────────────────────────

export type ProjectStatus = "in_progress" | "completed" | "paused";
export type LogStatus = "in_progress" | "completed" | "blocked";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  progress?: number;
  created_at: string;
  deleted_at?: string | null;
}

export interface ProjectLog {
  id: string;
  project_id: string;
  title: string;
  content: string;
  status: LogStatus;
  tags: string[];
  logged_at: string;
}

export type DocType =
  | "context_priming"
  | "feature_spec"
  | "screen_structure"
  | "design_spec";

export interface PlanningSection {
  title: string;
  type: string;
  layout: string;
  key_message: string;
  content: string;
  points?: { term: string; explanation: string; priority?: string; example?: string }[];
}

export interface PlanningDoc {
  id: string;
  project_id: string;
  doc_type: DocType;
  phase: string;
  title: string;
  summary: string | null;
  key_decisions: string[];
  sections: PlanningSection[];
  dev_notes: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Skill {
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

// 홈 진행율 카드용 enriched 타입
export interface ProgressCard {
  id: string;
  name: string;
  color: string;
  progress: number;
  lastTitle: string;
  lastWhen: string;
  lastContent: string | null;
  nextStep: string | null;
}

// goals 페이지용 enriched 타입
export interface EnrichedProject extends Project {
  latestLog: ProjectLog | null;
  lastChange: string;
  effectiveColor: string;
}

// reports 타입은 supabase.ts에 정의된 것을 재export
export type { Report, ReportSection, SectionPoint, VocabItem } from "./supabase";
