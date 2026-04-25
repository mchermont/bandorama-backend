import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { generateImage } from "../services/gemini.service";
import { processAllVariants } from "../services/image.service";
import { savePhotoRecord, uploadImage } from "../services/firebase.service";

interface GeneratePhotoBody {
  prompt?: unknown;
}

export async function generatePhoto(
  req: Request,
  res: Response,
): Promise<void> {
  const body = (req.body ?? {}) as GeneratePhotoBody;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (prompt.length === 0) {
    res.status(400).json({ error: "`prompt` is required and must be a non-empty string" });
    return;
  }

  req.log.info({ prompt }, "Generating photo");

  const generated = await generateImage(prompt);
  const variants = await processAllVariants(generated.buffer);

  const photoId = randomUUID();
  const uploadedEntries = await Promise.all(
    variants.map(async (variant) => {
      const destination = `photos/${photoId}/${variant.key}.${variant.extension}`;
      const upload = await uploadImage({
        buffer: variant.buffer,
        contentType: variant.contentType,
        destination,
      });
      return [
        variant.key,
        {
          destination: upload.destination,
          url: upload.publicUrl,
          width: variant.width,
          height: variant.height,
        },
      ] as const;
    }),
  );

  const variantMap = Object.fromEntries(uploadedEntries);

  const record = await savePhotoRecord({
    prompt,
    variants: Object.fromEntries(
      Object.entries(variantMap).map(([k, v]) => [
        k,
        { destination: v.destination, url: v.url },
      ]),
    ),
  });

  req.log.info({ photoId: record.id }, "Photo generated and stored");

  res.status(201).json({
    id: record.id,
    prompt: record.prompt,
    variants: variantMap,
  });
}
