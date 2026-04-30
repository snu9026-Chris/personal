import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { Report } from "../types";

export const REPORTS_KEY = "/api/reports";

export function fetchReports() {
  return apiGet<{ reports: Report[] }>(REPORTS_KEY);
}

export function createReport(report: Report) {
  return apiPost<{ report: Report }>(REPORTS_KEY, report);
}

export function updateReport(report: Partial<Report> & { id: string }) {
  return apiPut<{ report: Report }>(REPORTS_KEY, report);
}

export function deleteReport(id: string) {
  return apiDelete(`${REPORTS_KEY}?id=${encodeURIComponent(id)}`);
}
