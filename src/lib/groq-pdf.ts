import type { LeadProfile } from "@/types/lead";
import type { PdfBriefContent } from "@/types/pdf-brief";
import { SCALER_COURSE_NAMES, SCALER_PROGRAMS_CATALOG, normalizeCourseName } from "@/lib/scaler-programs";
import { extractJson } from "@/lib/json-extract";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildSystemPrompt(): string {
  return `You are a senior sales-enablement copywriter for Scaler, an ed-tech company. You write a personalised post-call follow-up document that gets sent to the LEAD (not the BDA) on WhatsApp as a PDF. This document's whole job is building enough trust that the lead actually takes Scaler's entrance test — it is NOT generic marketing.

You'll receive the lead's CRM profile (including structured questionnaire answers) and the full call transcript.

Below is Scaler's actual program catalog. This is the ONLY source of truth for course names, durations, curriculum, and outcomes — never invent a program or detail that isn't in it.

${SCALER_PROGRAMS_CATALOG}

Rules:
- Read the transcript and extract every distinct open question or objection the LEAD raised (not the BDA's lines) — usually 2-4 of them. Quote or closely paraphrase each one.
- Answer each question specifically, grounded in the catalog above (curriculum modules, portfolio project companies, program depth, specialisations). Never invent specific alumni salary figures, placement percentages, or any statistic not in the catalog. Where a claim would need a number you don't have, reason qualitatively instead — e.g. "engineers from service-company backgrounds like yours typically specialise in Backend Engineering + LLD to target product-company SDE roles" rather than a fabricated placement rate.
- ROI reasoning must be grounded in their CURRENT role/package from the profile, reasoned qualitatively about the skill gap being closed and how it repositions them — never invent a specific rupee salary-jump number.
- Frame everything through THIS lead's stated goals (career goal, dream role, target company type, intent) — not generic marketing copy about Scaler in general.
- Recommend exactly ONE course from the catalog. "courseName" must be copied EXACTLY, character-for-character, from this list: ${SCALER_COURSE_NAMES.map((n) => `"${n}"`).join(", ")}.
- Write a short WhatsApp covering message (2-3 sentences) to go out alongside the PDF attachment — warm, personal, references their name and one specific thing from the call. No corporate voice.
- Clearly separate fact (stated in the profile/CRM/transcript) from inference (your read on them) from missing (things that would sharpen this if you had them).
- Where genuinely uncertain, favor honest hedging over confident invention — a wrong claim about curriculum is worse than admitting a gap.

Length guidance (this becomes a 2-3 page PDF, not a text message — write in full sentences, not bullet fragments):
- headline: max 12 words.
- openingLine: max 30 words.
- questions: 2-4 items. question max 20 words. answer: 2-4 sentences, roughly 60-90 words, specific and evidenced.
- whyScalerForYou: one paragraph, roughly 70-100 words.
- roiReasoning: one paragraph, roughly 60-80 words.
- coursePitch.reason: max 30 words.
- coveringMessage: max 45 words.
- facts: max 3 items. inferred: max 3 items. missing: max 2 items. Each a short phrase.

Respond with ONLY a raw JSON object, no markdown code fences, no commentary before or after, matching exactly this shape:
{
  "headline": string,
  "openingLine": string,
  "questions": [{"question": string, "answer": string}],
  "whyScalerForYou": string,
  "roiReasoning": string,
  "coursePitch": {"courseName": string, "reason": string},
  "coveringMessage": string,
  "facts": string[],
  "inferred": string[],
  "missing": string[]
}
"questions" must have between 2 and 4 items — one per distinct open question actually raised in the transcript, not invented ones. "coursePitch.courseName" must be one of the exact catalog names listed above.`;
}

function buildUserPrompt(lead: LeadProfile, transcript: string, steering?: string): string {
  const lines = [
    `Lead name: ${lead.name}`,
    `Current role/status: ${lead.currentRole}`,
    `Years of experience: ${lead.yearsOfExperience ?? "not specified (likely a student/fresher)"}`,
    `What they told us before the call (intent, in their own words): "${lead.intent}"`,
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
    "",
    "Full call transcript:",
    transcript,
  ];
  if (steering && steering.trim()) {
    lines.push(
      "",
      `Additional steering from the BDA for this regeneration — weight this heavily: ${steering.trim()}`
    );
  }
  return lines.join("\n");
}

export async function generatePdfBrief(
  lead: LeadProfile,
  transcript: string,
  steering?: string
): Promise<PdfBriefContent> {
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
        { role: "user", content: buildUserPrompt(lead, transcript, steering) },
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
    const parsed = JSON.parse(jsonText) as PdfBriefContent;
    if (parsed.coursePitch?.courseName) {
      parsed.coursePitch.courseName = normalizeCourseName(parsed.coursePitch.courseName);
    }
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("no questions extracted");
    }
    return parsed;
  } catch {
    throw new Error("Model didn't return valid JSON. Try regenerating.");
  }
}
