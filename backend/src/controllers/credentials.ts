import { Request, Response } from "express";
import {
  createUserWithPassword,
  verifyCredentials,
  findUserByEmail,
} from "../services/credentialsService";
import { signJwt, verifyJwt } from "../utils/jwt";
import { JWT_COOKIE_NAME, JWT_COOKIE_MAX_AGE } from "../config";
import logger from "../utils/logger";

/**
 * Register a new user with email, password and full name.
 * - Validates input
 * - Ensures email is not already registered
 * - Creates the user and returns a JWT and user info
 */
export async function registerHandler(req: Request, res: Response) {
  logger.debug("[auth][credentials] registerHandler invoked");
  const { email, password, fullName } = req.body as {
    email?: string;
    password?: string;
    fullName?: string;
  };

  if (!email || !password || !fullName) {
    logger.warn("[auth][credentials] registerHandler missing fields", {
      hasEmail: Boolean(email),
      hasPassword: Boolean(password),
      hasFullName: Boolean(fullName),
    });
    return res
      .status(400)
      .json({ error: "email, password and fullName required" });
  }

  // Basic normalization
  const normEmail = email.trim().toLowerCase();

  const existing = await findUserByEmail(normEmail);
  if (existing) {
    logger.warn(
      `[auth][credentials] registerHandler email already in use: ${normEmail}`
    );
    return res.status(409).json({ error: "email already in use" });
  }

  try {
    logger.debug(`[auth][credentials] create user attempt for ${normEmail}`);
    const user = await createUserWithPassword(
      normEmail,
      fullName.trim(),
      password
    );
    const token = signJwt({ userId: user.id });

    // Set HttpOnly cookie so the client doesn't need to store the token
    res.cookie(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: JWT_COOKIE_MAX_AGE,
    });

    logger.info(
      `[auth][credentials] registerHandler success userId=${user.id}`
    );
    return res
      .status(201)
      .json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    logger.error("[auth][credentials] registerHandler error", { err });
    return res.status(500).json({ error: "failed to create user" });
  }
}

/**
 * Login with email and password. Returns JWT and user info on success.
 */
export async function loginHandler(req: Request, res: Response) {
  logger.debug("[auth][credentials] loginHandler invoked");
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    logger.warn("[auth][credentials] loginHandler missing fields", {
      hasEmail: Boolean(email),
      hasPassword: Boolean(password),
    });
    return res.status(400).json({ error: "email and password required" });
  }

  try {
    const normalized = email.trim().toLowerCase();
    logger.debug(`[auth][credentials] login attempt for ${normalized}`);
    const user = await verifyCredentials(normalized, password);
    if (!user) {
      logger.warn(`[auth][credentials] login failed for ${normalized}`);
      return res.status(401).json({ error: "invalid credentials" });
    }

    const token = signJwt({ userId: user.id });
    res.cookie(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: JWT_COOKIE_MAX_AGE,
    });
    logger.info(`[auth][credentials] login success userId=${user.id}`);
    return res.json({ user });
  } catch (err) {
    logger.error("[auth][credentials] loginHandler error", { err });
    return res.status(500).json({ error: "internal error" });
  }
}

/**
 * GET /auth/me
 * Read session cookie, verify JWT, and return user info when authenticated.
 */
export async function meHandler(req: Request, res: Response) {
  try {
    logger.debug("[auth][credentials] meHandler invoked");
    const token = req.cookies?.[JWT_COOKIE_NAME] as string | undefined;
    logger.debug("[auth][credentials] meHandler cookie info", {
      cookiePresent: Boolean(token),
      cookieName: JWT_COOKIE_NAME,
    });

    if (!token) {
      logger.debug(
        "[auth][credentials] meHandler no token - returning unauthenticated"
      );
      return res.json({ authenticated: false });
    }

    const payload = verifyJwt<any>(token);
    logger.debug("[auth][credentials] meHandler verify result", {
      status: payload ? "ok" : "invalid",
    });
    if (!payload) return res.json({ authenticated: false });

    if (payload.userId) {
      const user = await findUserByEmail(payload.email ?? "");
      // If we can't find by email, try to return id from payload
      logger.debug(
        "[auth][credentials] meHandler returning authenticated user",
        {
          userId: payload.userId,
          hasUserRecord: Boolean(user),
        }
      );
      return res.json({
        authenticated: true,
        user: user ? user : { id: payload.userId },
      });
    }

    // Fallback: return payload when present
    return res.json({ authenticated: true, payload });
  } catch (err) {
    logger.error("[auth][credentials] meHandler error", { err });
    return res.status(500).json({ error: "internal" });
  }
}

export default {
  registerHandler,
  loginHandler,
};
