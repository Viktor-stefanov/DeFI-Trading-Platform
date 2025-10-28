import { Request, Response } from "express";
import {
  createUserWithPassword,
  verifyCredentials,
  findUserByEmail,
} from "../services/credentialsService";
import { signJwt } from "../utils/jwt";

/**
 * Register a new user with email, password and full name.
 * - Validates input
 * - Ensures email is not already registered
 * - Creates the user and returns a JWT and user info
 */
export async function registerHandler(req: Request, res: Response) {
  const { email, password, fullName } = req.body as {
    email?: string;
    password?: string;
    fullName?: string;
  };

  if (!email || !password || !fullName) {
    return res
      .status(400)
      .json({ error: "email, password and fullName required" });
  }

  // Basic normalization
  const normEmail = email.trim().toLowerCase();

  const existing = await findUserByEmail(normEmail);
  if (existing) {
    return res.status(409).json({ error: "email already in use" });
  }

  try {
    const user = await createUserWithPassword(
      normEmail,
      fullName.trim(),
      password
    );
    const token = signJwt({ userId: user.id });
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "failed to create user" });
  }
}

/**
 * Login with email and password. Returns JWT and user info on success.
 */
export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  try {
    const user = await verifyCredentials(email.trim().toLowerCase(), password);
    if (!user) return res.status(401).json({ error: "invalid credentials" });

    const token = signJwt({ userId: user.id });
    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal error" });
  }
}

export default {
  registerHandler,
  loginHandler,
};
