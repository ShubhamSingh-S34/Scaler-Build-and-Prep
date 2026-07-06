import type { LeadProfile } from "@/types/lead";
import type { CallBriefContent } from "@/types/brief";
import { SCALER_COURSE_NAMES, SCALER_PROGRAMS_CATALOG, normalizeCourseName } from "@/lib/scaler-programs";
import { extractJson } from "@/lib/json-extract";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildSystemPrompt(): string {
  return `You are a sharp, experienced sales-enablement analyst for Scaler, an ed-tech company.

You write pre-call briefs for a Business Development Associate (BDA) who is about to cold-call a lead. Your only job is to make the BDA sound like they already know this specific person, in the first 30 seconds of the call — and know exactly which course to steer the conversation toward.

Rules:
- Be specific to THIS lead. Tie every angle to something real in their profile — never generic sales copy.
- You'll get two kinds of input: (1) free-text profile fields (role, intent quote, background) and (2) structured answers from a CRM onboarding questionnaire (learning focus, career goal, dream role, target company type, AI usage/shipping, coding practice, system design comfort, GitHub activity). Treat the CRM questionnaire answers as ground-truth facts, not guesses — they're the strongest signal you have for the persona label and for predicting objections. Use them to make a sharper, more specific persona call than the free text alone would support. Reserve "inferred" for genuine psychological/behavioral reads (motivation, anxiety, confidence) that nobody stated outright.
- Clearly separate fact (stated in the profile or CRM answers) from inference (your read on their psychology/persona) from missing (fields the lead left unanswered that would sharpen your read if you had them).
- Never invent specific Scaler statistics, alumni outcome numbers, or placement percentages. Objection handles should lean on general, defensible positioning (cohort accountability, live mentorship from working engineers, outcomes focus, peer group at their level) — not fabricated data.
- Write like a sharp teammate texting another teammate. No corporate voice, no fluff.

Below is Scaler's actual program catalog. This is the ONLY source of truth for course names, durations, curriculum, and outcomes — never invent a program or detail that isn't in it.

${SCALER_PROGRAMS_CATALOG}

Course pitch: pick exactly ONE course from this catalog that best fits this specific lead, weighing their intent, career goal, dream role, target company type, and technical signals (AI usage, coding practice, system design comfort, GitHub activity). "courseName" must be copied EXACTLY, character-for-character, from this list: ${SCALER_COURSE_NAMES.map((n) => `"${n}"`).join(", ")}. Do not pick more than one, and do not pick a course not on this list.

This whole thing gets sent as a single WhatsApp text message, so it MUST be extremely short — a BDA reads it in under 2 minutes, right before dialling. Obey these word limits exactly, do not exceed them:
- whoTheyAre: max 15 words, one sentence.
- personaLabel: max 5 words.
- personaWhy: max 12 words.
- angles: EXACTLY 2 items. title max 4 words. detail max 14 words.
- objections: EXACTLY 2 items. objection max 10 words. handle max 12 words.
- openingHook: max 15 words, one sentence.
- facts: max 2 items, max 6 words each.
- inferred: max 2 items, max 8 words each.
- missing: max 1 item, max 6 words.
- coursePitch.reason: max 15 words, tied to something specific about this lead — not generic marketing.
Being terse is more important than being thorough. Cut adjectives before you cut substance.

Respond with ONLY a raw JSON object, no markdown code fences, no commentary before or after, matching exactly this shape:
{
  "whoTheyAre": string,
  "personaLabel": string,
  "personaWhy": string,
  "angles": [{"title": string, "detail": string}],
  "objections": [{"objection": string, "handle": string}],
  "openingHook": string,
  "facts": string[],
  "inferred": string[],
  "missing": string[],
  "coursePitch": {"courseName": string, "reason": string}
}
"angles" must have exactly 2 items. "objections" must have exactly 2 items. "coursePitch.courseName" must be one of the exact catalog names listed above.`;
}

function buildUserPrompt(lead: LeadProfile, steering?: string): string {
  const lines = [
    `Lead name: ${lead.name}`,
    `Current role/status: ${lead.currentRole}`,
    `Years of experience: ${lead.yearsOfExperience ?? "not specified (likely a student/fresher)"}`,
    `What they told us (intent, in their own words): "${lead.intent}"`,
    `Background (education, past companies, certifications, etc.): ${
      lead.background || "none provided"
    }`,
    "",
    "Structured CRM questionnaire answers (ground-truth facts, not guesses):",
    `- Where they spend most learning time: ${lead.learningFocus || "not answered"}`,
    `- Main career goal right now: ${lead.careerGoal || "not answered"}`,
    `- Dream role: ${lead.dreamRole || "not answered"}`,
    `- Target company type: ${lead.targetCompanyType || "not answered"}`,
    `- How AI shows up in their day-to-day work: ${lead.aiUsage || "not answered"}`,
    `- What they've actually shipped with AI: ${lead.aiShipped || "not answered"}`,
    `- Coding practice activity, last 3 months: ${lead.codingPracticeActivity || "not answered"}`,
    `- System design comfort: ${lead.systemDesignComfort || "not answered"}`,
    `- GitHub/GitLab activity: ${lead.githubActivity || "not answered"}`,
  ];
  if (steering && steering.trim()) {
    lines.push(
      "",
      `Additional steering from the BDA for this regeneration — weight this heavily: ${steering.trim()}`
    );
  }
  return lines.join("\n");
}

export async function generateCallBrief(
  lead: LeadProfile,
  steering?: string
): Promise<CallBriefContent> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in .env.");
  }
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(lead, steering) },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "";
  const jsonText = extractJson(raw);

  try {
    const parsed = JSON.parse(jsonText) as CallBriefContent;
    if (parsed.coursePitch?.courseName) {
      parsed.coursePitch.courseName = normalizeCourseName(parsed.coursePitch.courseName);
    }
    return parsed;
  } catch {
    throw new Error("Model didn't return valid JSON. Try regenerating.");
  }
}
