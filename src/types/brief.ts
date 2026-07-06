import type { LeadProfile } from "./lead";

export type CallBriefContent = {
  whoTheyAre: string;
  personaLabel: string;
  personaWhy: string;
  angles: { title: string; detail: string }[];
  objections: { objection: string; handle: string }[];
  openingHook: string;
  facts: string[];
  inferred: string[];
  missing: string[];
  coursePitch: {
    courseName: string;
    reason: string;
  };
};

// WhatsApp/Twilio hard-caps a single message body at 1600 characters. Keep a safety
// margin under that no matter how verbose the model gets.
const WHATSAPP_CHAR_LIMIT = 1500;

export function composeBriefMessage(lead: LeadProfile, brief: CallBriefContent): string {
  const angleLines = brief.angles
    .map((angle, i) => `${i + 1}. ${angle.title} — ${angle.detail}`)
    .join("\n");

  const objectionLines = brief.objections
    .map((o) => `• "${o.objection}" → ${o.handle}`)
    .join("\n");

  const factsLine = brief.facts.length ? brief.facts.join("; ") : "—";
  const inferredLine = brief.inferred.length ? brief.inferred.join("; ") : "—";
  const missingLine = brief.missing.length ? brief.missing.join("; ") : "—";

  const sections = {
    header: `Quick brief before you call ${lead.name} 👋`,
    who: `*Who they are:* ${brief.whoTheyAre}`,
    persona: `*Likely persona:* ${brief.personaLabel} — ${brief.personaWhy}`,
    angles: `*Angles that'll land:*\n${angleLines}`,
    objections: `*Expect these objections:*\n${objectionLines}`,
    coursePitch: `*COURSE TO PITCH: ${brief.coursePitch.courseName.toUpperCase()}*\n${
      brief.coursePitch.reason
    }`,
    hook: `*Opening hook:* "${brief.openingHook}"`,
    facts: `✅ Know for sure: ${factsLine}`,
    inferred: `🤔 Inferring: ${inferredLine}`,
    missing: `❓ Missing: ${missingLine}`,
  };

  // Drop the least essential lines first (in this order) if we're still over the
  // limit after the prompt's own word caps — this should rarely trigger in practice.
  const dropOrder: (keyof typeof sections)[] = ["missing", "inferred", "facts"];
  const included = new Set(Object.keys(sections) as (keyof typeof sections)[]);

  function render(): string {
    const parts: string[] = [sections.header, "", sections.who, "", sections.persona, ""];
    parts.push(
      sections.angles,
      "",
      sections.objections,
      "",
      sections.coursePitch,
      "",
      sections.hook
    );
    const ledger = (["facts", "inferred", "missing"] as const).filter((k) => included.has(k));
    if (ledger.length) {
      parts.push("", "—", ...ledger.map((k) => sections[k]));
    }
    return parts.join("\n");
  }

  let message = render();
  for (const key of dropOrder) {
    if (message.length <= WHATSAPP_CHAR_LIMIT) break;
    included.delete(key);
    message = render();
  }

  if (message.length > WHATSAPP_CHAR_LIMIT) {
    message = `${message.slice(0, WHATSAPP_CHAR_LIMIT - 1).trimEnd()}…`;
  }

  return message;
}
