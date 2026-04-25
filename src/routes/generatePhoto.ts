import { Router, type IRouter } from "express";
import { generatePhoto } from "../controllers/photo.controller";

const router: IRouter = Router();

router.post("/generate-photo", generatePhoto);

export default router;
