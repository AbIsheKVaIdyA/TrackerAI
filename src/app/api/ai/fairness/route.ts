import { NextResponse } from "next/server";
import { askJson } from "@/lib/ai/llm";
import type { AiFairnessResult } from "@/lib/ai/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    partnerAName?: string;
    partnerBName?: string;
    openByAssignee?: { a: string[]; b: string[]; both: string[] };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const a = body.partnerAName || "Partner A";
  const b = body.partnerBName || "Partner B";
  const load = body.openByAssignee || { a: [], b: [], both: [] };

  const result = await askJson<AiFairnessResult>({
    system: `Soft fairness helper for couples. Never score or shame.
Only suggest a gentle swap/rebalance when open personal load looks uneven.
If balanced or unclear, suggestion must be null.
Return JSON only.`,
    user: `Open tasks:
${a} (a): ${JSON.stringify(load.a)}
${b} (b): ${JSON.stringify(load.b)}
Together: ${JSON.stringify(load.both)}

Respond: {"suggestion":"one sentence or null","rationale":"short why"}`,
  });

  if (result.unavailable) {
    return NextResponse.json({ error: result.error, unavailable: true }, { status: 503 });
  }
  if (!result.data) {
    return NextResponse.json({ error: result.error || "Failed" }, { status: 502 });
  }

  return NextResponse.json({
    suggestion: result.data.suggestion || null,
    rationale: result.data.rationale || "",
  } satisfies AiFairnessResult);
}
