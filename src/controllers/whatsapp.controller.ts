import type { Request, Response } from "express";
import { sendWhatsappMessage } from "../services/twilio.service";
import { getPhotoRecord } from "../services/firebase.service";
import type { AspectKey } from "../services/image.service";

interface SendWhatsappBody {
  to?: unknown;
  mediaUrl?: unknown;
  body?: unknown;
  photoId?: unknown;
  variant?: unknown;
}

const VALID_VARIANTS: ReadonlySet<AspectKey> = new Set([
  "1x1",
  "9x16",
  "10x15",
]);

export async function sendWhatsapp(
  req: Request,
  res: Response,
): Promise<void> {
  const body = (req.body ?? {}) as SendWhatsappBody;

  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (to.length === 0) {
    res.status(400).json({ error: "`to` is required and must be a phone number string" });
    return;
  }

  let mediaUrl: string | undefined;
  if (typeof body.mediaUrl === "string" && body.mediaUrl.trim() !== "") {
    mediaUrl = body.mediaUrl.trim();
  } else if (typeof body.photoId === "string" && body.photoId.trim() !== "") {
    const photoId = body.photoId.trim();
    const variantKey =
      typeof body.variant === "string" && VALID_VARIANTS.has(body.variant as AspectKey)
        ? (body.variant as AspectKey)
        : ("1x1" as AspectKey);

    const record = await getPhotoRecord(photoId);
    if (!record) {
      res.status(404).json({ error: `Photo not found: ${photoId}` });
      return;
    }
    const variant = record.variants?.[variantKey];
    if (!variant?.url) {
      res.status(404).json({
        error: `Variant "${variantKey}" not found for photo ${photoId}`,
      });
      return;
    }
    mediaUrl = variant.url;
  }

  const messageBody =
    typeof body.body === "string" ? body.body : undefined;

  if (!mediaUrl && (!messageBody || messageBody.trim() === "")) {
    res.status(400).json({
      error: "Provide either `mediaUrl`, `photoId`, or a non-empty `body`",
    });
    return;
  }

  req.log.info({ to, hasMedia: Boolean(mediaUrl) }, "Sending WhatsApp message");

  const result = await sendWhatsappMessage({
    to,
    mediaUrl,
    body: messageBody,
  });

  res.status(200).json(result);
}
