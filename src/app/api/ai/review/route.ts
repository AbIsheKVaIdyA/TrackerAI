import { NextResponse } from "next/server";
import { askJson, todayContext } from "@/lib/ai/llm";
import type { AiReviewResult } from "@/lib/ai/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    partnerAName?: string;
    partnerBName?: string;
    done?: { title: string; assignee: string }[];
    open?: { title: string; assignee: string; status: string; dueDate?: string | null }[];
    events?: { title: string; when: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ctx = todayContext();
  const a = body.partnerAName || "Partner A";
  const b = body.partnerBName || "Partner B";

  const result = await askJson<AiReviewResult>({
    system: `You are a soft weekly review co-pilot for a couple using Tandem.
Partners: a=${a}, b=${b}. Today ${ctx.weekday} ${ctx.today}.
Tone: warm, brief, never naggy, never scoreboard. Suggest, don't command.
Return JSON only.`,
    user: `Board snapshot:
Done this week: ${JSON.stringify(body.done ?? [])}
Still open: ${JSON.stringify(body.open ?? [])}
Events this week: ${JSON.stringify(body.events ?? [])}

Respond:
{"summary":"2-3 sentences on the week","stuck":["up to 3 short stuck notes"],"focus":[{"title":"task title","reason":"why","assignee":"a"|"b"|"both"}]}
Exactly 3 focus items when possible.`,
  });

  if (result.unavailable) {
    return NextResponse.json({ error: result.error, unavailable: true }, { status: 503 });
  }
  if (!result.data) {
    return NextResponse.json({ error: result.error || "Failed" }, { status: 502 });
  }

  return NextResponse.json({
    summary: result.data.summary || "",
    stuck: (result.data.stuck || []).slice(0, 3),
    focus: (result.data.focus || []).slice(0, 3).map((f) => ({
      title: String(f.title).slice(0, 120),
      reason: String(f.reason || "").slice(0, 160),
      assignee: ["a", "b", "both"].includes(f.assignee) ? f.assignee : "both",
    })),
  } satisfies AiReviewResult);
}
