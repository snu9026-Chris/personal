// ────── 타입 정의 (클라이언트/서버 공용) ──────
// 실제 Supabase 클라이언트는 server-only인 `supabase-server.ts`에서 export.
// 클라이언트 코드는 절대 DB에 직접 접근하지 말고 `/api/*` 라우트를 경유할 것.

export interface SectionPoint {
  term: string;
  explanation: string;
  example?: string;
}

export interface ReportSection {
  title: string;
  content: string;
  type: "concept" | "example" | "exercise" | "note" | "summary" | "comparison" | "process";
  layout?: "bullets" | "table" | "steps" | "cards" | "definition";
  key_message?: string;
  points?: SectionPoint[];
}

export interface VocabItem {
  term: string;
  definition: string;
}

export interface Report {
  id?: string;
  title: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  summary: string;
  key_points: string[];
  sections: ReportSection[];
  vocabulary: VocabItem[];
  study_tips: string[];
  tags: string[];
  original_content?: string;
  created_at?: string;
  updated_at?: string;
}
