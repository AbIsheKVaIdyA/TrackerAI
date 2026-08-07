import Groq from "groq-sdk";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export function getGroq(): Groq | null {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new Groq({ apiKey: key });
}

/** Ask the model for JSON only; parse safely. */
export async function askJson<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<{ data: T | null; error?: string; unavailable?: boolean }> {
  const client = getGroq();
  if (!client) {
    return { data: null, unavailable: true, error: "GROQ_API_KEY not set" };
  }

  try {
    const msg = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: opts.maxTokens ?? 1024,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${opts.system}

Return ONLY valid JSON. No markdown fences. No commentary.
Never use em dashes (—) or en dashes (–). Use commas, periods, or colons instead.`,
        },
        { role: "user", content: opts.user },
      ],
    });

    const text = msg.choices[0]?.message?.content?.trim() || "";
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    return { data: JSON.parse(cleaned) as T };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "AI request failed",
    };
  }
}

export function todayContext() {
  const now = new Date();
  return {
    today: now.toISOString().slice(0, 10),
    weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
    localTime: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}
