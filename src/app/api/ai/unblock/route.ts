import { NextResponse } from "next/server";
import { askJson } from "@/lib/ai/llm";
import type { AiUnblockResult } from "@/lib/ai/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    title?: string;
    notes?: string | null;
    partnerName?: string;
    myName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const result = await askJson<AiUnblockResult>({
    system: `You help a partner unblock a stuck shared task.
Propose a concrete next step and a short kind message to ping their partner.
No guilt. Return JSON only.`,
    user: `My name: ${body.myName || "Me"}
Partner: ${body.partnerName || "Partner"}
Blocked task: ${JSON.stringify(body.title)}
Notes: ${JSON.stringify(body.notes || "")}

Respond: {"nextStep":"one concrete action for me","partnerMessage":"short ping under 160 chars"}`,
  });

  if (result.unavailable) {
    return NextResponse.json({ error: result.error, unavailable: true }, { status: 503 });
  }
  if (!result.data) {
    return NextResponse.json({ error: result.error || "Failed" }, { status: 502 });
  }

  return NextResponse.json({
    nextStep: String(result.data.nextStep || "").slice(0, 240),
    partnerMessage: String(result.data.partnerMessage || "").slice(0, 160),
  } satisfies AiUnblockResult);
}
