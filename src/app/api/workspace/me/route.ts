import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { toWorkspace } from "@/lib/workspace-api";
import { workspaceToSettings, type WorkspaceRow } from "@/lib/couple";
import type { PartnerId } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: member, error } = await supabase
    .from("workspace_members")
    .select("partner_id, workspace_id, display_name")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    const msg = error.message || "";
    if (
      msg.includes("workspace_members") ||
      msg.includes("schema cache") ||
      msg.includes("PGRST205") ||
      msg.includes("does not exist")
    ) {
      return NextResponse.json(
        { error: "Run supabase/migrate-auth.sql", needsMigration: true },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!member) {
    return NextResponse.json({ membership: null });
  }

  const { data: ws, error: wsError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", member.workspace_id)
    .maybeSingle();

  if (wsError || !ws) {
    return NextResponse.json({ membership: null });
  }

  const { count } = await supabase
    .from("workspace_members")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", member.workspace_id);

  const row = ws as WorkspaceRow;
  const user = await currentUser();
  const displayName =
    member.display_name ||
    user?.firstName ||
    user?.username ||
    null;

  return NextResponse.json({
    membership: {
      workspace: toWorkspace(row),
      partnerId: member.partner_id as PartnerId,
      settings: workspaceToSettings(row),
      memberCount: count ?? 1,
      displayName,
    },
  });
}
