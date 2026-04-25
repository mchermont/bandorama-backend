import sharp from "sharp";

export type AspectKey = "1x1" | "9x16" | "10x15";

export interface ProcessedVariant {
  key: AspectKey;
  buffer: Buffer;
  width: number;
  height: number;
  contentType: "image/jpeg";
  extension: "jpg";
}

interface AspectSpec {
  width: number;
  height: number;
}

const ASPECT_SPECS: Record<AspectKey, AspectSpec> = {
  // Square 1:1 - 1080x1080
  "1x1": { width: 1080, height: 1080 },
  // Vertical 9:16 - 1080x1920
  "9x16": { width: 1080, height: 1920 },
  // Print 10x15cm at 300 DPI - 1181x1772 (portrait)
  "10x15": { width: 1181, height: 1772 },
};

export async function processVariant(
  source: Buffer,
  key: AspectKey,
): Promise<ProcessedVariant> {
  const spec = ASPECT_SPECS[key];
  const buffer = await sharp(source)
    .rotate()
    .resize(spec.width, spec.height, {
      fit: "cover",
      position: "attention",
    })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return {
    key,
    buffer,
    width: spec.width,
    height: spec.height,
    contentType: "image/jpeg",
    extension: "jpg",
  };
}

export async function processAllVariants(
  source: Buffer,
): Promise<ProcessedVariant[]> {
  const keys: AspectKey[] = ["1x1", "9x16", "10x15"];
  return Promise.all(keys.map((key) => processVariant(source, key)));
}
