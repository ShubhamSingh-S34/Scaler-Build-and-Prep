import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { EVALUATOR_PHONE_COOKIE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const phone = cookieStore.get(EVALUATOR_PHONE_COOKIE)?.value;

  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "No connected WhatsApp number. Go back and connect first." },
      { status: 400 }
    );
  }

  let message = "";
  try {
    const body = await request.json();
    message = typeof body?.message === "string" ? body.message : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  if (!message.trim()) {
    return NextResponse.json(
      { ok: false, error: "Nothing to send — generate a brief first." },
      { status: 400 }
    );
  }

  try {
    await sendWhatsAppMessage(phone, message);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Twilio error.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
