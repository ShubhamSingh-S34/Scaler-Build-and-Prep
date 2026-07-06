"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Props = {
  sandboxNumber: string;
  joinCode: string;
};

type Status = "idle" | "loading" | "success" | "error";

export default function ConnectForm({ sandboxNumber, joinCode }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong.");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        router.push("/leads/new");
      }, 1200);
    } catch {
      setStatus("error");
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <div className="space-y-6">
      <ol className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <li>1. Open WhatsApp on your phone.</li>
        <li>
          2. Send{" "}
          <span className="font-mono text-emerald-600 dark:text-emerald-400">{joinCode}</span>{" "}
          to{" "}
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            {sandboxNumber}
          </span>
          .
        </li>
        <li>3. Enter your number below — we&apos;ll send a test message to confirm.</li>
      </ol>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          className="block text-sm text-zinc-600 dark:text-zinc-400"
          htmlFor="phone"
        >
          Your WhatsApp number (with country code)
        </label>
        <input
          id="phone"
          type="tel"
          required
          placeholder="+919876543210"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {status === "loading" ? "Connecting…" : "Connect & send test message"}
        </button>
      </form>

      {status === "success" && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          Connected. Check WhatsApp on {phone} — taking you to Lead Intake…
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
