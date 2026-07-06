import LeadIntakeForm from "@/components/lead-intake-form";

export default function LeadIntakePage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Scaler Sales Copilot
          </p>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Lead Intake
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The same details a BDA would pull from the CRM before a call. This feeds both the
            pre-call brief and the post-call PDF.
          </p>
        </div>

        <LeadIntakeForm />
      </div>
    </main>
  );
}
