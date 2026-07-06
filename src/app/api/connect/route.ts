import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { EVALUATOR_PHONE_COOKIE } from "@/lib/constants";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export async function POST(request: NextRequest) {
  let phone: unknown;
  try {
    ({ phone } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  if (typeof phone !== "string" || !E164_REGEX.test(phone.trim())) {
    return NextResponse.json(
      {
        ok: false,
        error: "Enter a valid number in international format, e.g. +919876543210.",
      },
      { status: 400 }
    );
  }

  const normalized = phone.trim();

  try {
    await sendWhatsAppMessage(
      normalized,
      "You're connected to the Scaler Sales Copilot 👋\n\nPre-call briefs and post-call PDFs will land right here."
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Twilio error.";
    const friendly = message.toLowerCase().includes("not configured")
      ? message
      : "Twilio couldn't deliver that message. Make sure this number has joined the WhatsApp sandbox first (see instructions above), then try again.";
    return NextResponse.json({ ok: false, error: friendly }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(EVALUATOR_PHONE_COOKIE, normalized, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
