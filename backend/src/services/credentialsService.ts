import { db } from "../db";
import { users } from "../db/schema/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import logger from "../utils/logger";

export type User = {
  id: string;
  email: string | null;
  name: string | null;
};

/**
 * Find a user and credential by email.
 */
export async function findUserByEmail(email: string) {
  try {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    const found = rows[0] ?? null;
    logger.debug(
      `[auth][credentials] findUserByEmail email=${email} -> ${
        found ? "found" : "not-found"
      }`
    );
    return found;
  } catch (err) {
    logger.error(
      `[auth][credentials] findUserByEmail error for email=${email}`,
      { err }
    );
    throw err;
  }
}

/**
 * Create user and store hashed password.
 */
export async function createUserWithPassword(
  email: string,
  fullName: string,
  password: string
) {
  const hash = await bcrypt.hash(password, 10);
  try {
    logger.debug(
      `[auth][credentials] createUserWithPassword attempt email=${email}`
    );
    const created = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name: fullName,
        passwordHash: hash,
      })
      .returning();

    if (!created || created.length === 0)
      throw new Error("failed to create user");

    const row = created[0] as any;
    logger.info(
      `[auth][credentials] createUserWithPassword success userId=${row.id}`
    );
    return {
      id: row.id as string,
      email: row.email as string | null,
      name: row.name as string | null,
    };
  } catch (err) {
    logger.error(
      `[auth][credentials] createUserWithPassword error email=${email}`,
      { err }
    );
    throw err;
  }
}

/**
 * Verify credentials by email/password. Returns user on success, null otherwise.
 */
export async function verifyCredentials(email: string, password: string) {
  try {
    logger.debug(
      `[auth][credentials] verifyCredentials attempt email=${email}`
    );

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    const row = rows[0];
    if (!row || !row.passwordHash) {
      logger.debug(
        `[auth][credentials] verifyCredentials no user or no password for email=${email}`
      );
      return null;
    }

    const ok = await bcrypt.compare(password, row.passwordHash as string);
    if (!ok) {
      logger.debug(
        `[auth][credentials] verifyCredentials invalid password for email=${email}`
      );
      return null;
    }

    logger.info(
      `[auth][credentials] verifyCredentials success userId=${row.id}`
    );
    return {
      id: row.id as string,
      email: row.email as string | null,
      name: row.name as string | null,
    };
  } catch (err) {
    logger.error(`[auth][credentials] verifyCredentials error email=${email}`, {
      err,
    });
    throw err;
  }
}
