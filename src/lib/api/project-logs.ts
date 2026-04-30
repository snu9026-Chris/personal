import { apiGet, apiPost, apiDelete } from "./client";
import type { LogStatus, ProjectLog } from "../types";

export const PROJECT_LOGS_KEY = "/api/project-logs";

export function projectLogsKey(projectId?: string | null): string {
  return projectId
    ? `${PROJECT_LOGS_KEY}?project_id=${encodeURIComponent(projectId)}`
    : PROJECT_LOGS_KEY;
}

export interface ProjectLogInput {
  project_id: string;
  title: string;
  content?: string;
  status?: LogStatus;
  tags?: string[];
  logged_at?: string;
}

export function fetchProjectLogs(projectId?: string | null) {
  return apiGet<{ logs: ProjectLog[] }>(projectLogsKey(projectId));
}

export function createProjectLog(input: ProjectLogInput) {
  return apiPost<{ log: ProjectLog }>(PROJECT_LOGS_KEY, input);
}

export function deleteProjectLog(id: string) {
  return apiDelete(`${PROJECT_LOGS_KEY}?id=${encodeURIComponent(id)}`);
}
