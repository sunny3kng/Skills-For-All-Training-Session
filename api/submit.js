import crypto from "crypto";
import { put } from "@vercel/blob";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = {};
      for (const [key, value] of formData.entries()) {
        if (data[key]) {
          data[key] = Array.isArray(data[key])
            ? [...data[key], value]
            : [data[key], value];
        } else {
          data[key] = value;
        }
      }
    }

    const id = crypto.randomUUID();
    const submission = {
      ...data,
      submittedAt: new Date().toISOString(),
      id,
    };

    if (Array.isArray(submission.challenges)) {
      submission.challenges = submission.challenges.join(", ");
    }

    await put(`submissions/${id}.json`, JSON.stringify(submission), {
      contentType: "application/json",
      access: "public",
    });

    return Response.json({ success: true, id });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
