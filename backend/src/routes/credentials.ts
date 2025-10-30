import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  meHandler,
} from "../controllers/credentials";

const router: Router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/me", meHandler);

export default router;
