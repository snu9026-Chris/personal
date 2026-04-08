#!/usr/bin/env node
/**
 * sync-skills.mjs
 *
 * 로컬 ~/.claude/skills/* 와 ~/.claude/CLAUDE.md 에서 스킬을 읽어
 * Supabase skills 테이블에 동기화한다.
 *
 * 사용법:
 *   node scripts/sync-skills.mjs            # 동기화 실행
 *   node scripts/sync-skills.mjs --dry      # 변경사항만 출력 (DB 변경 X)
 *   node scripts/sync-skills.mjs --quiet    # 결과 한 줄만 출력 (hook용)
 *
 * 동작:
 *   1) ~/.claude/skills/<name>/SKILL.md → frontmatter 파싱 + 본문 → upsert (prompt 필드 채움)
 *   2) ~/.claude/CLAUDE.md 의 "## XXX 스킬" 섹션 → 신규만 INSERT (기존 행 보존)
 *
 * 환경변수: Personal Management의 .env.local에서 자동 로드
 */

import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, resolve, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CLAUDE_HOME = join(homedir(), ".claude");

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const QUIET = args.includes("--quiet");

// ─── Anthropic 기본 제공 스킬 (sync에서 제외) ───
// 사용자가 직접 만든 스킬만 홈페이지 /skills 페이지에 표시되도록 필터링.
// 새 사용자 스킬은 자동 포함되고, 여기 등록된 이름만 제외됨.
// 만약 이 중 하나를 사용자가 customize해서 sync하고 싶으면 해당 줄 주석 처리하면 됨.
const ANTHROPIC_BUILTIN_SKILLS = new Set([
  "algorithmic-art",
  "brand-guidelines",
  "canvas-design",
  "claude-api",
  "doc-coauthoring",
  "docx",
  "frontend-design",
  "internal-comms",
  "mcp-builder",
  "pdf",
  "pptx",
  "skill-creator",
  "slack-gif-creator",
  "theme-factory",
  "web-artifacts-builder",
  "webapp-testing",
  "xlsx",
]);

function log(...m) { if (!QUIET) console.log(...m); }
function logErr(...m) { console.error(...m); }

// ─── env 로드 ───
function loadEnv() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) {
    logErr("ERROR: .env.local not found at", path);
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) {
  logErr("ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local");
  process.exit(1);
}

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// ─── Supabase REST 헬퍼 ───
async function sbGet(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/skills?${query}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET skills: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sbInsert(body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/skills`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`INSERT skills: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sbPatch(id, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/skills?id=eq.${id}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH skills: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── "핵심 요약" 섹션에서 bullet 추출 ───
// 마크다운 본문에서 `## 핵심 요약` 또는 `### 핵심 요약` 헤딩 아래의 -/* bullet들을 추출.
// 다음 같은 레벨 헤딩이나 ---에서 종료.
function extractHighlights(body) {
  if (!body) return [];
  const re = /^(#{2,3})\s*핵심\s*요약\s*$/m;
  const m = body.match(re);
  if (!m) return [];
  const startLevel = m[1].length;
  const startIdx = m.index + m[0].length;
  const rest = body.slice(startIdx);

  // 종료 지점: 같은/상위 레벨의 다른 헤딩, 또는 --- 구분선
  const endRe = new RegExp(`^(#{1,${startLevel}}\\s|---\\s*$)`, "m");
  const endMatch = rest.match(endRe);
  const section = endMatch ? rest.slice(0, endMatch.index) : rest;

  const bullets = [];
  for (const line of section.split("\n")) {
    const bm = line.match(/^\s*[-*]\s+(.+?)\s*$/);
    if (bm) bullets.push(bm[1].trim());
  }
  return bullets;
}

// ─── frontmatter 파서 (lightweight, no yaml lib) ───
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { meta: {}, body: raw.trim() };
  const yaml = match[1];
  const body = raw.slice(match[0].length).trim();
  const meta = {};
  let currentKey = null;
  for (const line of yaml.split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const v = kv[2].trim();
      meta[currentKey] = v ? v.replace(/^["']|["']$/g, "") : [];
    } else if (line.match(/^\s+- /) && currentKey) {
      if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
      meta[currentKey].push(line.replace(/^\s+-\s*/, "").replace(/^["']|["']$/g, "").trim());
    }
  }
  return { meta, body };
}

// ─── 1) ~/.claude/skills/*/SKILL.md 수집 ───
function collectFormalSkills() {
  const skillsDir = join(CLAUDE_HOME, "skills");
  if (!existsSync(skillsDir)) return [];
  const out = [];
  for (const dir of readdirSync(skillsDir)) {
    const skillPath = join(skillsDir, dir, "SKILL.md");
    if (!existsSync(skillPath)) continue;
    try {
      const raw = readFileSync(skillPath, "utf-8");
      const { meta, body } = parseFrontmatter(raw);
      const name = (meta.name || dir).toString().trim();
      // Anthropic 기본 스킬은 제외
      if (ANTHROPIC_BUILTIN_SKILLS.has(name) || ANTHROPIC_BUILTIN_SKILLS.has(dir)) continue;
      out.push({
        name,
        description: (meta.description || "").toString().slice(0, 500),
        trigger: Array.isArray(meta.triggers) ? meta.triggers.join(" / ") : (meta.triggers || ""),
        details: extractHighlights(body),
        badges: ["formal", "SKILL.md"],
        color: "purple",
        location: `~/.claude/skills/${dir}/SKILL.md`,
        prompt: body, // 본문 전체를 prompt 필드로
        source: "skill-md",
      });
    } catch (e) {
      logErr(`SKIP ${skillPath}: ${e.message}`);
    }
  }
  return out;
}

// ─── 2) ~/.claude/CLAUDE.md 에서 "## XXX 스킬" 섹션 수집 ───
function collectClaudeMdSkills() {
  const path = join(CLAUDE_HOME, "CLAUDE.md");
  if (!existsSync(path)) return [];
  const content = readFileSync(path, "utf-8");
  const out = [];

  // ## 헤딩 기준으로 섹션 분리
  const sections = content.split(/^## /m).slice(1);
  for (const section of sections) {
    const newlineIdx = section.indexOf("\n");
    if (newlineIdx === -1) continue;
    const heading = section.slice(0, newlineIdx).trim();
    const body = section.slice(newlineIdx + 1).trim();

    // "스킬"이 헤딩에 포함된 것만 + "스킬 등록 규칙" 같은 메타 섹션 제외
    if (!heading.includes("스킬")) continue;
    if (heading.includes("등록") || heading.includes("규칙")) continue;

    const nameMatch = heading.match(/^(.*?)\s*스킬/);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();
    if (!name) continue;

    // description: 첫 서브섹션(### ...) 또는 --- 전까지의 intro 텍스트만
    const introMatch = body.match(/^([\s\S]*?)(?=^#{2,6}\s|^---\s*$)/m);
    const intro = introMatch ? introMatch[1] : body;
    const description = intro
      .replace(/^>\s.*$/gm, "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ")
      .slice(0, 300);

    // trigger: "### 트리거" 섹션이 있으면 거기서 추출
    const triggers = [];
    const tMatch = body.match(/###\s*트리거[^\n]*\n([\s\S]*?)(?=^###|\Z)/m);
    if (tMatch) {
      for (const line of tMatch[1].split("\n")) {
        const m = line.match(/^\s*-\s*"?(.+?)"?$/);
        if (m && m[1]) triggers.push(m[1].trim());
      }
    }

    out.push({
      name,
      description,
      trigger: triggers.join(" / "),
      details: extractHighlights(body),
      badges: ["CLAUDE.md"],
      color: "blue",
      location: "~/.claude/CLAUDE.md",
      prompt: null,
      source: "claude-md",
    });
  }
  return out;
}

// ─── 메인 동기화 ───
async function main() {
  const formal = collectFormalSkills();
  const claudeMd = collectClaudeMdSkills();
  log(`발견: SKILL.md ${formal.length}건, CLAUDE.md ${claudeMd.length}건`);

  // 기존 DB 스킬 로드
  let existing;
  try {
    existing = await sbGet("select=id,name,prompt,description,trigger,details");
  } catch (e) {
    logErr(`DB 조회 실패: ${e.message}`);
    process.exit(1);
  }
  const byName = new Map(existing.map((s) => [s.name.toLowerCase(), s]));

  function detailsEqual(a, b) {
    const A = Array.isArray(a) ? a : [];
    const B = Array.isArray(b) ? b : [];
    if (A.length !== B.length) return false;
    for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
    return true;
  }

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  // ── SKILL.md 스킬: 항상 upsert (source of truth) ──
  for (const skill of formal) {
    const dbRow = byName.get(skill.name.toLowerCase());
    const payload = {
      name: skill.name,
      description: skill.description,
      trigger: skill.trigger,
      details: skill.details,
      badges: skill.badges,
      color: skill.color,
      location: skill.location,
      prompt: skill.prompt,
    };
    if (!dbRow) {
      log(`  + INSERT  ${skill.name}  (SKILL.md)`);
      if (!DRY) {
        try { await sbInsert(payload); inserted++; }
        catch (e) { logErr(`    fail: ${e.message}`); errors++; }
      } else inserted++;
    } else {
      const changed =
        (dbRow.prompt || "") !== (skill.prompt || "") ||
        (dbRow.description || "") !== (skill.description || "") ||
        (dbRow.trigger || "") !== (skill.trigger || "") ||
        !detailsEqual(dbRow.details, skill.details);
      if (changed) {
        log(`  ~ UPDATE  ${skill.name}  (SKILL.md changed)`);
        if (!DRY) {
          try { await sbPatch(dbRow.id, payload); updated++; }
          catch (e) { logErr(`    fail: ${e.message}`); errors++; }
        } else updated++;
      } else {
        unchanged++;
      }
    }
  }

  // ── CLAUDE.md 스킬: details/description/trigger 변경 시 upsert (prompt는 건드리지 않음) ──
  for (const skill of claudeMd) {
    const dbRow = byName.get(skill.name.toLowerCase());
    const payload = {
      name: skill.name,
      description: skill.description,
      trigger: skill.trigger,
      details: skill.details,
      badges: skill.badges,
      color: skill.color,
      location: skill.location,
    };
    if (!dbRow) {
      log(`  + INSERT  ${skill.name}  (CLAUDE.md, new)`);
      if (!DRY) {
        try { await sbInsert(payload); inserted++; }
        catch (e) { logErr(`    fail: ${e.message}`); errors++; }
      } else inserted++;
      continue;
    }
    const changed =
      (dbRow.description || "") !== (skill.description || "") ||
      (dbRow.trigger || "") !== (skill.trigger || "") ||
      !detailsEqual(dbRow.details, skill.details);
    if (changed) {
      log(`  ~ UPDATE  ${skill.name}  (CLAUDE.md, summary changed)`);
      if (!DRY) {
        try { await sbPatch(dbRow.id, payload); updated++; }
        catch (e) { logErr(`    fail: ${e.message}`); errors++; }
      } else updated++;
    } else {
      unchanged++;
    }
  }

  const summary = `sync-skills: 신규 ${inserted}, 갱신 ${updated}, 변경없음 ${unchanged}${errors ? `, 에러 ${errors}` : ""}${DRY ? " (DRY RUN)" : ""}`;
  if (QUIET) console.log(summary);
  else log("\n" + summary);
}

main().catch((e) => {
  logErr("fatal:", e.message);
  process.exit(1);
});
