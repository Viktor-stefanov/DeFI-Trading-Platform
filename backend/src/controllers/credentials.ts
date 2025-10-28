import { Router, type Request, type Response } from "express";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  res.json({ message: "User registered" });
});

export default router;
