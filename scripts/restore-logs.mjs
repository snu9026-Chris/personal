#!/usr/bin/env node
/**
 * 날짜별 세션 로그 복원 스크립트 (일회성)
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CLAUDE_HOME = join(homedir(), ".claude");
const PROJECT_ID = "b233064a-d478-4915-bec5-dda260457853";

// load env
function loadEnv() {
  const lines = readFileSync(join(ROOT, ".env.local"), "utf-8").split("\n");
  const env = {};
  for (const l of lines) {
    const t = l.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}
const env = loadEnv();

// scan jsonl files — Personal Management 프로젝트 디렉토리에서 직접
const pmDir = join(CLAUDE_HOME, "projects", "C--Users-USER-Desktop-Personal-Management");
const allFiles = [];
for (const f of readdirSync(pmDir)) {
  if (!f.endsWith(".jsonl")) continue;
  const fp = join(pmDir, f);
  const mtime = statSync(fp).mtime;
  if (mtime < new Date("2026-04-06")) continue;
  allFiles.push(fp);
}
console.log("Found", allFiles.length, "session files");

// extract messages grouped by KST date
const msgsByDate = {};
for (const fp of allFiles) {
  const lines = readFileSync(fp, "utf-8").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }
    if (obj.type !== "user" && obj.type !== "assistant") continue;
    if (!obj.timestamp) continue;
    const ts = new Date(obj.timestamp);
    if (ts < new Date("2026-04-06")) continue;
    const kst = new Date(ts.getTime() + 9 * 3600000);
    const dateKey = kst.toISOString().slice(0, 10);

    let text = "";
    if (typeof obj.message === "string") text = obj.message;
    else if (obj.message?.content) {
      if (typeof obj.message.content === "string") text = obj.message.content;
      else if (Array.isArray(obj.message.content)) {
        text = obj.message.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      }
    }
    if (!text || text.length < 5) continue;
    if (text.startsWith("{") || text.startsWith("[")) continue;
    if (text.length > 800) text = text.slice(0, 400) + "\n...\n" + text.slice(-400);

    if (!msgsByDate[dateKey]) msgsByDate[dateKey] = [];
    msgsByDate[dateKey].push(`[${obj.type}] ${text}`);
  }
}

const SKIP_DATES = new Set(["2026-04-08"]); // already good
const dates = Object.keys(msgsByDate).sort().filter(d => !SKIP_DATES.has(d));
console.log("Dates to restore:", dates);

for (const date of dates) {
  const msgs = msgsByDate[date];
  let transcript = msgs.join("\n---\n");
  if (transcript.length > 20000) transcript = transcript.slice(0, 20000);
  console.log(`\n--- ${date}: ${msgs.length} msgs, ${transcript.length} chars ---`);

  const SYSTEM = `당신은 Claude Code 세션 변경분을 요약하는 도구입니다. 오늘 날짜: ${date}

반드시 순수 JSON으로만 응답하라. 코드블록으로 감싸지 마라. JSON 앞뒤에 설명 텍스트 쓰지 마라.

출력 형식:
{"title":"${date} — 한 줄 요약","status":"in_progress","tags":["태그"],"content":"마크다운 본문"}

content 값 작성 시 JSON 이스케이프 필수 규칙:
- 줄바꿈은 반드시 \\n으로 (실제 개행 문자 넣지 마라)
- 큰따옴표는 \\"로 이스케이프
- content는 반드시 한 줄짜리 문자열이어야 한다

content 내용은 다음 3축 중심으로, 해당 내용 없는 섹션은 통째로 생략:

### 🗂 기획 / 결정
- 무엇을 만들거나 바꾸기로 했는지

### 🐛 문제 → 해결
> **문제**: 한 줄
> **원인**: 한 줄
> **해결**: 어떤 로직으로 풀었는지

### 📌 진행 상황
- 어디까지 됐는지 / 다음 할 일

규칙: 한 섹션 5줄 이내, 코드 인용 금지, 사소한 문제도 포함, tags: setup, bugfix, 기능추가, 환경설정, 배포, 리팩토링, 문서 중 선택`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: "user", content: "다음 변경분을 요약해줘:\n\n" + transcript }],
    }),
  });

  if (!res.ok) { console.error("API error:", res.status, await res.text()); continue; }
  const data = await res.json();
  const rawText = data.content?.[0]?.text || "";
  let cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  let summary;
  try {
    summary = JSON.parse(cleaned);
  } catch {
    // Extract JSON fields manually using regex
    try {
      const titleM = cleaned.match(/"title"\s*:\s*"([^"]*?)"/);
      const statusM = cleaned.match(/"status"\s*:\s*"([^"]*?)"/);
      const tagsM = cleaned.match(/"tags"\s*:\s*\[(.*?)\]/);
      // content: everything between "content":" and the last "}
      const contentStart = cleaned.indexOf('"content"');
      let contentBody = "";
      if (contentStart !== -1) {
        const afterColon = cleaned.indexOf(':', contentStart) + 1;
        const rest = cleaned.slice(afterColon).trim();
        // remove leading " and trailing "}
        contentBody = rest.replace(/^"/, "").replace(/"\s*\}\s*$/, "");
      }
      summary = {
        title: titleM?.[1] || `${date} — 진행 업데이트`,
        status: statusM?.[1] || "in_progress",
        tags: tagsM ? tagsM[1].split(",").map(t => t.trim().replace(/"/g, "")).filter(Boolean) : [],
        content: contentBody.replace(/\\n/g, "\n").replace(/\\"/g, '"'),
      };
    } catch {
      summary = { title: `${date} — 진행 업데이트`, status: "in_progress", tags: [], content: cleaned };
    }
  }

  console.log("Title:", summary.title);

  const loggedAt = date + "T15:00:00+09:00";
  const postRes = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/project_logs`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      project_id: PROJECT_ID,
      title: summary.title,
      content: summary.content || "",
      status: summary.status || "in_progress",
      tags: summary.tags || [],
      logged_at: loggedAt,
    }),
  });

  if (postRes.ok) {
    const r = await postRes.json();
    console.log("Uploaded:", r[0]?.id);
  } else {
    console.error("Upload failed:", postRes.status, await postRes.text());
  }
}

console.log("\nDone!");
