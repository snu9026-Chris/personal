import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { Project, ProjectStatus } from "../types";

export const PROJECTS_KEY = "/api/projects";

export interface ProjectInput {
  name: string;
  description?: string;
  color?: string;
  status?: ProjectStatus;
}

export interface ProjectUpdateInput {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  status?: ProjectStatus;
  progress?: number;
  restore?: true;
}

export function fetchProjects() {
  return apiGet<{ projects: Project[] }>(PROJECTS_KEY);
}

export function createProject(input: ProjectInput) {
  return apiPost<{ project: Project }>(PROJECTS_KEY, input);
}

export function updateProject(input: ProjectUpdateInput) {
  return apiPut<{ project: Project }>(PROJECTS_KEY, input);
}

export function deleteProject(id: string) {
  return apiDelete(`${PROJECTS_KEY}?id=${encodeURIComponent(id)}`);
}
