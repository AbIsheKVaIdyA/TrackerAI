/** Browser-side helpers to call AI propose APIs */

async function postAi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `AI error ${res.status}`) as Error & {
      unavailable?: boolean;
    };
    err.unavailable = !!data.unavailable;
    throw err;
  }
  return data as T;
}

export const aiClient = {
  capture: (body: unknown) => postAi<import("./types").AiCaptureResult>("/api/ai/capture", body),
  review: (body: unknown) => postAi<import("./types").AiReviewResult>("/api/ai/review", body),
  fairness: (body: unknown) => postAi<import("./types").AiFairnessResult>("/api/ai/fairness", body),
  unblock: (body: unknown) => postAi<import("./types").AiUnblockResult>("/api/ai/unblock", body),
  digest: (body: unknown) => postAi<import("./types").AiDigestResult>("/api/ai/digest", body),
};
