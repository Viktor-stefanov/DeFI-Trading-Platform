import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/metamask";
import credentialsRouter from "./routes/credentials";
import cookieParser from "cookie-parser";
import logger from "./utils/logger";

dotenv.config();

const app = express();

// Simple request logger (timestamp, method, path, ip) to help trace auth flows.
app.use((req, res, next) => {
  logger.debug(`[req] ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Allow only the frontend origin and enable credentials so cookies are sent.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/auth", credentialsRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
