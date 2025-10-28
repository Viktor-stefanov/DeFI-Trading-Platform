import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/metamask";
import credentialsRouter from "./routes/credentials";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/credentials", credentialsRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
