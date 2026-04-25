import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import generatePhotoRouter from "./generatePhoto";
import sendWhatsappRouter from "./sendWhatsapp";
import testImageRouter from "./testImage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generatePhotoRouter);
router.use(sendWhatsappRouter);
router.use(testImageRouter);

router.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ err }, "Unhandled route error");
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

export default router;
