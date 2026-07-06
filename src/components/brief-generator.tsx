"use client";

import { useState } from "react";

type Status = "idle" | "generating" | "ready" | "sending" | "sent" | "error";

export default function BriefGenerator() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [steering, setSteering] = useState("");

  async function generate() {
    setStatus("generating");
    setError("");
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steering }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong.");
        return;
      }
      setMessage(data.message);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("Couldn't reach the server. Try again.");
    }
  }

  async function send() {
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/brief/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Couldn't reach the server. Try again.");
    }
  }

  const isBusy = status === "generating" || status === "sending";

  return (
    <div className="space-y-5">
      <button
        onClick={generate}
        disabled={isBusy}
        className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {status === "generating" ? "Generating…" : message ? "Regenerate brief" : "Generate brief"}
      </button>

      {message && (
        <>
          <div className="space-y-1">
            <label
              className="block text-sm text-zinc-600 dark:text-zinc-400"
              htmlFor="steering"
            >
              Steer the regenerate (optional)
            </label>
            <input
              id="steering"
              placeholder="e.g. lean harder into the salary math angle"
              value={steering}
              onChange={(event) => setSteering(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <pre className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-4 font-sans text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {message}
          </pre>

          <button
            onClick={send}
            disabled={isBusy}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {status === "sending" ? "Sending…" : "Send to BDA's WhatsApp"}
          </button>
        </>
      )}

      {status === "sent" && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          Sent. Check WhatsApp.
        </p>
      )}
      {status === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
