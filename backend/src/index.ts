import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/metamask";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Mount auth router under /api/auth for a clear API namespace
// Examples: GET /api/auth/nonce  and POST /api/auth/verify
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
