import { apiGet, apiPost, apiDelete } from "./client";
import type { Skill } from "../types";

export const SKILLS_KEY = "/api/skills";

export interface SkillInput {
  name: string;
  description: string;
  trigger?: string;
  details?: string[];
  badges?: string[];
  color?: string;
  location?: string;
}

export function fetchSkills() {
  return apiGet<{ skills: Skill[] }>(SKILLS_KEY);
}

export function createSkill(input: SkillInput) {
  return apiPost<{ skill: Skill }>(SKILLS_KEY, input);
}

export function deleteSkill(id: string) {
  return apiDelete(`${SKILLS_KEY}?id=${encodeURIComponent(id)}`);
}
