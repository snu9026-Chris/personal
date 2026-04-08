import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, UnauthorizedError } from "@/lib/api-helpers";
import { LOGIC_SUMMARY_PROMPT } from "@/lib/logic-summary-skill";
import { supabase } from "@/lib/supabase-server";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return new Anthropic({ apiKey });
}

// ── DB에서 logic.summary prompt fetch + 5분 in-memory 캐시 ──
// 사용자가 sync-skills로 로컬 SKILL.md를 DB에 동기화하면 재배포 없이 즉시 반영됨
type CacheEntry = { prompt: string; expiresAt: number };
let promptCache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

async function getLogicSummaryPrompt(): Promise<string> {
  // 1) 캐시 hit
  if (promptCache && promptCache.expiresAt > Date.now()) {
    return promptCache.prompt;
  }
  // 2) DB 조회
  try {
    const { data, error } = await supabase
      .from("skills")
      .select("prompt")
      .eq("name", "logic.summary")
      .single();
    if (!error && data?.prompt) {
      promptCache = { prompt: data.prompt, expiresAt: Date.now() + CACHE_TTL_MS };
      return data.prompt;
    }
  } catch (e) {
    console.warn("logic.summary prompt DB fetch 실패, fallback 사용:", e);
  }
  // 3) Fallback: 인라인된 상수
  return LOGIC_SUMMARY_PROMPT;
}

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

    // logic.summary 스킬 system prompt — DB → 캐시 → fallback 순으로 결정
    const systemPrompt = await getLogicSummaryPrompt();

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
