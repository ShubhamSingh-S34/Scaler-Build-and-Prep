# Scaler Sales Copilot

## 1. What you built

I built an AI copilot for Scaler BDAs that runs entirely on WhatsApp. Before a call, a BDA enters a lead's CRM profile — including a short questionnaire on career goals, technical activity, and AI usage — and the app generates and sends a short, honest pre-call brief straight to the BDA's own WhatsApp: a plain-English read on who the lead is, a likely persona, resonant angles, expected objections, an opening hook, and a recommended Scaler course, all tagged fact vs. inferred vs. missing. No approval gate here since it's internal. After the call, the BDA feeds in either a pasted transcript or an audio recording (transcribed via Whisper on Groq); the app extracts the lead's actual open questions, answers each one with evidence grounded in a real Scaler program catalog (never fabricated stats or outcomes), builds a branded 2–3 page PDF whose accent color and content visibly differ lead-to-lead based on which course fits them, and puts it in front of the BDA for Approve / Edit / Skip before anything reaches the lead's own WhatsApp.

## 2. One failure I found

Meera's profile (0 YoE, no LinkedIn, most CRM fields blank) has almost no signal, yet the PDF's course-pitch still names one program with full confidence — there's no hedge field on that output, unlike the nudge's fact/inferred/missing split. Thin input yields a confident guess, not an honest "need more info."

## 3. Scale plan

Two things break first. First, state: leads and call inputs live in cookies and local temp files (no database, no object storage), built for one BDA testing one lead at a time — zero multi-tenancy, and temp files won't survive across serverless instances at any real concurrency. Second, WhatsApp Sandbox requires each recipient to manually text a join code before receiving anything — fine for a demo, but it cannot onboard real leads at volume. Production needs a real datastore plus an approved WhatsApp Business API sender, not incremental fixes to what exists today.
