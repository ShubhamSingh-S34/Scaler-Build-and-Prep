import { readFile } from "fs/promises";

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// Reuses the same GROQ_API_KEY already configured for text generation — Groq hosts
// Whisper too, so this needs no extra credential from the user.
export async function transcribeAudioFile(filePath: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in .env.");
  }

  const buffer = await readFile(filePath);
  const model = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";

  const formData = new FormData();
  formData.set("file", new Blob([buffer]), "recording");
  formData.set("model", model);
  formData.set("response_format", "text");

  const res = await fetch(GROQ_TRANSCRIBE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq transcription failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const transcript = await res.text();
  if (!transcript.trim()) {
    throw new Error("Transcription came back empty — the recording may be silent or unreadable.");
  }
  return transcript.trim();
}
