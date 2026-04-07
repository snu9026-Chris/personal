import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { requireString, requireOneOf, requireUUID, requireUser, handleApiError } from "@/lib/api-helpers";

// GET /api/reports - 보고서 목록 조회
export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const id = request.nextUrl.searchParams.get("id");

    if (id) {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return NextResponse.json({ report: data });
    }

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ reports: data ?? [] });
  } catch (err) {
    return handleApiError(err, "GET reports");
  }
}

// POST /api/reports - 보고서 저장
export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const body = await request.json();
    const title = requireString(body.title, "title");
    const difficulty = requireOneOf(body.difficulty ?? "medium", ["easy", "medium", "hard"], "difficulty");

    const { data, error } = await supabase
      .from("reports")
      .insert({
        title,
        subject: body.subject ?? "",
        difficulty,
        summary: body.summary ?? "",
        key_points: Array.isArray(body.key_points) ? body.key_points : [],
        sections: Array.isArray(body.sections) ? body.sections : [],
        vocabulary: Array.isArray(body.vocabulary) ? body.vocabulary : [],
        study_tips: Array.isArray(body.study_tips) ? body.study_tips : [],
        tags: Array.isArray(body.tags) ? body.tags : [],
        original_content: body.original_content ?? "",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ report: data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST report");
  }
}

// PUT /api/reports - 보고서 수정
export async function PUT(request: NextRequest) {
  try {
    await requireUser();
    const body = await request.json();
    const id = requireUUID(body.id, "id");

    const { id: _id, ...updateData } = body;
    if (updateData.difficulty) {
      requireOneOf(updateData.difficulty, ["easy", "medium", "hard"], "difficulty");
    }

    const { data, error } = await supabase
      .from("reports")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ report: data });
  } catch (err) {
    return handleApiError(err, "PUT report");
  }
}

// DELETE /api/reports - 보고서 삭제
export async function DELETE(request: NextRequest) {
  try {
    await requireUser();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID 필요" }, { status: 400 });

    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "DELETE report");
  }
}
