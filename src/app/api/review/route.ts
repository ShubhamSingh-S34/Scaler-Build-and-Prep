import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import { LEAD_PROFILE_COOKIE, type LeadProfile } from "@/types/lead";
import {
  CALL_INPUT_MODE_COOKIE,
  CALL_TRANSCRIPT_PATH_COOKIE,
  CALL_AUDIO_PATH_COOKIE,
  PDF_DIR_NAME,
} from "@/lib/constants";
import { transcribeAudioFile } from "@/lib/groq-transcribe";
import { generatePdfBrief } from "@/lib/groq-pdf";
import { buildPdfDocument } from "@/lib/pdf-document";

const PDF_DIR = path.join(os.tmpdir(), PDF_DIR_NAME);

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const leadRaw = cookieStore.get(LEAD_PROFILE_COOKIE)?.value;
  if (!leadRaw) {
    return NextResponse.json(
      { ok: false, error: "No lead found. Go back to Lead Intake first." },
      { status: 400 }
    );
  }
  let lead: LeadProfile;
  try {
    lead = JSON.parse(leadRaw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Lead data is corrupted. Re-enter it on Lead Intake." },
      { status: 400 }
    );
  }

  const mode = cookieStore.get(CALL_INPUT_MODE_COOKIE)?.value;
  if (mode !== "structured" && mode !== "audio") {
    return NextResponse.json(
      { ok: false, error: "No call input found. Go back to Call Input first." },
      { status: 400 }
    );
  }

  let transcript: string;
  try {
    if (mode === "structured") {
      const transcriptPath = cookieStore.get(CALL_TRANSCRIPT_PATH_COOKIE)?.value;
      if (!transcriptPath) {
        return NextResponse.json(
          { ok: false, error: "Transcript file reference missing. Re-save it on Call Input." },
          { status: 400 }
        );
      }
      transcript = await readFile(transcriptPath, "utf-8");
    } else {
      const audioPath = cookieStore.get(CALL_AUDIO_PATH_COOKIE)?.value;
      if (!audioPath) {
        return NextResponse.json(
          { ok: false, error: "Audio file reference missing. Re-upload it on Call Input." },
          { status: 400 }
        );
      }
      transcript = await transcribeAudioFile(audioPath);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Couldn't read the call input.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  let steering = "";
  try {
    const body = await request.json();
    if (typeof body?.steering === "string") steering = body.steering;
  } catch {
    // no body sent — fine, steering stays empty
  }

  try {
    const content = await generatePdfBrief(lead, transcript, steering);
    const pdfBytes = await buildPdfDocument(lead, content);

    await mkdir(PDF_DIR, { recursive: true });
    const pdfId = randomUUID();
    await writeFile(path.join(PDF_DIR, `${pdfId}.pdf`), pdfBytes);

    return NextResponse.json({
      ok: true,
      content,
      pdfId,
      transcript,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Something went wrong generating the PDF.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
