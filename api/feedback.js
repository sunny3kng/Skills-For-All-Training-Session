import crypto from "crypto";
import { put, list } from "@vercel/blob";

const OPEN_TIME = new Date("2026-05-19T15:30:00+01:00");

export async function POST(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "verify") return handleVerify(request);
  if (action === "submit") return handleSubmit(request);

  return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
}

async function handleVerify(request) {
  try {
    const { first_name, state, track } = await request.json();

    if (!first_name || !state || !track) {
      return Response.json({ verified: false, reason: "missing_fields" });
    }

    if (new Date() < OPEN_TIME) {
      return Response.json({ verified: false, reason: "too_early" });
    }

    const { blobs } = await list({ prefix: "submissions/", limit: 2000 });

    for (const blob of blobs) {
      const res = await fetch(blob.url);
      const data = await res.json();
      if (
        data.first_name?.toLowerCase() === first_name.toLowerCase() &&
        data.state?.toLowerCase() === state.toLowerCase() &&
        data.track === track
      ) {
        return Response.json({ verified: true, track_label: trackToLabel(track) });
      }
    }

    return Response.json({ verified: false, reason: "not_found" });
  } catch (error) {
    return Response.json({ verified: false, reason: "error", error: error.message });
  }
}

async function handleSubmit(request) {
  try {
    if (new Date() < OPEN_TIME) {
      return Response.json({ success: false, error: "Form is not yet available" }, { status: 403 });
    }

    const data = await request.json();

    if (!data.first_name || !data.state || !data.track) {
      return Response.json({ success: false, error: "Missing identity fields" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const submission = {
      ...data,
      submittedAt: new Date().toISOString(),
      id,
    };

    if (Array.isArray(submission.future_topic)) {
      submission.future_topic = submission.future_topic.join(", ");
    }

    await put(`feedback/${id}.json`, JSON.stringify(submission), {
      contentType: "application/json",
      access: "public",
    });

    return Response.json({ success: true, id });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

const trackLabels = {
  culinary_arts: "Culinary Arts — Hilda Baci",
  fashion_styling: "Fashion Styling — Swanky Jerry",
  music_business: "Music Business — Asa Asika",
  dj: "DJing — DJ Xclusive",
  songwriting: "Songwriting — Johnny Drille",
  music_production: "Music Production & Business — Johnny Drille",
  sports_management: "Sports Management — Lanre Vigo",
  music_career_launch: "Music Career Launch — Wavy The Creator",
};

function trackToLabel(val) {
  return trackLabels[val] || val;
}
