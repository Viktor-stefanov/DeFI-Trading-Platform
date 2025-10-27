import { Router } from "express";
import { getNonceHandler, verifyHandler } from "../controllers/authController";

const router = Router();

// MetaMask authentication
router.get("/nonce", getNonceHandler);
router.post("/verify", verifyHandler);

// credential-based authentication

export default router;
