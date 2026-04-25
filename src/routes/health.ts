import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ai-photo-booth-api",
    timestamp: new Date().toISOString(),
  });
});

export default router;
