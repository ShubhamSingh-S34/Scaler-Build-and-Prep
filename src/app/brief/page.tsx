import { redirect } from "next/navigation";

// Retired as a standalone screen: the brief is now generated and sent automatically
// the moment Lead Intake is saved (see lead-intake-form.tsx), so there's no separate
// review step for the BDA-facing nudge — matches the brief's "no approval gate here"
// requirement. This route just bounces anyone who lands here back to Lead Intake.
export default function CallBriefPage() {
  redirect("/leads/new");
}
