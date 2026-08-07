import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateInviteCode, type WorkspaceRow } from "@/lib/couple";
import { createServerSupabase } from "@/lib/supabase-server";
import { toWorkspace } from "@/lib/workspace-api";
import { workspaceToSettings } from "@/lib/couple";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: {
    mode?: "solo" | "couple";
    name?: string;
    myName?: string;
    partnerName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mode = body.mode === "solo" ? "solo" : "couple";
  const supabase = createServerSupabase();

  const { data: existing } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You already have a space. Leave it first to create another." },
      { status: 409 }
    );
  }

  const user = await currentUser();
  const myName =
    body.myName?.trim() ||
    user?.firstName ||
    user?.username ||
    "You";
  const partnerName =
    mode === "solo"
      ? "Partner"
      : body.partnerName?.trim() || "Partner";
  const name =
    body.name?.trim() ||
    (mode === "solo" ? `${myName}'s space` : "Tandem");

  if (mode === "couple" && !body.myName?.trim()) {
    return NextResponse.json({ error: "Enter your name" }, { status: 400 });
  }
  if (mode === "couple" && !body.partnerName?.trim()) {
    return NextResponse.json(
      { error: "Enter your partner's name" },
      { status: 400 }
    );
  }

  let workspace: WorkspaceRow | null = null;
  let lastError = "Could not create workspace";

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        name,
        invite_code: code,
        partner_a_name: myName,
        partner_b_name: partnerName,
      })
      .select()
      .single();

    if (!error && data) {
      workspace = data as WorkspaceRow;
      break;
    }
    lastError = error?.message || lastError;
    if (
      lastError.includes("workspace") &&
      (lastError.includes("schema") || lastError.includes("does not exist"))
    ) {
      return NextResponse.json(
        { error: "Run supabase/migrate-workspaces.sql", needsMigration: true },
        { status: 503 }
      );
    }
    if (!lastError.includes("unique") && !lastError.includes("duplicate")) {
      return NextResponse.json({ error: lastError }, { status: 500 });
    }
  }

  if (!workspace) {
    return NextResponse.json({ error: lastError }, { status: 500 });
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    clerk_user_id: userId,
    partner_id: "a",
    display_name: myName,
  });

  if (memberError) {
    await supabase.from("workspaces").delete().eq("id", workspace.id);
    const msg = memberError.message || "";
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

  return NextResponse.json({
    membership: {
      workspace: toWorkspace(workspace),
      partnerId: "a" as const,
      settings: workspaceToSettings(workspace),
      memberCount: 1,
      mode,
    },
  });
}
