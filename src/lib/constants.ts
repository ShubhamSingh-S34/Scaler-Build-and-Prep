export const EVALUATOR_PHONE_COOKIE = "evaluator_whatsapp";

// WhatsApp numbers must be in international format, e.g. +919876543210
export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

// Call Input (post-call: structured transcript or audio recording)
export const CALL_INPUT_MODE_COOKIE = "call_input_mode"; // "structured" | "audio"
export const CALL_TRANSCRIPT_PATH_COOKIE = "call_transcript_path";
export const CALL_AUDIO_PATH_COOKIE = "call_audio_path";
export const CALL_INPUT_FILENAME_COOKIE = "call_input_filename"; // original filename, for display only

// Post-call PDF (Review Desk)
export const PDF_DIR_NAME = "scaler-sales-copilot-pdfs"; // under os.tmpdir()
