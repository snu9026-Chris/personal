import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { requireString, requireUser, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    await requireUser();
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ skills: data ?? [] });
  } catch (err) {
    return handleApiError(err, "GET skills");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const name = requireString(body.name, "name");
    const description = requireString(body.description, "description");

    const { data, error } = await supabase
      .from("skills")
      .insert({
        name,
        description,
        trigger: body.trigger ?? "",
        details: Array.isArray(body.details) ? body.details : [],
        badges: Array.isArray(body.badges) ? body.badges : [],
        color: body.color ?? "purple",
        location: body.location ?? "~/.claude/CLAUDE.md",
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ skill: data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST skill");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireUser();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { error } = await supabase.from("skills").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "DELETE skill");
  }
}
