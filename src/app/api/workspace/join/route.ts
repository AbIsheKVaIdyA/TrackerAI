import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { type WorkspaceRow, workspaceToSettings } from "@/lib/couple";
import { createServerSupabase } from "@/lib/supabase-server";
import { toWorkspace } from "@/lib/workspace-api";
import type { PartnerId } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { code?: string; myName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cleaned = (body.code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (cleaned.length < 4) {
    return NextResponse.json({ error: "Enter a valid invite code" }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data: existing } = await supabase
    .from("workspace_members")
    .select("id, workspace_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You already have a space. Leave it first to join another." },
      { status: 409 }
    );
  }

  const { data: ws, error } = await supabase
    .from("workspaces")
    .select("*")
    .ilike("invite_code", cleaned)
    .maybeSingle();

  if (error) {
    const msg = error.message || "";
    if (msg.includes("workspaces") || msg.includes("PGRST205")) {
      return NextResponse.json(
        { error: "Run supabase/migrate-workspaces.sql", needsMigration: true },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  if (!ws) {
    return NextResponse.json({ error: "No workspace found for that code" }, { status: 404 });
  }

  const row = ws as WorkspaceRow;

  const { data: seats, error: seatsError } = await supabase
    .from("workspace_members")
    .select("partner_id")
    .eq("workspace_id", row.id);

  if (seatsError) {
    const msg = seatsError.message || "";
    if (
      msg.includes("workspace_members") ||
      msg.includes("schema cache") ||
      msg.includes("PGRST205")
    ) {
      return NextResponse.json(
        { error: "Run supabase/migrate-auth.sql", needsMigration: true },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const taken = new Set((seats || []).map((s) => s.partner_id));
  if (taken.size >= 2) {
    return NextResponse.json(
      { error: "This space already has both partners." },
      { status: 409 }
    );
  }

  const partnerId: PartnerId = taken.has("a") ? "b" : "a";
  const user = await currentUser();
  const myName =
    body.myName?.trim() ||
    user?.firstName ||
    user?.username ||
    (partnerId === "a" ? row.partner_a_name : row.partner_b_name);

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: row.id,
    clerk_user_id: userId,
    partner_id: partnerId,
    display_name: myName,
  });

  if (memberError) {
    if (memberError.message?.includes("unique") || memberError.code === "23505") {
      return NextResponse.json(
        { error: "That seat was just taken. Try again." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Update display name on the workspace for this seat
  const namePatch =
    partnerId === "a"
      ? { partner_a_name: myName }
      : { partner_b_name: myName };
  await supabase.from("workspaces").update(namePatch).eq("id", row.id);

  const { data: refreshed } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", row.id)
    .single();

  const finalRow = (refreshed || row) as WorkspaceRow;

  return NextResponse.json({
    membership: {
      workspace: toWorkspace(finalRow),
      partnerId,
      settings: workspaceToSettings(finalRow),
      memberCount: taken.size + 1,
    },
  });
}
