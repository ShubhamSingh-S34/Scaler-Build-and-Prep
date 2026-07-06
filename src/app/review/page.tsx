import { cookies } from "next/headers";
import Link from "next/link";
import { LEAD_PROFILE_COOKIE, type LeadProfile } from "@/types/lead";
import { CALL_INPUT_MODE_COOKIE } from "@/lib/constants";
import ReviewDesk from "@/components/review-desk";

function safeParse(raw: string): LeadProfile | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function ReviewPage() {
  const cookieStore = await cookies();
  const leadRaw = cookieStore.get(LEAD_PROFILE_COOKIE)?.value;
  const lead = leadRaw ? safeParse(leadRaw) : null;
  const callInputMode = cookieStore.get(CALL_INPUT_MODE_COOKIE)?.value;

  if (!lead) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
        <div className="w-full max-w-md space-y-4 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No lead found yet.</p>
          <Link
            href="/leads/new"
            className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Go to Lead Intake
          </Link>
        </div>
      </main>
    );
  }

  if (callInputMode !== "structured" && callInputMode !== "audio") {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
        <div className="w-full max-w-md space-y-4 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No call input saved for <span className="font-medium">{lead.name}</span> yet.
          </p>
          <Link
            href="/call-input"
            className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Go to Call Input
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <div className="w-full max-w-xl space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Scaler Sales Copilot
          </p>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Review Desk</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Post-call PDF for <span className="font-medium">{lead.name}</span>, built from the{" "}
            {callInputMode === "audio" ? "call recording" : "transcript"}. This goes to the lead —
            review before it sends.
          </p>
        </div>

        <ReviewDesk />
      </div>
    </main>
  );
}
