// 홈/대시보드용 데이터 가공 헬퍼
import { pickColor } from "./color";
import { firstNextStep } from "./log-parser";
import type { ProgressCard, Project, ProjectLog } from "./types";

/**
 * 각 프로젝트의 최신 활동 시각 (log가 있으면 logged_at, 없으면 created_at)을
 * 기준으로 내림차순 정렬한다.
 */
export function sortProjectsByActivity<T extends Project>(
  projects: T[],
  logs: Pick<ProjectLog, "project_id" | "logged_at">[],
): T[] {
  const activityMs = (p: Project) => {
    const latest = logs.find((l) => l.project_id === p.id);
    return new Date(latest?.logged_at ?? p.created_at ?? 0).getTime();
  };
  return [...projects].sort((a, b) => activityMs(b) - activityMs(a));
}

/**
 * 진행 중 프로젝트 + 최신 로그를 매핑해 진행율 카드 데이터로 만든다.
 * 최신 활동순 정렬 후 limit개 반환.
 */
export function buildProgressCards(
  projects: Project[],
  logs: ProjectLog[],
  limit = 6,
): ProgressCard[] {
  return projects
    .filter((p) => p.status !== "completed")
    .map((p, idx) => {
      const latest = logs.find((l) => l.project_id === p.id) ?? null;
      return {
        id: p.id,
        name: p.name,
        color: pickColor(p, idx),
        progress: p.progress ?? 0,
        lastTitle: latest?.title ?? "기록 없음",
        lastWhen: latest?.logged_at ?? p.created_at ?? new Date().toISOString(),
        lastContent: latest?.content ?? null,
        nextStep: latest?.content ? firstNextStep(latest.content) : null,
      };
    })
    .sort((a, b) => new Date(b.lastWhen).getTime() - new Date(a.lastWhen).getTime())
    .slice(0, limit);
}
