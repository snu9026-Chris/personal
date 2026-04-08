import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { requireString, requireOneOf, requireUUID, requireUser, handleApiError, ValidationError } from "@/lib/api-helpers";

export async function GET() {
  try {
    await requireUser();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ projects: data ?? [] });
  } catch (err) {
    return handleApiError(err, "GET projects");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const name = requireString(body.name, "name");
    const status = requireOneOf(body.status ?? "in_progress", ["in_progress", "completed", "paused"], "status");

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        description: body.description ?? "",
        color: body.color ?? "#6366f1",
        status,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST project");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const id = requireUUID(body.id, "id");

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = requireString(body.name, "name");
    if (body.description !== undefined) updateData.description = body.description;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.status !== undefined) {
      updateData.status = requireOneOf(body.status, ["in_progress", "completed", "paused"], "status");
    }
    if (body.progress !== undefined) {
      const n = Number(body.progress);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        throw new ValidationError("progress는 0~100 사이 정수여야 합니다.");
      }
      updateData.progress = Math.round(n);
    }

    const { data, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ project: data });
  } catch (err) {
    return handleApiError(err, "PUT project");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireUser();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "DELETE project");
  }
}
