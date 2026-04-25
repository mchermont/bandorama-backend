import { Router, type IRouter } from "express";
import { sendWhatsapp } from "../controllers/whatsapp.controller";

const router: IRouter = Router();

router.post("/send-whatsapp", sendWhatsapp);

export default router;
