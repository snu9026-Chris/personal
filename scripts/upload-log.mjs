#!/usr/bin/env node
/**
 * 프로젝트 로그 업로드 스크립트 (Claude Code 전용)
 *
 * 사용법:
 *   node scripts/upload-log.mjs \
 *     --title "2026-04-06 — 세션 제목" \
 *     --status "in_progress" \
 *     --tags "기능추가,bugfix" \
 *     --content "로그 마크다운 내용..."
 *
 * 또는 Claude Code에서 직접 함수를 import해서 사용 가능
 *
 * 환경변수: .env.local에서 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 읽음
 *           (RLS가 활성화되어 있으므로 anon key로는 동작하지 않음)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── .env.local 파싱 ──
function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
    const env = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
    return env;
  } catch {
    console.error("ERROR: .env.local 파일을 찾을 수 없습니다.");
    process.exit(1);
  }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다.");
  process.exit(1);
}

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// ── Supabase REST 호출 ──
async function supabaseGet(table, query = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${table} 실패: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${table} 실패: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── 프로젝트 ID 찾기 ──
async function findProjectId(name = "personal management") {
  const projects = await supabaseGet("projects", "select=id,name");
  const match = projects.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
  if (!match) throw new Error(`프로젝트 "${name}"을 찾을 수 없습니다. 등록된 프로젝트: ${projects.map(p=>p.name).join(", ")}`);
  return match.id;
}

// ── 로그 업로드 ──
async function uploadLog({ title, content, status = "in_progress", tags = [], project = "personal management" }) {
  const projectId = await findProjectId(project);
  console.log(`프로젝트: "${project}" → ID: ${projectId}`);

  const result = await supabasePost("project_logs", {
    project_id: projectId,
    title,
    content,
    status,
    tags,
    logged_at: new Date().toISOString(),
  });

  console.log("업로드 성공:", result[0]?.id ?? result);
  return result;
}

// ── CLI 실행 ──
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    parsed[key] = args[i + 1] ?? "";
  }
  return parsed;
}

const args = parseArgs();

if (!args.title || !args.content) {
  console.log(`
사용법:
  node scripts/upload-log.mjs \\
    --title "2026-04-06 — 세션 제목" \\
    --status "in_progress" \\
    --tags "기능추가,bugfix" \\
    --project "personal management" \\
    --content "로그 마크다운 내용..."
  `);
  process.exit(0);
}

uploadLog({
  title: args.title,
  content: args.content,
  status: args.status ?? "in_progress",
  tags: args.tags ? args.tags.split(",").map((t) => t.trim()) : [],
  project: args.project ?? "personal management",
}).catch((e) => {
  console.error("업로드 실패:", e.message);
  process.exit(1);
});
