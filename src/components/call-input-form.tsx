"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";

type Mode = "structured" | "audio";
type Status = "idle" | "saving" | "saved" | "error";

const tabBase = "flex-1 rounded-md px-3 py-2 text-sm font-medium transition";
const tabActive = "bg-emerald-600 text-white";
const tabInactive =
  "bg-white text-zinc-600 border border-zinc-300 hover:border-emerald-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700";

export default function CallInputForm() {
  const [mode, setMode] = useState<Mode>("structured");
  const [transcript, setTranscript] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setStatus("idle");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "structured" && !transcript.trim()) {
      setError("Paste the call transcript first.");
      setStatus("error");
      return;
    }
    if (mode === "audio" && !audioFile) {
      setError("Choose an audio file first.");
      setStatus("error");
      return;
    }

    setStatus("saving");
    const formData = new FormData();
    formData.set("mode", mode);
    if (mode === "structured") {
      formData.set("transcript", transcript.trim());
    } else if (audioFile) {
      formData.set("audio", audioFile);
    }

    try {
      const res = await fetch("/api/call-input", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong.");
        return;
      }
      setStatus("saved");
    } catch {
      setStatus("error");
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchMode("structured")}
          className={`${tabBase} ${mode === "structured" ? tabActive : tabInactive}`}
        >
          Structured (transcript)
        </button>
        <button
          type="button"
          onClick={() => switchMode("audio")}
          className={`${tabBase} ${mode === "audio" ? tabActive : tabInactive}`}
        >
          Audio (recording)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "structured" ? (
          <div className="space-y-1">
            <label
              className="block text-sm text-zinc-600 dark:text-zinc-400"
              htmlFor="transcript"
            >
              Call transcript
            </label>
            <textarea
              id="transcript"
              rows={10}
              placeholder="BDA: Rohan, what's bringing you to Scaler? Rohan: I've been at TCS for 4 years..."
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="block text-sm text-zinc-600 dark:text-zinc-400" htmlFor="audio">
              Call recording
            </label>
            <input
              id="audio"
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Any common audio format, up to 20MB. A mocked recording is fine for demo purposes.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save call input"}
        </button>
      </form>

      {status === "saved" && (
        <div className="space-y-2">
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Saved as {mode === "structured" ? "a transcript" : "a recording"}.
          </p>
          <Link
            href="/review"
            className="block w-full rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Continue to Review Desk
          </Link>
        </div>
      )}
      {status === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
