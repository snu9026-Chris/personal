import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, UnauthorizedError } from "@/lib/api-helpers";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

function getApiKeyFromEnvFile(): string {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf8");
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  } catch {}
  return "";
}

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY || getApiKeyFromEnvFile();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
  }
  return new Anthropic({ apiKey });
}

/**
 * logic.summary 스킬 로딩
 * 우선순위:
 *   1) 프로젝트 로컬: ./skills/logic.summary/SKILL.md
 *   2) 글로벌: ~/.claude/skills/logic.summary/SKILL.md
 *   3) fallback: 내장 기본 프롬프트
 */
function loadLogicSummarySkill(): string {
  const candidates = [
    join(process.cwd(), "skills", "logic.summary", "SKILL.md"),
    join(homedir(), ".claude", "skills", "logic.summary", "SKILL.md"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        const raw = readFileSync(path, "utf8");
        // frontmatter(--- ... ---) 제거
        return raw.replace(/^---[\s\S]*?---\n?/, "").trim();
      } catch {}
    }
  }
  return FALLBACK_PROMPT;
}

const FALLBACK_PROMPT = `당신은 학습 콘텐츠를 복습용 슬라이드로 변환하는 전문가입니다.
반드시 순수 JSON으로만 응답하세요 (코드블록 없이):
{
  "title": "...", "subject": "...", "difficulty": "easy|medium|hard",
  "summary": "...", "key_points": [], "sections": [], "vocabulary": [],
  "study_tips": [], "tags": []
}`;

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const body = await request.json();
    const { text, filename = "" } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "분석할 텍스트가 없습니다." },
        { status: 400 }
      );
    }

    const MAX_TEXT_LENGTH = 100_000;
    const trimmedText = text.length > MAX_TEXT_LENGTH
      ? text.slice(0, MAX_TEXT_LENGTH) + "\n\n...(이하 생략: 원문이 너무 길어 앞부분만 분석)"
      : text;

    // logic.summary 스킬을 system prompt로 사용
    const systemPrompt = loadLogicSummarySkill();

    const message = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `다음 학습 자료를 logic.summary 스킬에 따라 분석해주세요.\n\n파일명: ${filename}\n\n내용:\n${trimmedText}`
      }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // JSON 파싱
    let reportData;
    try {
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      reportData = JSON.parse(cleaned);
    } catch {
      reportData = {
        title: filename || "학습 노트",
        subject: "일반",
        difficulty: "medium",
        summary: responseText.substring(0, 300),
        key_points: ["내용을 확인하세요"],
        sections: [{ title: "전체 내용", content: responseText, type: "summary", layout: "bullets" }],
        vocabulary: [],
        study_tips: [],
        tags: [],
      };
    }

    return NextResponse.json({ report: reportData });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Summarize error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const userMessage = errMsg.includes("credit balance")
      ? "API 크레딧이 부족합니다. Anthropic 콘솔에서 충전해주세요."
      : errMsg.includes("too long") || errMsg.includes("too many tokens")
      ? "텍스트가 너무 깁니다. 더 짧은 내용으로 시도해주세요."
      : "AI 분석 중 오류가 발생했습니다. API 키를 확인해주세요.";
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}
