"use client";

import { useState } from "react";
import type { PdfBriefContent } from "@/types/pdf-brief";

type Status = "idle" | "generating" | "ready" | "sending" | "sent" | "skipped" | "error";

export default function ReviewDesk() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [steering, setSteering] = useState("");
  const [content, setContent] = useState<PdfBriefContent | null>(null);
  const [pdfId, setPdfId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [coveringMessage, setCoveringMessage] = useState("");

  async function generate() {
    setStatus("generating");
    setError("");
    try {
      const res = await fetch("/api/review", {
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
      setContent(data.content);
      setPdfId(data.pdfId);
      setTranscript(data.transcript || "");
      setCoveringMessage(data.content.coveringMessage);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("Couldn't reach the server. Try again.");
    }
  }

  async function approveAndSend() {
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/review/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfId, coveringMessage }),
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

  function skip() {
    setStatus("skipped");
  }

  const isBusy = status === "generating" || status === "sending";

  return (
    <div className="space-y-5">
      <button
        onClick={generate}
        disabled={isBusy}
        className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {status === "generating"
          ? "Analysing call & generating PDF…"
          : content
          ? "Regenerate PDF"
          : "Generate PDF"}
      </button>

      {content && (
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
              placeholder="e.g. lean harder into the ROI angle, he's price-sensitive"
              value={steering}
              onChange={(event) => setSteering(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <details className="rounded-md border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="cursor-pointer px-3 py-2 text-zinc-600 dark:text-zinc-400">
              What we heard — {content.questions.length} open question
              {content.questions.length === 1 ? "" : "s"} extracted
            </summary>
            <div className="space-y-3 px-3 pb-3">
              {content.questions.map((q, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {i + 1}. {q.question}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{q.answer}</p>
                </div>
              ))}
            </div>
          </details>

          <details className="rounded-md border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="cursor-pointer px-3 py-2 text-zinc-600 dark:text-zinc-400">
              View transcript used
            </summary>
            <pre className="whitespace-pre-wrap px-3 pb-3 font-sans text-xs text-zinc-600 dark:text-zinc-400">
              {transcript}
            </pre>
          </details>

          <div className="space-y-1">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">PDF preview</p>
            <iframe
              src={`/api/pdf/${pdfId}`}
              className="h-[500px] w-full rounded-md border border-zinc-300 dark:border-zinc-700"
              title="Post-call PDF preview"
            />
          </div>

          <div className="space-y-1">
            <label
              className="block text-sm text-zinc-600 dark:text-zinc-400"
              htmlFor="coveringMessage"
            >
              Covering WhatsApp message (editable)
            </label>
            <textarea
              id="coveringMessage"
              rows={3}
              value={coveringMessage}
              onChange={(event) => setCoveringMessage(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={approveAndSend}
              disabled={isBusy}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Approve & Send"}
            </button>
            <button
              onClick={skip}
              disabled={isBusy}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-red-300 hover:text-red-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Skip
            </button>
          </div>
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
            Edit = tweak the message above or steer a regenerate. Nothing sends to the lead
            without Approve.
          </p>
        </>
      )}

      {status === "sent" && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          Sent — the PDF and covering message landed on the lead&apos;s WhatsApp.
        </p>
      )}
      {status === "skipped" && (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Skipped — nothing was sent to the lead.
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
