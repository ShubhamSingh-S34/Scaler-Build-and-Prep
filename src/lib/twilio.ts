import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local."
    );
  }
  return twilio(accountSid, authToken);
}

function toWhatsAppAddress(rawNumber: string) {
  const trimmed = rawNumber.trim();
  return trimmed.startsWith("whatsapp:") ? trimmed : `whatsapp:${trimmed}`;
}

export async function sendWhatsAppMessage(toNumber: string, body: string) {
  if (!fromWhatsApp) {
    throw new Error("TWILIO_WHATSAPP_FROM is not set in .env.local.");
  }
  const client = getTwilioClient();
  return client.messages.create({
    from: toWhatsAppAddress(fromWhatsApp),
    to: toWhatsAppAddress(toNumber),
    body,
  });
}

// mediaUrl must be a publicly reachable URL — Twilio's servers fetch it directly.
// This will fail with a fetch/media error on localhost; it only works once deployed
// (or tunnelled with something like ngrok).
export async function sendWhatsAppMedia(toNumber: string, body: string, mediaUrl: string) {
  if (!fromWhatsApp) {
    throw new Error("TWILIO_WHATSAPP_FROM is not set in .env.local.");
  }
  const client = getTwilioClient();
  return client.messages.create({
    from: toWhatsAppAddress(fromWhatsApp),
    to: toWhatsAppAddress(toNumber),
    body,
    mediaUrl: [mediaUrl],
  });
}
