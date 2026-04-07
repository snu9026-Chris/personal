import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { requireString, requireUUID, requireOneOf, requireUser, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const projectId = req.nextUrl.searchParams.get("project_id");
    let query = supabase.from("project_logs").select("*").order("logged_at", { ascending: false });
    if (projectId) query = query.eq("project_id", projectId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ logs: data ?? [] });
  } catch (err) {
    return handleApiError(err, "GET project-logs");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const project_id = requireUUID(body.project_id, "project_id");
    const title = requireString(body.title, "title");
    const status = requireOneOf(body.status ?? "in_progress", ["in_progress", "completed", "blocked"], "status");

    const { data, error } = await supabase
      .from("project_logs")
      .insert({
        project_id,
        title,
        content: body.content ?? "",
        status,
        tags: Array.isArray(body.tags) ? body.tags : [],
        logged_at: body.logged_at ?? new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ log: data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST project-log");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireUser();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase.from("project_logs").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "DELETE project-log");
  }
}
