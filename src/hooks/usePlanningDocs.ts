"use client";

import useSWR from "swr";
import {
  planningDocsKey,
  createPlanningDoc as apiCreate,
  updatePlanningDoc as apiUpdate,
  deletePlanningDoc as apiDelete,
  type PlanningDocCreateInput,
  type PlanningDocUpdateInput,
} from "@/lib/api";
import type { PlanningDoc } from "@/lib/types";

export function usePlanningDocs(projectId?: string | null) {
  const key = projectId ? planningDocsKey(projectId) : null;
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ docs: PlanningDoc[] }>(key);

  return {
    docs: data?.docs ?? [],
    isLoading,
    error,
    revalidate,
    create: async (input: PlanningDocCreateInput) => {
      const { doc } = await apiCreate(input);
      await revalidate();
      return doc;
    },
    update: async (input: PlanningDocUpdateInput) => {
      const { doc } = await apiUpdate(input);
      await revalidate();
      return doc;
    },
    remove: async (id: string) => {
      await apiDelete(id);
      await revalidate();
    },
  };
}
