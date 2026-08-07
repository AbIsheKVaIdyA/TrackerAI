import { NextResponse } from "next/server";
import { askJson, todayContext } from "@/lib/ai/llm";
import type { AiCaptureItem, AiCaptureResult } from "@/lib/ai/types";
import type { Category, Priority } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    text?: string;
    partnerAName?: string;
    partnerBName?: string;
    me?: "a" | "b";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text || text.length < 3) {
    return NextResponse.json({ error: "Need more text" }, { status: 400 });
  }

  const ctx = todayContext();
  const a = body.partnerAName || "Partner A";
  const b = body.partnerBName || "Partner B";
  const me = body.me === "b" ? "b" : "a";

  const result = await askJson<AiCaptureResult>({
    system: `You help couples capture shared life into Tandem (tasks + calendar events).
Partners: a="${a}", b="${b}". Current user is "${me === "a" ? a : b}" (id ${me}).
Today is ${ctx.weekday} ${ctx.today}, local time ${ctx.localTime}.

Rules:
- Propose structured items only. Never invent secrets.
- Prefer 1 item; use 2 when the text clearly needs both an event AND a follow-up task (e.g. flight + pick up).
- assignee: "a" | "b" | "both". Use names in text to map (e.g. "${b}" → "b").
- category: work|home|health|money|social|other
- priority: normal|critical
- Dates as YYYY-MM-DD relative to today. Times as HH:mm 24h.
- Titles short and clear. notes optional.
- summary: one friendly sentence of what you inferred.`,
    user: `Parse this capture into JSON:
{"summary":"string","items":[{"kind":"task"|"event","title":"string","assignee":"a"|"b"|"both","category":"home","priority":"normal","notes":null,"dueDate":null,"eventDate":null,"eventTime":null,"endTime":null}]}

Text: ${JSON.stringify(text)}`,
  });

  if (result.unavailable) {
    return NextResponse.json({ error: result.error, unavailable: true }, { status: 503 });
  }
  if (!result.data) {
    return NextResponse.json({ error: result.error || "Parse failed" }, { status: 502 });
  }

  const categories: Category[] = [
    "work",
    "home",
    "health",
    "money",
    "social",
    "other",
  ];

  // Light sanitize
  const items: AiCaptureItem[] = (result.data.items || [])
    .filter((i) => i?.title && (i.kind === "task" || i.kind === "event"))
    .slice(0, 4)
    .map((i) => {
      const priority: Priority =
        i.priority === "critical" ? "critical" : "normal";
      const category: Category = categories.includes(i.category as Category)
        ? (i.category as Category)
        : "other";
      return {
        kind: i.kind,
        title: String(i.title).slice(0, 160),
        assignee: ["a", "b", "both"].includes(i.assignee) ? i.assignee : "both",
        category,
        priority,
        notes: i.notes ?? null,
        dueDate: i.dueDate ?? null,
        eventDate: i.eventDate ?? null,
        eventTime: i.eventTime ?? null,
        endTime: i.endTime ?? null,
      };
    });

  return NextResponse.json({
    summary: result.data.summary || "Here's what I heard.",
    items,
  } satisfies AiCaptureResult);
}
