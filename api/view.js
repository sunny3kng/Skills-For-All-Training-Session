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
    const [subBlobs, fbBlobs] = await Promise.all([
      list({ prefix: "submissions/", limit: 2000 }),
      list({ prefix: "feedback/", limit: 2000 }),
    ]);

    const entries = [];

    for (const blob of subBlobs.blobs) {
      const res = await fetch(blob.url);
      const data = await res.json();
      entries.push({ ...data, form_type: "pre-check" });
    }

    for (const blob of fbBlobs.blobs) {
      const res = await fetch(blob.url);
      const data = await res.json();
      entries.push({ ...data, form_type: "feedback" });
    }

    entries.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return Response.json(entries, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
