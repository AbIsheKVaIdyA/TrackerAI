import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: member } = await supabase
    .from("workspace_members")
    .select("id, workspace_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ ok: true });
  }

  await supabase.from("workspace_members").delete().eq("id", member.id);

  const { count } = await supabase
    .from("workspace_members")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", member.workspace_id);

  // If empty, remove the workspace (cascade cleans tasks)
  if ((count ?? 0) === 0) {
    await supabase.from("workspaces").delete().eq("id", member.workspace_id);
  }

  return NextResponse.json({ ok: true });
}
