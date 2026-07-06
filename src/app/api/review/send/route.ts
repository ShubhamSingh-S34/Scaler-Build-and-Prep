import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendWhatsAppMedia } from "@/lib/twilio";
import { LEAD_PROFILE_COOKIE, type LeadProfile } from "@/types/lead";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const phone = lead.phone;
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "This lead has no WhatsApp number saved. Go back to Lead Intake." },
      { status: 400 }
    );
  }

  let pdfId = "";
  let coveringMessage = "";
  try {
    const body = await request.json();
    pdfId = typeof body?.pdfId === "string" ? body.pdfId : "";
    coveringMessage = typeof body?.coveringMessage === "string" ? body.coveringMessage : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  if (!UUID_RE.test(pdfId)) {
    return NextResponse.json(
      { ok: false, error: "Nothing to send — generate the PDF first." },
      { status: 400 }
    );
  }
  if (!coveringMessage.trim()) {
    return NextResponse.json(
      { ok: false, error: "Covering message can't be empty." },
      { status: 400 }
    );
  }

  const mediaUrl = new URL(`/api/pdf/${pdfId}`, request.nextUrl.origin).toString();

  try {
    await sendWhatsAppMedia(phone, coveringMessage.trim(), mediaUrl);
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unknown Twilio error.";
    const isLocal = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";
    const friendly =
      isLocal
        ? "Twilio couldn't fetch the PDF from a localhost URL — media sends only work once this app is deployed with a public URL (or tunnelled with something like ngrok)."
        : raw;
    return NextResponse.json({ ok: false, error: friendly }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
