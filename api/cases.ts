export const config = { runtime: "edge" };

declare const process: { env: Record<string, string | undefined> };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return Response.json({ error: "POST required." }, { status: 405 });
  const backend = process.env.SITES_BACKEND_URL;
  const bearer = process.env.SITES_BACKEND_BEARER_TOKEN;
  if (!backend || !bearer) return Response.json({ error: "Shared case service is not configured." }, { status: 503 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 50_000) return Response.json({ error: "Request is too large." }, { status: 413 });

  const response = await fetch(new URL("/api/cases", backend), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "OAI-Sites-Authorization": `Bearer ${bearer}`,
    },
    body: await request.text(),
    signal: request.signal,
  });
  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
