import { apiPost, apiUpload } from "./client";
import type { Report } from "../types";

export function uploadDocument(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return apiUpload<{ text: string; filename: string; wordCount: number }>(
    "/api/upload",
    fd,
  );
}

export function summarize(text: string, filename = "") {
  return apiPost<{ report: Report }>("/api/summarize", { text, filename });
}
