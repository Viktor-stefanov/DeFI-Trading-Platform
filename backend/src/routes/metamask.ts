import { Router } from "express";
import { getNonceHandler, verifyHandler } from "../controllers/metamask";

const router = Router();

router.get("/nonce", getNonceHandler);
router.post("/verify", verifyHandler);

export default router;
