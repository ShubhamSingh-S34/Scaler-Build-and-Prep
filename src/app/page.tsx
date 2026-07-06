import ConnectForm from "@/components/connect-form";

export default function ConnectPage() {
  const sandboxNumber =
    process.env.TWILIO_WHATSAPP_FROM?.replace("whatsapp:", "") ||
    "your Twilio sandbox number";
  const joinCode =
    process.env.TWILIO_SANDBOX_JOIN_CODE || "the join code from your Twilio console";

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Scaler Sales Copilot
          </p>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Connect WhatsApp
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Every pre-call brief and post-call PDF in this demo lands on one number. Connect
            it once here.
          </p>
        </div>

        <ConnectForm sandboxNumber={sandboxNumber} joinCode={joinCode} />
      </div>
    </main>
  );
}
