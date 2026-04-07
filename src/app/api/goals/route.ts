import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { requireString, requireUser, handleApiError } from "@/lib/api-helpers";

// GET /api/goals?week=2026-03-31  (월요일 날짜 key)
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const week = req.nextUrl.searchParams.get("week");
    if (!week) {
      return NextResponse.json({ error: "week param required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("week_goals")
      .select("*")
      .eq("week_key", week)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }
    return NextResponse.json({ goals: data ?? null });
  } catch (err) {
    return handleApiError(err, "GET goals");
  }
}

// POST /api/goals  — upsert 전체 주간 데이터
export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const week_key = requireString(body.week_key, "week_key");
    const days = body.days;

    if (!days || typeof days !== "object") {
      return NextResponse.json({ error: "days 객체가 필요합니다." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("week_goals")
      .upsert(
        { week_key, days, updated_at: new Date().toISOString() },
        { onConflict: "week_key" }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ goals: data });
  } catch (err) {
    return handleApiError(err, "POST goals");
  }
}
