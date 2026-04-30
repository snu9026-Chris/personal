"use client";

import useSWR from "swr";
import {
  SKILLS_KEY,
  createSkill as apiCreate,
  deleteSkill as apiDelete,
  type SkillInput,
} from "@/lib/api";
import type { Skill } from "@/lib/types";

export function useSkills() {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ skills: Skill[] }>(SKILLS_KEY);

  return {
    skills: data?.skills ?? [],
    isLoading,
    error,
    revalidate,
    create: async (input: SkillInput) => {
      const { skill } = await apiCreate(input);
      await revalidate();
      return skill;
    },
    remove: async (id: string) => {
      await apiDelete(id);
      await revalidate();
    },
  };
}
