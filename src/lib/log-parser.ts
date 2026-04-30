import type { ProjectLog } from "./types";

// ──────────────────────────────────────────
// 로그 본문 마크다운 섹션 추출
// ──────────────────────────────────────────

/**
 * 본문에서 특정 이모지로 시작하는 헤딩의 섹션을 통째로 잘라낸다.
 * 다음 헤딩(#~######)이나 --- 가 나오면 종료.
 */
export function extractSection(content: string, emoji: string): string | null {
  if (!content) return null;
  const re = new RegExp(`###?\\s*${emoji}[^\\n]*\\n([\\s\\S]*?)(?=^#{1,6}\\s|^---\\s*$|\\Z)`, "m");
  const m = content.match(re);
  return m ? m[1].trim() : null;
}

/** 섹션의 첫 N개 bullet/줄을 추출 */
export function topLines(section: string, max = 5): string[] {
  if (!section) return [];
  const lines: string[] = [];
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) break;
    lines.push(line);
    if (lines.length >= max) break;
  }
  return lines;
}

/**
 * 로그 본문에서 "📌 추가 과제" 첫 bullet 1개를 추출 (홈 카드 미리보기용).
 */
export function firstNextStep(content: string): string | null {
  const section = extractSection(content, "📌");
  if (!section) return null;
  for (const line of section.split("\n")) {
    const bm = line.match(/^\s*[-*]\s*(?:\[[ x]\]\s*)?(.+?)\s*$/);
    if (bm && bm[1].trim()) return bm[1].trim();
  }
  return null;
}

/** "마지막 작업 내용" 마크다운 생성 (goals 페이지용) */
export function buildLastWorkMarkdown(log: ProjectLog | null): string {
  if (!log) return "_아직 이 프로젝트에 기록이 없습니다._";
  const changes = extractSection(log.content, "🔄") ?? "";
  const issues = extractSection(log.content, "🐛") ?? "";

  const parts: string[] = [`### ${log.title}`];
  if (changes) {
    const top = topLines(changes, 5).join("\n");
    if (top) parts.push("**주요 변경**\n\n" + top);
  }
  if (issues) {
    const top = topLines(issues, 3).join("\n");
    if (top) parts.push("**해결한 이슈**\n\n" + top);
  }
  if (parts.length === 1) {
    const fallback = log.content.split("\n").filter((l) => l.trim()).slice(0, 5).join("\n");
    if (fallback) parts.push(fallback);
  }
  return parts.join("\n\n");
}

/** "추가 작업 필요사항" 마크다운 생성 (goals 페이지용) */
export function buildNextWorkMarkdown(log: ProjectLog | null): string {
  if (!log) return "_아직 이 프로젝트에 기록이 없습니다._";
  const todos = extractSection(log.content, "📌") ?? "";
  if (!todos) return "_최근 기록에 후속 과제가 명시되지 않았습니다._";
  const top = topLines(todos, 5).join("\n");
  return "**다음에 이어서 할 일**\n\n" + top;
}
