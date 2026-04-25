import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { generateImage } from "../services/gemini.service";
import { uploadImage } from "../services/firebase.service";

const router: IRouter = Router();

const TEST_PROMPT = "a cinematic portrait of a superhero, ultra realistic";

router.get("/test-image", async (req, res): Promise<void> => {
  req.log.info({ prompt: TEST_PROMPT }, "test-image: generating");

  const image = await generateImage(TEST_PROMPT);
  const extension = image.mimeType.includes("jpeg") ? "jpg" : "png";
  const destination = `test-images/${randomUUID()}.${extension}`;

  const upload = await uploadImage({
    buffer: image.buffer,
    contentType: image.mimeType,
    destination,
  });

  req.log.info({ destination }, "test-image: uploaded");

  res.status(200).json({ imageUrl: upload.publicUrl });
});

export default router;
