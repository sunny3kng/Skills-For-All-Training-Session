import { kv } from "@vercel/kv";

export const config = { runtime: "edge" };

export async function GET(request) {
  const url = new URL(request.url);
  const token =
    request.headers.get("x-admin-token") || url.searchParams.get("token");

  if (token !== process.env.ADMIN_TOKEN) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const ids = await kv.lrange("submissions", 0, -1);
  const submissions = [];

  for (const id of ids) {
    const data = await kv.hgetall(`submission:${id}`);
    if (data) submissions.push(data);
  }

  return Response.json(submissions, {
    headers: { "Cache-Control": "no-store" },
  });
}
