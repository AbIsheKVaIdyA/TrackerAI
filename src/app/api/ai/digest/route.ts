import { NextResponse } from "next/server";
import { askJson, todayContext } from "@/lib/ai/llm";
import type { AiDigestResult } from "@/lib/ai/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    tone?: "morning" | "evening";
    myName?: string;
    partnerName?: string;
    tasks?: { title: string; dueDate?: string | null; status: string; assignee: string }[];
    events?: { title: string; when: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ctx = todayContext();
  const hour = new Date().getHours();
  const tone =
    body.tone || (hour < 12 ? "morning" : hour >= 17 ? "evening" : "morning");

  const result = await askJson<AiDigestResult>({
    system: `Quiet ${tone} digest for a couple's shared board.
Exactly 3 short lines. Calm, useful, no hype, no guilt.
Today ${ctx.weekday} ${ctx.today}. Return JSON only.`,
    user: `Me: ${body.myName || "Me"}; Partner: ${body.partnerName || "Partner"}
Tasks: ${JSON.stringify(body.tasks ?? [])}
Events today: ${JSON.stringify(body.events ?? [])}

Respond: {"tone":"${tone}","lines":["line1","line2","line3"]}`,
  });

  if (result.unavailable) {
    return NextResponse.json({ error: result.error, unavailable: true }, { status: 503 });
  }
  if (!result.data) {
    return NextResponse.json({ error: result.error || "Failed" }, { status: 502 });
  }

  const lines = (result.data.lines || []).map((l) => String(l).slice(0, 140)).slice(0, 3);
  while (lines.length < 3) lines.push("You're clear for now.");

  return NextResponse.json({
    tone,
    lines,
  } satisfies AiDigestResult);
}
