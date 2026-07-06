import { NextRequest, NextResponse } from "next/server";
import { LEAD_PROFILE_COOKIE, type LeadProfile } from "@/types/lead";
import { E164_REGEX } from "@/lib/constants";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const name = str(body.name);
  const phone = str(body.phone);
  const currentRole = str(body.currentRole);
  const intent = str(body.intent);
  const background = str(body.background);

  const learningFocus = str(body.learningFocus);
  const careerGoal = str(body.careerGoal);
  const dreamRole = str(body.dreamRole);
  const targetCompanyType = str(body.targetCompanyType);
  const aiUsage = str(body.aiUsage);
  const aiShipped = str(body.aiShipped);
  const codingPracticeActivity = str(body.codingPracticeActivity);
  const systemDesignComfort = str(body.systemDesignComfort);
  const githubActivity = str(body.githubActivity);

  let yearsOfExperience: number | null = null;
  if (body.yearsOfExperience !== "" && body.yearsOfExperience !== null && body.yearsOfExperience !== undefined) {
    const parsed = Number(body.yearsOfExperience);
    if (Number.isNaN(parsed) || parsed < 0) {
      return NextResponse.json(
        { ok: false, error: "Years of experience must be a non-negative number." },
        { status: 400 }
      );
    }
    yearsOfExperience = parsed;
  }

  if (!name || !currentRole || !intent) {
    return NextResponse.json(
      { ok: false, error: "Name, current role, and intent are required." },
      { status: 400 }
    );
  }

  if (!E164_REGEX.test(phone)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Enter the lead's WhatsApp number in international format, e.g. +919876543210.",
      },
      { status: 400 }
    );
  }

  const lead: LeadProfile = {
    name,
    phone,
    currentRole,
    yearsOfExperience,
    intent,
    background,
    learningFocus,
    careerGoal,
    dreamRole,
    targetCompanyType,
    aiUsage,
    aiShipped,
    codingPracticeActivity,
    systemDesignComfort,
    githubActivity,
  };

  const response = NextResponse.json({ ok: true, lead });
  response.cookies.set(LEAD_PROFILE_COOKIE, JSON.stringify(lead), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
