import twilio, { type Twilio } from "twilio";
import { env } from "../config/env";

let client: Twilio | null = null;

function getClient(): Twilio {
  if (!client) {
    client = twilio(env.twilio.accountSid, env.twilio.authToken);
  }
  return client;
}

function normalizeWhatsappAddress(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  return `whatsapp:${trimmed}`;
}

export interface SendWhatsappInput {
  to: string;
  mediaUrl?: string;
  body?: string;
}

export interface SendWhatsappResult {
  sid: string;
  status: string;
  to: string;
  from: string;
}

export async function sendWhatsappMessage({
  to,
  mediaUrl,
  body,
}: SendWhatsappInput): Promise<SendWhatsappResult> {
  const client = getClient();
  const from = normalizeWhatsappAddress(env.twilio.whatsappFrom);
  const recipient = normalizeWhatsappAddress(to);

  const message = await client.messages.create({
    from,
    to: recipient,
    body: body ?? "",
    ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
  });

  return {
    sid: message.sid,
    status: message.status,
    to: recipient,
    from,
  };
}
