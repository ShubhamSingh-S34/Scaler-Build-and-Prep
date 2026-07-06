"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import McqField from "@/components/mcq-field";
import {
  LEARNING_FOCUS_OPTIONS,
  CAREER_GOAL_OPTIONS,
  DREAM_ROLE_OPTIONS,
  TARGET_COMPANY_OPTIONS,
  AI_USAGE_OPTIONS,
  AI_SHIPPED_OPTIONS,
  CODING_PRACTICE_OPTIONS,
  SYSTEM_DESIGN_OPTIONS,
  GITHUB_ACTIVITY_OPTIONS,
} from "@/types/lead";

type Status = "idle" | "saving" | "generating" | "sending" | "sent" | "error";
type FailedStage = "leads" | "brief" | "send" | null;

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "block text-sm text-zinc-600 dark:text-zinc-400";

const STATUS_LABEL: Record<Status, string> = {
  idle: "Save lead & send brief",
  saving: "Saving lead…",
  generating: "Generating brief…",
  sending: "Sending to WhatsApp…",
  sent: "Sent ✓",
  error: "Save lead & send brief",
};

export default function LeadIntakeForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [intent, setIntent] = useState("");
  const [background, setBackground] = useState("");

  const [learningFocus, setLearningFocus] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [dreamRole, setDreamRole] = useState("");
  const [targetCompanyType, setTargetCompanyType] = useState("");
  const [aiUsage, setAiUsage] = useState("");
  const [aiShipped, setAiShipped] = useState("");
  const [codingPracticeActivity, setCodingPracticeActivity] = useState("");
  const [systemDesignComfort, setSystemDesignComfort] = useState("");
  const [githubActivity, setGithubActivity] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [failedStage, setFailedStage] = useState<FailedStage>(null);
  const [error, setError] = useState("");
  const [briefMessage, setBriefMessage] = useState("");

  function leadPayload() {
    return {
      name,
      phone,
      currentRole,
      yearsOfExperience: yearsOfExperience === "" ? null : yearsOfExperience,
      intent,
      background,
      learningFocus,
      careerGoal,
      dreamRole,
      targetCompanyType,
      aiUsage,
      aiShipped,
      codingPracticeActivity,
      systemDesignComfort,
      githubActivity,
    };
  }

  async function sendBrief(message: string) {
    setStatus("sending");
    try {
      const res = await fetch("/api/brief/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setFailedStage("send");
        setError(data.error || "Something went wrong sending the brief.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setFailedStage("send");
      setError("Couldn't reach the server while sending the brief.");
    }
  }

  async function runPipeline() {
    setError("");
    setFailedStage(null);
    setStatus("saving");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setFailedStage("leads");
        setError(data.error || "Something went wrong saving the lead.");
        return;
      }
    } catch {
      setStatus("error");
      setFailedStage("leads");
      setError("Couldn't reach the server. Check your connection and try again.");
      return;
    }

    setStatus("generating");
    let message = "";
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steering: "" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setFailedStage("brief");
        setError(data.error || "Something went wrong generating the brief.");
        return;
      }
      message = data.message as string;
      setBriefMessage(message);
    } catch {
      setStatus("error");
      setFailedStage("brief");
      setError("Couldn't reach the server while generating the brief.");
      return;
    }

    await sendBrief(message);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runPipeline();
  }

  function handleRetry() {
    if (failedStage === "send") {
      sendBrief(briefMessage);
    } else {
      runPipeline();
    }
  }

  const isBusy = status === "saving" || status === "generating" || status === "sending";

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="name">
            Lead name
          </label>
          <input
            id="name"
            required
            placeholder="Rohan Sharma"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass} htmlFor="phone">
            Lead&apos;s WhatsApp number
          </label>
          <input
            id="phone"
            required
            placeholder="+919876543210"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            International format, incl. country code. This is where the final PDF gets sent —
            not the BDA/evaluator number.
          </p>
        </div>

        <div className="space-y-1">
          <label className={labelClass} htmlFor="currentRole">
            Current role / status
          </label>
          <input
            id="currentRole"
            required
            placeholder="Software Engineer, TCS"
            value={currentRole}
            onChange={(event) => setCurrentRole(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass} htmlFor="yearsOfExperience">
            Years of experience
          </label>
          <input
            id="yearsOfExperience"
            type="number"
            min={0}
            step={1}
            placeholder="4 (leave blank if a student / unknown)"
            value={yearsOfExperience}
            onChange={(event) => setYearsOfExperience(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass} htmlFor="intent">
            Intent — what they told us, in their own words
          </label>
          <textarea
            id="intent"
            required
            rows={3}
            placeholder='"Want to switch to a product company, tired of service work, interested in AI engineering roles."'
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass} htmlFor="background">
            Background (education, past companies, certifications, LinkedIn-style facts)
          </label>
          <textarea
            id="background"
            rows={3}
            placeholder="B.Tech CSE, VIT Vellore '20. SDE-2 at TCS for 4 years (banking clients: HDFC, Citi). Recent AWS Solutions Architect cert. Leave blank if none provided."
            value={background}
            onChange={(event) => setBackground(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
            From the CRM onboarding questionnaire (optional — leave unanswered if unknown)
          </p>

          <div className="space-y-5">
            <McqField
              id="learningFocus"
              question="Where are you currently investing most of your learning time?"
              options={LEARNING_FOCUS_OPTIONS}
              value={learningFocus}
              onChange={setLearningFocus}
            />
            <McqField
              id="careerGoal"
              question="What's your main career goal right now?"
              options={CAREER_GOAL_OPTIONS}
              value={careerGoal}
              onChange={setCareerGoal}
            />
            <McqField
              id="dreamRole"
              question="What's your dream role?"
              options={DREAM_ROLE_OPTIONS}
              value={dreamRole}
              onChange={setDreamRole}
            />
            <McqField
              id="targetCompanyType"
              question="What kind of company are you targeting?"
              options={TARGET_COMPANY_OPTIONS}
              value={targetCompanyType}
              onChange={setTargetCompanyType}
            />
            <McqField
              id="aiUsage"
              question="How does AI show up in your day-to-day work?"
              options={AI_USAGE_OPTIONS}
              value={aiUsage}
              onChange={setAiUsage}
            />
            <McqField
              id="aiShipped"
              question="What have you actually built or shipped using AI?"
              options={AI_SHIPPED_OPTIONS}
              value={aiShipped}
              onChange={setAiShipped}
            />
            <McqField
              id="codingPracticeActivity"
              question="How much have you been practicing coding problems recently?"
              description="Last 3 months, platforms like LeetCode or HackerRank"
              options={CODING_PRACTICE_OPTIONS}
              value={codingPracticeActivity}
              onChange={setCodingPracticeActivity}
            />
            <McqField
              id="systemDesignComfort"
              question="How comfortable are you with system design?"
              options={SYSTEM_DESIGN_OPTIONS}
              value={systemDesignComfort}
              onChange={setSystemDesignComfort}
            />
            <McqField
              id="githubActivity"
              question="How active is your GitHub / GitLab profile?"
              description="Projects show practical experience to recruiters"
              options={GITHUB_ACTIVITY_OPTIONS}
              value={githubActivity}
              onChange={setGithubActivity}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isBusy || status === "sent"}
          className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {STATUS_LABEL[status]}
        </button>
      </form>

      {status === "sent" && (
        <div className="space-y-2">
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Brief sent to the BDA&apos;s WhatsApp — no approval needed, this one&apos;s internal.
          </p>
          <details className="rounded-md border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="cursor-pointer px-3 py-2 text-zinc-600 dark:text-zinc-400">
              View what was sent
            </summary>
            <pre className="whitespace-pre-wrap px-3 pb-3 font-sans text-sm text-zinc-800 dark:text-zinc-200">
              {briefMessage}
            </pre>
          </details>
          <Link
            href="/call-input"
            className="block w-full rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Call happened → Continue to Call Input
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {failedStage === "send" ? "Retry sending" : "Retry"}
          </button>
        </div>
      )}
    </div>
  );
}
