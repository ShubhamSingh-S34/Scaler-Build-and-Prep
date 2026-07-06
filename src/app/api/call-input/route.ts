import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import {
  CALL_INPUT_MODE_COOKIE,
  CALL_TRANSCRIPT_PATH_COOKIE,
  CALL_AUDIO_PATH_COOKIE,
  CALL_INPUT_FILENAME_COOKIE,
} from "@/lib/constants";

// Transcripts and audio recordings can be too large/binary for cookies, so we write
// them to a temp dir on disk and keep only a small file-path reference in a cookie.
// Note: on stateless serverless hosts (e.g. Vercel) this only survives within the
// same instance — fine for this single-BDA demo, but swap for real object storage
// (S3 / Vercel Blob) before this needs to hold up across concurrent users.
const UPLOAD_DIR = path.join(os.tmpdir(), "scaler-sales-copilot-call-input");

const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20MB safety cap

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const mode = formData.get("mode");
  await mkdir(UPLOAD_DIR, { recursive: true });

  if (mode === "structured") {
    const transcript = formData.get("transcript");
    if (typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json(
        { ok: false, error: "Paste the call transcript first." },
        { status: 400 }
      );
    }

    const filePath = path.join(UPLOAD_DIR, `${randomUUID()}.txt`);
    await writeFile(filePath, transcript.trim(), "utf-8");

    const response = NextResponse.json({ ok: true, mode: "structured" });
    setCookies(response, { mode: "structured", transcriptPath: filePath });
    return response;
  }

  if (mode === "audio") {
    const file = formData.get("audio");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: "Choose an audio file first." }, { status: 400 });
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { ok: false, error: "That file's too large — keep it under 20MB for this demo." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || ".audio";
    const filePath = path.join(UPLOAD_DIR, `${randomUUID()}${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const response = NextResponse.json({ ok: true, mode: "audio", filename: file.name });
    setCookies(response, { mode: "audio", audioPath: filePath, filename: file.name });
    return response;
  }

  return NextResponse.json({ ok: false, error: "Invalid input mode." }, { status: 400 });
}

function setCookies(
  response: NextResponse,
  opts: { mode: "structured" | "audio"; transcriptPath?: string; audioPath?: string; filename?: string }
) {
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day — these are working files, not long-term state
  };

  response.cookies.set(CALL_INPUT_MODE_COOKIE, opts.mode, cookieOpts);

  if (opts.mode === "structured" && opts.transcriptPath) {
    response.cookies.set(CALL_TRANSCRIPT_PATH_COOKIE, opts.transcriptPath, cookieOpts);
    response.cookies.delete(CALL_AUDIO_PATH_COOKIE);
    response.cookies.delete(CALL_INPUT_FILENAME_COOKIE);
  }

  if (opts.mode === "audio" && opts.audioPath) {
    response.cookies.set(CALL_AUDIO_PATH_COOKIE, opts.audioPath, cookieOpts);
    response.cookies.set(CALL_INPUT_FILENAME_COOKIE, opts.filename ?? "recording", cookieOpts);
    response.cookies.delete(CALL_TRANSCRIPT_PATH_COOKIE);
  }
}
