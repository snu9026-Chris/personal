"use client";

import useSWR from "swr";
import {
  REPORTS_KEY,
  createReport as apiCreate,
  updateReport as apiUpdate,
  deleteReport as apiDelete,
} from "@/lib/api";
import type { Report } from "@/lib/types";

export function useReports() {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ reports: Report[] }>(REPORTS_KEY);

  return {
    reports: data?.reports ?? [],
    isLoading,
    error,
    revalidate,
    create: async (report: Report) => {
      const { report: saved } = await apiCreate(report);
      await revalidate();
      return saved;
    },
    update: async (report: Partial<Report> & { id: string }) => {
      const { report: saved } = await apiUpdate(report);
      await revalidate();
      return saved;
    },
    remove: async (id: string) => {
      await apiDelete(id);
      await revalidate();
    },
  };
}
