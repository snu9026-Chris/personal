"use client";

import useSWR, { mutate } from "swr";
import {
  projectLogsKey,
  PROJECT_LOGS_KEY,
  createProjectLog as apiCreate,
  deleteProjectLog as apiDelete,
  type ProjectLogInput,
} from "@/lib/api";
import type { ProjectLog } from "@/lib/types";

/**
 * projectId가 주어지면 해당 프로젝트 로그만, 없으면 전체 로그.
 * 두 키는 서로 독립적으로 캐시되므로 mutation 후 둘 다 invalidate.
 */
export function useProjectLogs(projectId?: string | null) {
  const key = projectLogsKey(projectId);
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ logs: ProjectLog[] }>(key);

  const invalidateAll = async () => {
    // 현재 키 + 전체 로그 키 둘 다 무효화
    await Promise.all([
      mutate(key),
      mutate(PROJECT_LOGS_KEY),
    ]);
  };

  return {
    logs: data?.logs ?? [],
    isLoading,
    error,
    revalidate,
    create: async (input: ProjectLogInput) => {
      const { log } = await apiCreate(input);
      await invalidateAll();
      return log;
    },
    remove: async (id: string) => {
      await apiDelete(id);
      await invalidateAll();
    },
  };
}

export function invalidateProjectLogs(projectId?: string | null) {
  return Promise.all([
    mutate(projectLogsKey(projectId)),
    mutate(PROJECT_LOGS_KEY),
  ]);
}
