import { list } from "@vercel/blob";

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

  try {
    const { blobs } = await list({ prefix: "submissions/", limit: 1000 });
    const submissions = [];

    for (const blob of blobs) {
      const res = await fetch(blob.url);
      const data = await res.json();
      submissions.push(data);
    }

    return Response.json(submissions, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
