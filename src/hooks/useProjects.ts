"use client";

import useSWR, { mutate } from "swr";
import {
  PROJECTS_KEY,
  createProject as apiCreate,
  updateProject as apiUpdate,
  deleteProject as apiDelete,
  type ProjectInput,
  type ProjectUpdateInput,
} from "@/lib/api";
import type { Project } from "@/lib/types";

export function useProjects() {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ projects: Project[] }>(
    PROJECTS_KEY,
  );

  return {
    projects: data?.projects ?? [],
    isLoading,
    error,
    revalidate,
    create: async (input: ProjectInput) => {
      const { project } = await apiCreate(input);
      await revalidate();
      return project;
    },
    update: async (input: ProjectUpdateInput) => {
      const { project } = await apiUpdate(input);
      await revalidate();
      return project;
    },
    remove: async (id: string) => {
      await apiDelete(id);
      await revalidate();
    },
  };
}

// 외부에서 invalidate 트리거 (다른 hook에서 호출)
export function invalidateProjects() {
  return mutate(PROJECTS_KEY);
}
