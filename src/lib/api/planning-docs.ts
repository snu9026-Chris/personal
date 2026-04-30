import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { DocType, PlanningDoc, PlanningSection } from "../types";

export const PLANNING_DOCS_KEY = "/api/planning-docs";

export function planningDocsKey(projectId?: string | null): string {
  return projectId
    ? `${PLANNING_DOCS_KEY}?project_id=${encodeURIComponent(projectId)}`
    : PLANNING_DOCS_KEY;
}

export interface PlanningDocCreateInput {
  project_id: string;
  doc_type: DocType;
  phase: string;
  title: string;
  summary?: string | null;
  key_decisions?: string[];
  sections?: PlanningSection[];
  dev_notes?: Record<string, unknown>;
  tags?: string[];
}

export interface PlanningDocUpdateInput {
  id: string;
  title?: string;
  summary?: string | null;
  key_decisions?: string[];
  sections?: PlanningSection[];
  dev_notes?: Record<string, unknown>;
  tags?: string[];
}

export function fetchPlanningDocs(projectId?: string | null) {
  return apiGet<{ docs: PlanningDoc[] }>(planningDocsKey(projectId));
}

export function createPlanningDoc(input: PlanningDocCreateInput) {
  return apiPost<{ doc: PlanningDoc }>(PLANNING_DOCS_KEY, input);
}

export function updatePlanningDoc(input: PlanningDocUpdateInput) {
  return apiPut<{ doc: PlanningDoc }>(PLANNING_DOCS_KEY, input);
}

export function deletePlanningDoc(id: string) {
  return apiDelete(`${PLANNING_DOCS_KEY}?id=${encodeURIComponent(id)}`);
}
