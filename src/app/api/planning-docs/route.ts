import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { requireString, requireOneOf, requireUUID, requireUser, handleApiError } from "@/lib/api-helpers";

const DOC_TYPES = ["context_priming", "feature_spec", "screen_structure", "design_spec"] as const;
const PHASES = ["research", "feature", "screen", "design"] as const;

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const projectId = req.nextUrl.searchParams.get("project_id");
    let query = supabase.from("planning_docs").select("*").order("created_at", { ascending: true });
    if (projectId) query = query.eq("project_id", projectId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ docs: data ?? [] });
  } catch (err) {
    return handleApiError(err, "GET planning-docs");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const project_id = requireUUID(body.project_id, "project_id");
    const doc_type = requireOneOf(body.doc_type, [...DOC_TYPES], "doc_type");
    const phase = requireOneOf(body.phase, [...PHASES], "phase");
    const title = requireString(body.title, "title");

    const { data, error } = await supabase
      .from("planning_docs")
      .upsert(
        {
          project_id,
          doc_type,
          phase,
          title,
          summary: body.summary ?? null,
          key_decisions: body.key_decisions ?? [],
          sections: body.sections ?? [],
          dev_notes: body.dev_notes ?? {},
          tags: Array.isArray(body.tags) ? body.tags : [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id,doc_type" }
      )
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ doc: data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST planning-doc");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const id = requireUUID(body.id, "id");

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updateData.title = requireString(body.title, "title");
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.key_decisions !== undefined) updateData.key_decisions = body.key_decisions;
    if (body.sections !== undefined) updateData.sections = body.sections;
    if (body.dev_notes !== undefined) updateData.dev_notes = body.dev_notes;
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags : [];

    const { data, error } = await supabase
      .from("planning_docs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ doc: data });
  } catch (err) {
    return handleApiError(err, "PUT planning-doc");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireUser();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase.from("planning_docs").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "DELETE planning-doc");
  }
}
