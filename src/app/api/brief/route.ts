import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LEAD_PROFILE_COOKIE, type LeadProfile } from "@/types/lead";
import { composeBriefMessage } from "@/types/brief";
import { generateCallBrief } from "@/lib/groq";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LEAD_PROFILE_COOKIE)?.value;

  if (!raw) {
    return NextResponse.json(
      { ok: false, error: "No lead found. Go back to Lead Intake first." },
      { status: 400 }
    );
  }

  let lead: LeadProfile;
  try {
    lead = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Lead data is corrupted. Re-enter it on Lead Intake." },
      { status: 400 }
    );
  }

  let steering = "";
  try {
    const body = await request.json();
    if (typeof body?.steering === "string") steering = body.steering;
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  try {
    const content = await generateCallBrief(lead, steering);
    const message = composeBriefMessage(lead, content);
    return NextResponse.json({ ok: true, content, message });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error generating the brief.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
